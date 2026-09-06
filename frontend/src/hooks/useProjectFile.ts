/**
 * React hook for Web Dojo project file operations
 * Handles save, load, and quick save with keyboard shortcuts
 */

import { useEffect, useCallback } from 'react';
import { saveProject, loadProject, quickSave } from '../lib/projectFileHandler';

export function useProjectFile(projectData: any, onProjectLoaded?: (project: any) => void) {
  const handleSave = useCallback(async () => {
    if (!projectData) return false;
    return await saveProject(projectData);
  }, [projectData]);

  const handleOpen = useCallback(async () => {
    const project = await loadProject();
    if (project && onProjectLoaded) {
      onProjectLoaded(project);
    }
    return project;
  }, [onProjectLoaded]);

  const handleQuickSave = useCallback(
    async (filePath?: string) => {
      if (!projectData) return false;
      return await quickSave(projectData, filePath);
    },
    [projectData]
  );

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+S / Ctrl+S: Quick Save
      if (cmdKey && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
      }

      // Cmd+Shift+S / Ctrl+Shift+S: Save As
      if (cmdKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSave();
      }

      // Cmd+O / Ctrl+O: Open
      if (cmdKey && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleOpen, handleQuickSave]);

  return {
    save: handleSave,
    open: handleOpen,
    quickSave: handleQuickSave,
  };
}
