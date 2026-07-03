use serde::Serialize;
use std::io::{BufReader, Read, Seek, SeekFrom};
use std::path::Path;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, StandardTagKey};
use symphonia::core::probe::Hint;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RecordingMeta {
    pub file_path: String,
    pub file_name: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub comment: Option<String>,
    pub originator: Option<String>,
    pub originator_reference: Option<String>,
    pub time_reference: Option<i64>,
    pub bwf_description: Option<String>,
    pub recorded_at: Option<String>,
    pub duration_seconds: Option<f64>,
    pub sample_rate: Option<i64>,
    pub bit_depth: Option<i64>,
    pub channels: Option<i64>,
    pub format: Option<String>,
    pub file_size_bytes: Option<i64>,
}

struct BextFields {
    description: Option<String>,
    originator: Option<String>,
    originator_reference: Option<String>,
    time_reference: Option<i64>,
    recorded_at: Option<String>,
}

// Read a fixed-size null-padded ASCII field, returning None if empty.
fn trim_fixed(bytes: &[u8]) -> Option<String> {
    let end = bytes.iter().position(|&b| b == 0).unwrap_or(bytes.len());
    let s = std::str::from_utf8(&bytes[..end]).ok()?.trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

// Walk RIFF chunks to find and parse the BWF bext chunk.
// Returns None for non-WAV files or WAV files without a bext chunk.
fn parse_bext(file_path: &str) -> Option<BextFields> {
    let file = std::fs::File::open(file_path).ok()?;
    let mut r = BufReader::new(file);

    // Validate RIFF/WAVE header (12 bytes).
    let mut hdr = [0u8; 12];
    r.read_exact(&mut hdr).ok()?;
    if &hdr[0..4] != b"RIFF" || &hdr[8..12] != b"WAVE" {
        return None;
    }

    loop {
        let mut id = [0u8; 4];
        if r.read_exact(&mut id).is_err() {
            break;
        }
        let mut sz = [0u8; 4];
        if r.read_exact(&mut sz).is_err() {
            break;
        }
        let size = u32::from_le_bytes(sz) as usize;

        if &id == b"bext" {
            // bext layout through TimeReference requires at least 346 bytes.
            if size < 346 {
                break;
            }
            let mut data = vec![0u8; size];
            r.read_exact(&mut data).ok()?;

            let description = trim_fixed(&data[0..256]);
            let originator = trim_fixed(&data[256..288]);
            let originator_reference = trim_fixed(&data[288..320]);
            let date_str = trim_fixed(&data[320..330]); // "YYYY-MM-DD"
            let time_str = trim_fixed(&data[330..338]); // "HH:MM:SS"

            let tr_raw = u64::from_le_bytes(data[338..346].try_into().ok()?);
            // Treat 0 as unset — a recording genuinely starting at midnight is
            // indistinguishable from a field left blank by the recorder.
            let time_reference = if tr_raw == 0 {
                None
            } else {
                Some(tr_raw as i64)
            };

            let recorded_at = match (&date_str, &time_str) {
                (Some(d), Some(t)) => Some(format!("{}T{}", d, t)),
                (Some(d), None) => Some(d.clone()),
                _ => None,
            };

            return Some(BextFields {
                description,
                originator,
                originator_reference,
                time_reference,
                recorded_at,
            });
        } else {
            // RIFF chunks are padded to a 2-byte boundary.
            let skip = size + (size & 1);
            r.seek(SeekFrom::Current(skip as i64)).ok()?;
        }
    }

    None
}

pub fn extract_metadata_sync(file_path: &str) -> Result<RecordingMeta, String> {
    let path = Path::new(file_path);

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(file_path)
        .to_string();

    let format_str = match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .as_deref()
    {
        Some("wav") => Some("wav".to_string()),
        Some("mp3") => Some("mp3".to_string()),
        _ => None,
    };

    let file_size_bytes = std::fs::metadata(file_path)
        .map(|m| m.len() as i64)
        .ok();

    // BWF bext chunk — WAV only, separate file open to avoid consuming the stream.
    let bext = if format_str.as_deref() == Some("wav") {
        parse_bext(file_path)
    } else {
        None
    };

    // Symphonia probe for codec parameters and embedded tags.
    let file = std::fs::File::open(file_path).map_err(|e| e.to_string())?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());

    let mut hint = Hint::new();
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        hint.with_extension(ext);
    }

    let probed = symphonia::default::get_probe()
        .format(
            &hint,
            mss,
            &FormatOptions::default(),
            &MetadataOptions::default(),
        )
        .map_err(|e| format!("unsupported format: {e}"))?;

    let mut format = probed.format;

    // Extract codec params while the track borrow is alive, then release it.
    let (n_frames, time_base, sample_rate, bit_depth, channels) = {
        let track = format
            .tracks()
            .iter()
            .find(|t| t.codec_params.codec != symphonia::core::codecs::CODEC_TYPE_NULL)
            .ok_or("no audio track found")?;
        (
            track.codec_params.n_frames,
            track.codec_params.time_base,
            track.codec_params.sample_rate.map(|r| r as i64),
            track.codec_params.bits_per_sample.map(|b| b as i64),
            track.codec_params.channels.map(|c| c.count() as i64),
        )
    };

    let duration_seconds = match (n_frames, time_base) {
        (Some(frames), Some(tb)) => {
            Some(frames as f64 * tb.numer as f64 / tb.denom as f64)
        }
        _ => None,
    };

    // Extract title/artist/comment from embedded tags (ID3, RIFF INFO, etc.).
    let mut title: Option<String> = None;
    let mut artist: Option<String> = None;
    let mut comment: Option<String> = None;

    {
        let meta = format.metadata();
        if let Some(rev) = meta.current() {
            for tag in rev.tags() {
                match tag.std_key {
                    Some(StandardTagKey::TrackTitle) if title.is_none() => {
                        title = Some(tag.value.to_string());
                    }
                    Some(StandardTagKey::Artist) if artist.is_none() => {
                        artist = Some(tag.value.to_string());
                    }
                    Some(StandardTagKey::Comment) if comment.is_none() => {
                        comment = Some(tag.value.to_string());
                    }
                    _ => {}
                }
            }
        }
    }

    let (bwf_description, originator, originator_reference, time_reference, recorded_at) =
        bext.map_or((None, None, None, None, None), |b| {
            (
                b.description,
                b.originator,
                b.originator_reference,
                b.time_reference,
                b.recorded_at,
            )
        });

    Ok(RecordingMeta {
        file_path: file_path.to_string(),
        file_name,
        title,
        artist,
        comment,
        originator,
        originator_reference,
        time_reference,
        bwf_description,
        recorded_at,
        duration_seconds,
        sample_rate,
        bit_depth,
        channels,
        format: format_str,
        file_size_bytes,
    })
}

#[tauri::command]
pub async fn extract_metadata(file_path: String) -> Result<RecordingMeta, String> {
    tauri::async_runtime::spawn_blocking(move || extract_metadata_sync(&file_path))
        .await
        .map_err(|e| e.to_string())?
}
