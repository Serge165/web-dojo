import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from "@/components/ui/command";

// Global Ctrl+K palette. Actions are supplied by the caller (Builder.jsx)
// as groups of {id, label, shortcut, icon, onRun} — this component only
// renders and dispatches, it doesn't know what any action does, so it
// never duplicates the logic MenuBar/TopBar already own.
//
// Built on Dialog/Command directly rather than the shared CommandDialog
// wrapper — that wrapper has no title slot, which trips Radix's
// DialogContent-requires-DialogTitle a11y check every time it opens.
export const CommandPalette = ({ open, onOpenChange, groups }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="overflow-hidden p-0 bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2]">
      <DialogTitle className="sr-only">Command palette</DialogTitle>
      <DialogDescription className="sr-only">Search and run a command</DialogDescription>
      <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
        <CommandInput placeholder="Type a command or search…" data-testid="command-palette-input" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  disabled={item.disabled}
                  onSelect={() => { onOpenChange(false); item.onRun(); }}
                  data-testid={`command-item-${item.id}`}
                >
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>{item.label}</span>
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </DialogContent>
  </Dialog>
);
