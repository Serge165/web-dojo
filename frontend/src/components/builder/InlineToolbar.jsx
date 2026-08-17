import React, { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Link as LinkIcon, RemoveFormatting, Heading1, Heading2 } from "lucide-react";

// Floating toolbar shown above an inline-edited element. Uses the legacy
// document.execCommand API which still works across every current browser
// for basic rich-text edits and is far simpler than reimplementing selection.
export const InlineToolbar = ({ targetRef }) => {
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  const barRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const el = targetRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top + window.scrollY - 44, left: rect.left + window.scrollX });
    };
    update();
    const onScroll = () => update();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", update);
    };
  }, [targetRef]);

  const exec = (cmd, value = null) => {
    // Ensure the contentEditable element keeps focus before executing.
    targetRef.current?.focus();
    // eslint-disable-next-line no-restricted-syntax
    document.execCommand(cmd, false, value);
  };

  const addLink = () => {
    const href = prompt("Enter URL", "https://");
    if (href) exec("createLink", href);
  };

  const changeHeading = (tag) => {
    exec("formatBlock", tag);
  };

  return (
    <div
      ref={barRef}
      className="fixed z-50 flex items-center gap-0.5 p-1 rounded-md border border-[#2B2B2B] bg-[#141414] shadow-xl"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()} // don't blur the editable target
      data-testid="inline-toolbar"
    >
      <TBtn onClick={() => exec("bold")} testId="rt-bold" title="Bold (Cmd+B)"><Bold size={13} /></TBtn>
      <TBtn onClick={() => exec("italic")} testId="rt-italic" title="Italic (Cmd+I)"><Italic size={13} /></TBtn>
      <TBtn onClick={() => exec("underline")} testId="rt-underline" title="Underline (Cmd+U)"><Underline size={13} /></TBtn>
      <span className="w-px h-4 bg-[#2B2B2B] mx-0.5" />
      <TBtn onClick={() => changeHeading("H1")} testId="rt-h1" title="Heading 1"><Heading1 size={13} /></TBtn>
      <TBtn onClick={() => changeHeading("H2")} testId="rt-h2" title="Heading 2"><Heading2 size={13} /></TBtn>
      <TBtn onClick={() => changeHeading("P")} testId="rt-p" title="Paragraph"><span className="text-[11px] font-semibold">P</span></TBtn>
      <span className="w-px h-4 bg-[#2B2B2B] mx-0.5" />
      <TBtn onClick={addLink} testId="rt-link" title="Insert link"><LinkIcon size={13} /></TBtn>
      <TBtn onClick={() => exec("removeFormat")} testId="rt-clear" title="Clear formatting"><RemoveFormatting size={13} /></TBtn>
    </div>
  );
};

const TBtn = ({ children, onClick, title, testId }) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    data-testid={testId}
    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#1F1F1F] text-gray-200"
  >{children}</button>
);
