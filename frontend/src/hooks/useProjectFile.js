/**
 * React hook for Web Dojo .webdj project file operations.
 *
 * Owns the path of the currently-open .webdj so Ctrl+S can write straight back
 * to it. Deliberately registers no keyboard listener of its own — Builder
 * already binds Ctrl+S/Ctrl+O and a second listener would double-fire.
 */

import { useCallback, useState } from "react";
import { saveProject, loadProject, quickSave, getFilenameFromPath } from "../lib/projectFileHandler";

export function useProjectFile(getProjectData, onProjectLoaded) {
  const [filePath, setFilePath] = useState(null);

  /** Save As: always prompts for a location. */
  const saveAs = useCallback(async () => {
    const data = getProjectData();
    if (!data) return null;
    const path = await saveProject(data);
    if (path) setFilePath(path);
    return path;
  }, [getProjectData]);

  /** Write back to the open file, or prompt if none is open yet. */
  const save = useCallback(async () => {
    const data = getProjectData();
    if (!data) return null;
    const path = await quickSave(data, filePath || undefined);
    if (path) setFilePath(path);
    return path;
  }, [getProjectData, filePath]);

  const open = useCallback(async () => {
    const project = await loadProject();
    if (!project) return null;
    setFilePath(project.filePath || null);
    onProjectLoaded?.(project);
    return project;
  }, [onProjectLoaded]);

  /** Forget the open file, e.g. after File > New. */
  const reset = useCallback(() => setFilePath(null), []);

  return {
    save,
    saveAs,
    open,
    reset,
    filePath,
    fileName: filePath ? getFilenameFromPath(filePath) : null,
  };
}
