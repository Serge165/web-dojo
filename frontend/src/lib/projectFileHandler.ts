/**
 * Web Dojo .webdj File Format Handler
 * Save and load complete Web Dojo projects in ZIP-based format
 */

import { save, open } from '@tauri-apps/plugin-dialog';
import { readBinaryFile, writeBinaryFile } from '@tauri-apps/plugin-fs';
import JSZip from 'jszip';

/**
 * Save Web Dojo project as .webdj file
 * Shows native file save dialog
 */
export async function saveProject(projectData: any): Promise<boolean> {
  try {
    const filePath = await save({
      defaultPath: `${projectData.name || 'untitled'}.webdj`,
      filters: [
        {
          name: 'Web Dojo Project',
          extensions: ['webdj'],
        },
      ],
      title: 'Save Web Dojo Project',
    });

    if (!filePath) {
      console.log('Save cancelled');
      return false;
    }

    const normalizedPath = ensureWebdjExtension(filePath);
    const zip = new JSZip();

    // Add project.json
    zip.file(
      'project.json',
      JSON.stringify(
        {
          version: '1.0.0',
          name: projectData.name,
          description: projectData.description || '',
          created: projectData.created || new Date().toISOString(),
          modified: new Date().toISOString(),
          author: projectData.author || 'Unknown',
          projectId: projectData.projectId,
          pages: projectData.pages || [],
        },
        null,
        2
      )
    );

    // Add theme.json
    zip.file('theme.json', JSON.stringify(projectData.theme || {}, null, 2));

    // Add blocks.json
    zip.file(
      'blocks.json',
      JSON.stringify(
        {
          blocks: projectData.blocks || [],
        },
        null,
        2
      )
    );

    // Add pages.json
    zip.file(
      'pages.json',
      JSON.stringify(
        {
          pages: projectData.pages || [],
        },
        null,
        2
      )
    );

    // Add settings.json
    zip.file(
      'settings.json',
      JSON.stringify(
        {
          preferences: projectData.preferences || {},
          lastEdit: new Date().toISOString(),
          editorState: projectData.editorState || {},
        },
        null,
        2
      )
    );

    // Handle embedded assets
    if (projectData.assets && projectData.assets.length > 0) {
      const assetsFolder = zip.folder('assets');
      for (const asset of projectData.assets) {
        assetsFolder?.file(asset.filename, asset.data);
      }
    }

    // Generate and write ZIP
    const zipData = await zip.generateAsync({ type: 'uint8array' });
    await writeBinaryFile(normalizedPath, zipData);

    console.log(`✓ Project saved: ${normalizedPath}`);
    showNotification('success', `Project saved: ${getFilenameFromPath(normalizedPath)}`);
    return true;
  } catch (error) {
    console.error('Save error:', error);
    showNotification('error', `Failed to save project: ${error}`);
    return false;
  }
}

/**
 * Load Web Dojo project from .webdj file
 */
export async function loadProject(): Promise<any> {
  try {
    const filePath = await open({
      filters: [
        {
          name: 'Web Dojo Project',
          extensions: ['webdj'],
        },
      ],
      directory: false,
      title: 'Open Web Dojo Project',
    });

    if (!filePath) {
      console.log('Open cancelled');
      return null;
    }

    const zipData = await readBinaryFile(filePath as string);
    const zip = new JSZip();
    await zip.loadAsync(zipData);

    // Extract JSON files
    const projectJson = await getJsonFromZip(zip, 'project.json');
    const themeJson = await getJsonFromZip(zip, 'theme.json');
    const blocksJson = await getJsonFromZip(zip, 'blocks.json');
    const pagesJson = await getJsonFromZip(zip, 'pages.json');
    const settingsJson = await getJsonFromZip(zip, 'settings.json');

    // Extract assets
    const assets = await getAssetsFromZip(zip);

    // Assemble project object
    const project = {
      ...projectJson,
      theme: themeJson,
      blocks: blocksJson?.blocks || [],
      pages: pagesJson?.pages || [],
      preferences: settingsJson?.preferences || {},
      editorState: settingsJson?.editorState || {},
      assets: assets,
      filePath: filePath,
    };

    console.log(`✓ Project loaded: ${getFilenameFromPath(filePath as string)}`);
    showNotification('success', `Loaded: ${project.name}`);
    return project;
  } catch (error) {
    console.error('Load error:', error);
    showNotification('error', `Failed to load project: ${error}`);
    return null;
  }
}

