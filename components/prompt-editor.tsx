"use client";

import React, { useEffect, useState } from "react";
import ChatContainer from "./chat-container";
import WikiViewer from "./wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";
export default function PromptEditor({
  articleHtml,
  articleTitle,
}: {
  articleHtml: string;
  articleTitle: string;
}) {
  const [contentHtml, setContentHtml] = useState(articleHtml);
  const [selectedHtml, setSelectedHtml] = useState("");
  const [isEditable, setIsEditable] = useState(true);

  useEffect(() => {
    setContentHtml(articleHtml);
  }, [articleHtml]);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    setContentHtml(evt.currentTarget.innerHTML);
  };

  const handleSelection = () => {
    if (!isEditable) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      // 1. Remove existing highlight
      const editor = document.getElementById("prompt-editor-content");
      if (editor) {
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

      selection.removeAllRanges();

      setContentHtml(
        document.getElementById("prompt-editor-content")?.innerHTML || ""
      );
      setSelectedHtml(highlightSpan.innerHTML);

      const spinnerSpan = document.createElement("span");
      spinnerSpan.className =
        "inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 hidden spinner";
      highlightSpan.appendChild(spinnerSpan);
    }
  };

  const toggleEditable = () => {
    setIsEditable(!isEditable);
  };

  return (
    <div className="flex h-full">
      <WikiViewer
        content={contentHtml}
        isEditable={isEditable}
        handleChange={handleChange}
        handleSelection={handleSelection}
        articleTitle={articleTitle}
      />
      <div className="flex flex-col h-full w-[500px] flex-shrink-0">
        <EditModeSwitch
          isEditable={isEditable}
          toggleEditable={toggleEditable}
        />
        <ChatContainer
          selectedHtml={selectedHtml}
          setSelectedHtml={setSelectedHtml}
          setContentHtml={setContentHtml}
          condition="prompt"
        />
      </div>
    </div>
  );
}
