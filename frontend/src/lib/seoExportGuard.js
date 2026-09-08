import { toast } from "sonner";
import { collectExportSeoWarnings } from "@/lib/seoScore";

// Shared by every HTML-producing export entry point (TopBar's quick-export
// dropdown, ImportExportModal's Export & Send tab) so a page can't drift
// out of sync with the others the way exportHtml.js/server.py's SEO
// builders did. Warns, never blocks — per-spec "warn but allow export".
export const warnAboutSeoThenRun = (project, run) => {
  const warnings = collectExportSeoWarnings(project);
  if (warnings.length) {
    toast.warning(`SEO check: ${warnings.join(" · ")}`, { duration: 6000 });
  }
  run();
};
