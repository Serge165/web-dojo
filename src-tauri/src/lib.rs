use std::sync::Mutex;

use tauri::{Manager, RunEvent};
use tauri_plugin_shell::{process::CommandChild, process::CommandEvent, ShellExt};

/// Holds the running backend sidecar's child handle so it can be killed
/// explicitly on app exit (Tauri does not do this automatically for
/// sidecars spawned in `.setup()`).
struct SidecarProcess(Mutex<Option<CommandChild>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    // Required by the .webdj project format: native file pickers plus the
    // read/write calls that back them.
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Resolve the OS-appropriate app data directory for the sidecar's
      // SQLite database (e.g. ~/.local/share/com.webdojo.app on Linux).
      let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
      std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
      let sqlite_path = app_data_dir.join("webdojo.db");

      let (mut rx, child) = app
        .shell()
        .sidecar("webdojo-backend")
        .expect("failed to create sidecar command")
        .env("DB_BACKEND", "sqlite")
        .env("SQLITE_PATH", sqlite_path.to_string_lossy().to_string())
        // The webview's origin differs by platform: Linux and macOS serve the
        // app from the custom protocol `tauri://localhost`, while Windows and
        // Android use `http://tauri.localhost`. Allow both rather than
        // cfg-ing per target — a wrong entry here fails every request as a
        // CORS preflight rejection, which surfaces only as "Network Error".
        .env("CORS_ORIGINS", "tauri://localhost,http://tauri.localhost")
        .spawn()
        .expect("failed to spawn backend sidecar");

      app.manage(SidecarProcess(Mutex::new(Some(child))));

      // Forward sidecar stdout/stderr into Tauri's logger instead of
      // letting the pipes fill up and block the child process.
      tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
          match event {
            CommandEvent::Stdout(line) => {
              log::info!("[backend] {}", String::from_utf8_lossy(&line));
            }
            CommandEvent::Stderr(line) => {
              log::warn!("[backend] {}", String::from_utf8_lossy(&line));
            }
            CommandEvent::Error(err) => {
              log::error!("[backend] error: {err}");
            }
            CommandEvent::Terminated(payload) => {
              log::warn!("[backend] exited: {:?}", payload);
            }
            _ => {}
          }
        }
      });

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app_handle, event| {
      // Explicitly kill the sidecar when the app is closing; PyInstaller
      // binaries are not children of Tauri's process group in a way that
      // guarantees automatic cleanup on every platform.
      if let RunEvent::ExitRequested { .. } = event {
        if let Some(state) = app_handle.try_state::<SidecarProcess>() {
          if let Some(child) = state.0.lock().unwrap().take() {
            let _ = child.kill();
          }
        }
      }
    });
}
