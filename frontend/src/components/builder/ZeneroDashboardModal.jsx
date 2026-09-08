import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ZeneroDashboardPanel from "@/components/builder/ZeneroDashboardPanel";

export const ZeneroDashboardModal = ({ open, onClose, projectId }) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent
      className="bg-transparent border-none p-0 max-w-4xl max-h-[85vh] overflow-y-auto"
      data-testid="zenero-dashboard-modal"
    >
      <DialogTitle className="sr-only">Zenero content dashboard</DialogTitle>
      <ZeneroDashboardPanel projectId={projectId} />
    </DialogContent>
  </Dialog>
);