/**
 * Quick save to existing file (Cmd+S / Ctrl+S)
 * If no file open, shows Save As dialog
 */
export async function quickSave(projectData: any, currentFilePath?: string): Promise<boolean> {
  if (currentFilePath) {
    try {
      const zip = new JSZip();

      zip.file(
        'project.json',
        JSON.stringify(
          {
            ...projectData,
            modified: new Date().toISOString(),
          },
          null,
          2
        )
      );
      zip.file('theme.json', JSON.stringify(projectData.theme || {}, null, 2));
      zip.file('blocks.json', JSON.stringify({ blocks: projectData.blocks || [] }, null, 2));
      zip.file('pages.json', JSON.stringify({ pages: projectData.pages || [] }, null, 2));
      zip.file(
        'settings.json',
        JSON.stringify(
          {
            preferences: projectData.preferences || {},
            lastEdit: new Date().toISOString(),
            editorState: projectData.editorState || {},
          },
          null,
          2
        )
      );

      if (projectData.assets && projectData.assets.length > 0) {
        const assetsFolder = zip.folder('assets');
        for (const asset of projectData.assets) {
          assetsFolder?.file(asset.filename, asset.data);
        }
      }

      const zipData = await zip.generateAsync({ type: 'uint8array' });
      await writeBinaryFile(currentFilePath, zipData);

      console.log(`✓ Quick saved: ${getFilenameFromPath(currentFilePath)}`);
      showNotification('success', 'Project saved');
      return true;
    } catch (error) {
      console.error('Quick save error:', error);
      showNotification('error', `Save failed: ${error}`);
      return false;
    }
  } else {
    return await saveProject(projectData);
  }
}

/**
 * Extract JSON from ZIP file
 */
async function getJsonFromZip(zip: JSZip, filename: string): Promise<any> {
  try {
    const file = zip.file(filename);
    if (!file) return null;
    const text = await file.async('text');
    return JSON.parse(text);
  } catch (error) {
    console.warn(`Could not parse ${filename}:`, error);
    return null;
  }
}

/**
 * Extract all assets from assets/ folder in ZIP
 */
async function getAssetsFromZip(zip: JSZip): Promise<any[]> {
  const assets: any[] = [];
  const assetsFolder = zip.folder('assets');

  if (!assetsFolder) return assets;

  const promises: Promise<void>[] = [];

  assetsFolder.forEach((relativePath, file) => {
    if (!file.dir) {
      promises.push(
        (async () => {
          const data = await file.async('uint8array');
          assets.push({
            filename: relativePath,
            data: data,
            path: `assets/${relativePath}`,
          });
        })()
      );
    }
  });

  await Promise.all(promises);
  return assets;
}

/**
 * Ensure filename has .webdj extension
 */
function ensureWebdjExtension(path: string): string {
  if (!path.endsWith('.webdj')) {
    return path + '.webdj';
  }
  return path;
}

/**
 * Extract filename from full path
 */
function getFilenameFromPath(path: string): string {
  return path.split(/[/\\]/).pop() || 'project.webdj';
}

/**
 * Show user notification (success/error/info)
 */
function showNotification(type: 'success' | 'error' | 'info', message: string): void {
  console.log(`[${type.toUpperCase()}] ${message}`);

  // Dispatch custom event for UI to handle
  const event = new CustomEvent('notification', {
    detail: { type, message },
  });
  document.dispatchEvent(event);
}

// Export all functions for use in components
export const projectFileHandler = {
  saveProject,
  loadProject,
  quickSave,
  showNotification,
};
