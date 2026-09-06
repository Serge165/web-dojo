/**
 * Web Dojo .webdj File Format Handler
 * Save and load complete Web Dojo projects in ZIP-based format
 *
 * A .webdj is a ZIP holding five JSON documents plus an optional assets/
 * folder:
 *   project.json   name, version, timestamps, active page
 *   pages.json     every page with its elements, head, background, fonts, JS
 *   blocks.json    the active page's elements (convenience/compat copy)
 *   theme.json     template, fonts, canvas background
 *   settings.json  preferences, editor state, project files
 *   assets/        binary assets, one file each
 *
 * Tauri-only: the dialog and fs plugins have no browser equivalent. Guard
 * calls with isTauri() from this module.
 */

import { save, open } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import JSZip from "jszip";

const WEBDJ_VERSION = "1.0.0";

/** True when running inside the Tauri desktop shell rather than a browser. */
export function isTauri() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Serialize a project into .webdj ZIP bytes.
 * Shared by saveProject and quickSave so the two paths cannot drift.
 */
async function buildWebdjZip(projectData) {
  const zip = new JSZip();

  zip.file("project.json", JSON.stringify({
    version: WEBDJ_VERSION,
    name: projectData.name,
    description: projectData.description || "",
    created: projectData.created || new Date().toISOString(),
    modified: new Date().toISOString(),
    author: projectData.author || "Unknown",
    projectId: projectData.projectId ?? null,
    activePageId: projectData.activePageId ?? null,
  }, null, 2));

  zip.file("theme.json", JSON.stringify(projectData.theme || {}, null, 2));
  zip.file("blocks.json", JSON.stringify({ blocks: projectData.blocks || [] }, null, 2));
  zip.file("pages.json", JSON.stringify({ pages: projectData.pages || [] }, null, 2));
  zip.file("settings.json", JSON.stringify({
    preferences: projectData.preferences || {},
    lastEdit: new Date().toISOString(),
    editorState: projectData.editorState || {},
    files: projectData.files || [],
  }, null, 2));

  // Binary assets live as real files in the archive, never inlined into JSON.
  if (projectData.assets && projectData.assets.length > 0) {
    const assetsFolder = zip.folder("assets");
    for (const asset of projectData.assets) {
      assetsFolder?.file(asset.filename, asset.data);
    }
  }

  return zip.generateAsync({ type: "uint8array" });
}

/**
 * Save Web Dojo project as .webdj file.
 * Shows a native save dialog. Returns the chosen path, or null if cancelled.
 */
export async function saveProject(projectData) {
  try {
    const filePath = await save({
      defaultPath: `${projectData.name || "untitled"}.webdj`,
      filters: [{ name: "Web Dojo Project", extensions: ["webdj"] }],
      title: "Save Web Dojo Project",
    });

    if (!filePath) return null;

    const normalizedPath = ensureWebdjExtension(filePath);
    await writeFile(normalizedPath, await buildWebdjZip(projectData));

    showNotification("success", `Project saved: ${getFilenameFromPath(normalizedPath)}`);
    return normalizedPath;
  } catch (error) {
    console.error("Save error:", error);
    showNotification("error", `Failed to save project: ${error}`);
    return null;
  }
}

/**
 * Save to an already-known path without prompting (Cmd+S / Ctrl+S).
 * Falls back to the Save As dialog when no file is open yet.
 * Returns the path written, or null on cancel/failure.
 */
export async function quickSave(projectData, currentFilePath) {
  if (!currentFilePath) return saveProject(projectData);

  try {
    await writeFile(currentFilePath, await buildWebdjZip(projectData));
    showNotification("success", "Project saved");
    return currentFilePath;
  } catch (error) {
    console.error("Quick save error:", error);
    showNotification("error", `Save failed: ${error}`);
    return null;
  }
}

/**
 * Load a Web Dojo project from a .webdj file.
 * Returns null when the user cancels or the file cannot be read.
 */
export async function loadProject() {
  try {
    const filePath = await open({
      filters: [{ name: "Web Dojo Project", extensions: ["webdj"] }],
      directory: false,
      multiple: false,
      title: "Open Web Dojo Project",
    });

    if (!filePath) return null;

    const zipData = await readFile(filePath);
    const zip = await new JSZip().loadAsync(zipData);

    // project.json is the only required member; a file without it is not a
    // .webdj, however well-formed the ZIP itself may be.
    const projectJson = await getJsonFromZip(zip, "project.json");
    if (!projectJson) {
      showNotification("error", "Not a valid .webdj file (missing project.json)");
      return null;
    }

    const themeJson = await getJsonFromZip(zip, "theme.json");
    const blocksJson = await getJsonFromZip(zip, "blocks.json");
    const pagesJson = await getJsonFromZip(zip, "pages.json");
    const settingsJson = await getJsonFromZip(zip, "settings.json");

    const project = {
      ...projectJson,
      theme: themeJson || {},
      blocks: blocksJson?.blocks || [],
      pages: pagesJson?.pages || [],
      preferences: settingsJson?.preferences || {},
      editorState: settingsJson?.editorState || {},
      files: settingsJson?.files || [],
      assets: await getAssetsFromZip(zip),
      filePath,
    };

    showNotification("success", `Loaded: ${project.name}`);
    return project;
  } catch (error) {
    console.error("Load error:", error);
    showNotification("error", `Failed to load project: ${error}`);
    return null;
  }
}

/** Read and parse one JSON member of the archive; null if absent or invalid. */
async function getJsonFromZip(zip, filename) {
  try {
    const file = zip.file(filename);
    if (!file) return null;
    return JSON.parse(await file.async("text"));
  } catch (error) {
    console.warn(`Could not parse ${filename}:`, error);
    return null;
  }
}

/** Read every file under assets/ into memory. */
async function getAssetsFromZip(zip) {
  const assetsFolder = zip.folder("assets");
  if (!assetsFolder) return [];

  const assets = [];
  const promises = [];

  assetsFolder.forEach((relativePath, file) => {
    if (file.dir) return;
    promises.push((async () => {
      assets.push({
        filename: relativePath,
        data: await file.async("uint8array"),
        path: `assets/${relativePath}`,
      });
    })());
  });

  await Promise.all(promises);
  return assets;
}

function ensureWebdjExtension(path) {
  return path.endsWith(".webdj") ? path : `${path}.webdj`;
}

export function getFilenameFromPath(path) {
  return path.split(/[/\\]/).pop() || "project.webdj";
}

/** Surface a message to the UI; Builder listens for this on `document`. */
function showNotification(type, message) {
  document.dispatchEvent(new CustomEvent("notification", { detail: { type, message } }));
}

export const projectFileHandler = {
  isTauri,
  saveProject,
  loadProject,
  quickSave,
  getFilenameFromPath,
};
