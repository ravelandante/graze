use crate::metadata::{extract_metadata_sync, RecordingMeta};
use crate::scan::is_audio_file;
use notify::{EventKind, RecommendedWatcher, Watcher};
use tauri::Emitter;
use notify_debouncer_full::{new_debouncer, DebounceEventResult, DebouncedEvent, Debouncer, FileIdMap};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use tauri::AppHandle;

#[derive(Serialize, Clone)]
struct FilesRemovedPayload {
    paths: Vec<String>,
}

pub struct WatcherState(pub Mutex<Option<Debouncer<RecommendedWatcher, FileIdMap>>>);

impl Default for WatcherState {
    fn default() -> Self {
        WatcherState(Mutex::new(None))
    }
}

fn handle_events(app: &AppHandle, events: Vec<DebouncedEvent>) {
    let mut created: Vec<PathBuf> = Vec::new();
    let mut removed: Vec<PathBuf> = Vec::new();

    for event in &events {
        let paths = &event.event.paths;
        match event.event.kind {
            EventKind::Create(_) => {
                for p in paths {
                    if is_audio_file(p) {
                        created.push(p.clone());
                    }
                }
            }
            EventKind::Remove(_) => {
                for p in paths {
                    if is_audio_file(p) {
                        removed.push(p.clone());
                    }
                }
            }
            _ => {}
        }
    }

    created.sort();
    created.dedup();
    removed.sort();
    removed.dedup();

    if !created.is_empty() {
        let metas: Vec<RecordingMeta> = created
            .iter()
            .filter_map(|p| p.to_str())
            .filter_map(|s| extract_metadata_sync(s).ok())
            .collect();
        if !metas.is_empty() {
            let _ = app.emit("library:files-added", &metas);
        }
    }

    if !removed.is_empty() {
        let paths: Vec<String> = removed
            .iter()
            .filter_map(|p| p.to_str().map(str::to_owned))
            .collect();
        let _ = app.emit("library:files-removed", FilesRemovedPayload { paths });
    }
}

fn init_watcher_if_needed(
    guard: &mut Option<Debouncer<RecommendedWatcher, FileIdMap>>,
    app: &AppHandle,
) -> Result<(), String> {
    if guard.is_some() {
        return Ok(());
    }
    let app = app.clone();
    *guard = Some(
        new_debouncer(
            Duration::from_millis(500),
            None,
            move |result: DebounceEventResult| match result {
                Ok(events) => handle_events(&app, events),
                Err(errors) => {
                    for e in errors {
                        eprintln!("Watch error: {e:?}");
                    }
                }
            },
        )
        .map_err(|e| e.to_string())?,
    );
    Ok(())
}

#[tauri::command]
pub async fn watch_paths(
    paths: Vec<String>,
    app: AppHandle,
    state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    init_watcher_if_needed(&mut guard, &app)?;
    let debouncer = guard.as_mut().unwrap();
    for path in &paths {
        let p = std::path::Path::new(path);
        if p.exists() {
            debouncer
                .watcher()
                .watch(p, notify::RecursiveMode::Recursive)
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn unwatch_folder(
    path: String,
    state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(debouncer) = guard.as_mut() {
        let _ = debouncer
            .watcher()
            .unwatch(std::path::Path::new(&path));
    }
    Ok(())
}
