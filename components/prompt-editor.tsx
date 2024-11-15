"use client";

import React, { useEffect } from "react";
import ChatContainer from "./chat-container";
import WikiViewer from "./wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";
import useEditorStore from "@/lib/store/editorStore";

export default function PromptEditor({
  articleHtml,
  articleTitle,
}: {
  articleHtml: string;
  articleTitle: string;
}) {
  const { setContentHtml } = useEditorStore();
  const isLocked = useEditorStore((state) => state.isLocked);

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

  return (
    <div className="flex h-full">
      <WikiViewer articleTitle={articleTitle} />
      <div className="flex flex-col h-full w-[500px] flex-shrink-0">
        <EditModeSwitch />
        <ChatContainer condition="prompt" />
      </div>
    </div>
  );
}
