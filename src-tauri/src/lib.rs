use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::DecoderOptions;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

const NUM_PEAKS: usize = 2000;

#[tauri::command]
async fn compute_peaks(file_path: String) -> Result<Vec<Vec<f32>>, String> {
    tauri::async_runtime::spawn_blocking(move || compute_peaks_sync(&file_path))
        .await
        .map_err(|e| e.to_string())?
}

fn compute_peaks_sync(file_path: &str) -> Result<Vec<Vec<f32>>, String> {
    let file = std::fs::File::open(file_path).map_err(|e| e.to_string())?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());

    let mut hint = Hint::new();
    if let Some(ext) = std::path::Path::new(file_path)
        .extension()
        .and_then(|e| e.to_str())
    {
        hint.with_extension(ext);
    }

    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &FormatOptions::default(), &MetadataOptions::default())
        .map_err(|e| format!("unsupported format: {e}"))?;

    let mut format = probed.format;

    let track = format
        .tracks()
        .iter()
        .find(|t| t.codec_params.codec != symphonia::core::codecs::CODEC_TYPE_NULL)
        .ok_or("no audio track found")?;

    let track_id = track.id;
    let n_frames = track.codec_params.n_frames.unwrap_or(0) as usize;
    let channels = track
        .codec_params
        .channels
        .map(|c| c.count())
        .unwrap_or(1);

    // Bucket size in frames; fall back to ~0.1s at 48kHz if duration unknown
    let bucket_size = if n_frames > 0 {
        (n_frames / NUM_PEAKS).max(1)
    } else {
        4800
    };

    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &DecoderOptions::default())
        .map_err(|e| e.to_string())?;

    let mut peaks: Vec<Vec<f32>> = vec![Vec::with_capacity(NUM_PEAKS + 1); channels];
    let mut bucket_max: Vec<f32> = vec![0.0f32; channels];
    let mut frame_in_bucket: usize = 0;
    let mut sample_buf: Option<SampleBuffer<f32>> = None;
    let mut done = false;

    while !done {
        let packet = match format.next_packet() {
            Ok(p) => p,
            Err(_) => break,
        };

        if packet.track_id() != track_id {
            continue;
        }

        let decoded = match decoder.decode(&packet) {
            Ok(d) => d,
            Err(_) => continue,
        };

        let spec = *decoded.spec();
        let capacity = decoded.capacity() as u64;

        if sample_buf.is_none() {
            sample_buf = Some(SampleBuffer::<f32>::new(capacity, spec));
        }

        if let Some(ref mut buf) = sample_buf {
            buf.copy_interleaved_ref(decoded);
            let samples = buf.samples();
            let n_frames_in_buf = samples.len() / channels;

            for frame_idx in 0..n_frames_in_buf {
                for ch in 0..channels {
                    let s = samples[frame_idx * channels + ch].abs();
                    if s > bucket_max[ch] {
                        bucket_max[ch] = s;
                    }
                }
                frame_in_bucket += 1;
                if frame_in_bucket >= bucket_size {
                    for ch in 0..channels {
                        peaks[ch].push(bucket_max[ch]);
                        bucket_max[ch] = 0.0;
                    }
                    frame_in_bucket = 0;
                    if peaks[0].len() >= NUM_PEAKS {
                        done = true;
                        break;
                    }
                }
            }
        }
    }

    // Flush the partial final bucket
    if frame_in_bucket > 0 && peaks[0].len() < NUM_PEAKS {
        for ch in 0..channels {
            peaks[ch].push(bucket_max[ch]);
        }
    }

    Ok(peaks)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![compute_peaks])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
