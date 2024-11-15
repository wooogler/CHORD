"use client";

import React, { useEffect, useState } from "react";
import ChatContainer from "./chat-container";
import WikiViewer from "./wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";

export default function ChordEditor({
  articleHtml,
  articleTitle,
}: {
  articleHtml: string;
  articleTitle: string;
}) {
  const [contentHtml, setContentHtml] = useState(articleHtml);
  const [selectedHtml, setSelectedHtml] = useState("");
  const [isEditable, setIsEditable] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setContentHtml(articleHtml);
  }, [articleHtml]);

  useEffect(() => {
    const editor = document.getElementById("prompt-editor-content");
    if (editor) {
      const highlights = editor.querySelectorAll(
        ".highlight-yellow, .highlight-gray"
      );
      highlights.forEach((highlight) => {
        if (isLocked) {
          highlight.className = "highlight-gray";
        } else {
          highlight.className = "highlight-yellow";
        }
      });
    }
  }, [isLocked]);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    if (isLocked || !isEditable) return;
    setContentHtml(evt.currentTarget.innerHTML);
  };

  const handleSelection = () => {
    if (!isEditable || isLocked) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      // 1. Remove existing highlight
      const editor = document.getElementById("prompt-editor-content");
      if (editor) {
        // Replace all existing spans with the original content (removing highlight)
        editor
          .querySelectorAll(
            ".highlight-yellow, .highlight-gray, .highlight-green"
          )
          .forEach((highlight) => {
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
      setContentHtml(
        document.getElementById("prompt-editor-content")?.innerHTML || ""
      );
      setSelectedHtml(highlightSpan.innerHTML);
    }
  };

  const toggleEditable = () => {
    setIsEditable(!isEditable);
  };

  return (
    <div className="flex h-full">
      <WikiViewer
        contentHtml={contentHtml}
        isEditable={isEditable}
        setContentHtml={setContentHtml}
        setSelectedHtml={setSelectedHtml}
        isLocked={isLocked}
        handleSelection={handleSelection}
        articleTitle={articleTitle}
      />
      <div className="flex flex-col h-full min-h-0 w-[500px] flex-shrink-0">
        <EditModeSwitch
          isEditable={isEditable}
          toggleEditable={toggleEditable}
        />

        <ChatContainer
          selectedHtml={selectedHtml}
          setSelectedHtml={setSelectedHtml}
          setContentHtml={setContentHtml}
          condition="chord"
          setIsLocked={setIsLocked}
        />
      </div>
    </div>
  );
}
