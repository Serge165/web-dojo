import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CodeEditor } from "./CodeEditor";

const LANG_BY_EXT = {
  html: "html", htm: "html", css: "css", scss: "scss", less: "less",
  js: "javascript", jsx: "javascript", mjs: "javascript", ts: "typescript", tsx: "typescript",
  json: "json", md: "markdown", svg: "xml", xml: "xml", yml: "yaml", yaml: "yaml", txt: "plaintext",
};
const languageFor = (path) => LANG_BY_EXT[(path || "").split(".").pop().toLowerCase()] || "plaintext";

// Lets a file created in the project's file tree actually be edited — it
// was previously just a named placeholder with no way to put content into
// it (the only way content ever landed in a tree file was drag/upload).
export const FileEditorModal = ({ file, onClose, onChange, onSave }) => (
  <Dialog open={!!file} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-4xl w-[90vw] h-[80vh] flex flex-col" data-testid="file-editor-modal">
      <DialogHeader>
        <DialogTitle className="font-mono text-sm truncate">{file?.path}</DialogTitle>
        <DialogDescription className="sr-only">Edit the contents of this project file.</DialogDescription>
      </DialogHeader>
      <div className="flex-1 min-h-0 border border-[#332D22] rounded overflow-hidden">
        {file && (
          <CodeEditor
            value={file.content || ""}
            onChange={(v) => onChange(file.id, v)}
            language={languageFor(file.path)}
            onSave={onSave}
            testId="file-editor"
          />
        )}
      </div>
    </DialogContent>
  </Dialog>
);
