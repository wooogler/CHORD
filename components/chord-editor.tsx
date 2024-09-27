"use client";

import React, { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";

export default function ChordEditor({ articleHtml }: { articleHtml: string }) {
  const [content, setContent] = useState(articleHtml);

  useEffect(() => {
    setContent(articleHtml);
  }, [articleHtml]);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    setContent(evt.currentTarget.innerHTML);
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      // 1. Remove existing highlight
      const editor = document.getElementById("prompt-editor-content");
      if (editor) {
        // Replace all existing spans with the original content (removing highlight)
        editor.querySelectorAll(".highlight-yellow").forEach((highlight) => {
          const parent = highlight.parentNode;
          while (highlight.firstChild) {
            parent?.insertBefore(highlight.firstChild, highlight);
          }
          parent?.removeChild(highlight);
        });
      }

      // 2. Apply new highlight
      const highlightSpan = document.createElement("span");
      highlightSpan.className = "highlight-yellow";
      const selectedContent = range.extractContents();
      highlightSpan.appendChild(selectedContent);
      range.insertNode(highlightSpan);

      // Clear the selection
      selection.removeAllRanges();

      // Update the content state to reflect changes
      setContent(
        document.getElementById("prompt-editor-content")?.innerHTML || ""
      );
    }
  };

  return (
    <div className="grid grid-cols-[1fr_600px] h-full">
      <div className="h-full overflow-auto">
        <ContentEditable
          className="p-4 focus:outline-none min-h-full"
          id="prompt-editor-content"
          html={content}
          disabled={false}
          onChange={handleChange}
          onMouseUp={handleSelection}
        />
      </div>
      <div className="flex flex-col p-4 h-full">CHORD UI</div>
    </div>
  );
}
