import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import EcommerceOrdersPanel from "@/components/builder/EcommerceOrdersPanel";

export const EcommerceDashboardModal = ({ open, onClose, projectId }) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent
      className="bg-transparent border-none p-0 max-w-4xl max-h-[85vh] overflow-y-auto"
      data-testid="ecommerce-dashboard-modal"
    >
      <DialogTitle className="sr-only">E-commerce dashboard</DialogTitle>
      <EcommerceOrdersPanel projectId={projectId} />
    </DialogContent>
  </Dialog>
);
