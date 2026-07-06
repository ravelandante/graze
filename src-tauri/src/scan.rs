use crate::metadata::{extract_metadata_sync, RecordingMeta};
use std::path::Path;
use walkdir::WalkDir;

pub fn is_audio_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_ascii_lowercase())
            .as_deref(),
        Some("wav") | Some("mp3")
    )
}

fn scan_folder_sync(folder: &str) -> Vec<RecordingMeta> {
    WalkDir::new(folder)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file() && is_audio_file(e.path()))
        .filter_map(|e| e.path().to_str().map(str::to_owned))
        .filter_map(|p| extract_metadata_sync(&p).ok())
        .collect()
}

#[tauri::command]
pub async fn scan_folder(path: String) -> Result<Vec<RecordingMeta>, String> {
    tauri::async_runtime::spawn_blocking(move || Ok(scan_folder_sync(&path)))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn paths_exist(paths: Vec<String>) -> Result<Vec<bool>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        Ok(paths.iter().map(|p| Path::new(p).exists()).collect())
    })
    .await
    .map_err(|e| e.to_string())?
}
