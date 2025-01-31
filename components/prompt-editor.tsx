"use client";

import React, { useEffect } from "react";
import ChatContainer from "./chat-container";
import WikiViewer from "./wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";
import useEditorStore from "@/lib/store/editorStore";
import GuideContainer from "./guide-container";

export default function PromptEditor({
  articleHtml,
  articleTitle,
  paragraphName,
}: {
  articleHtml: string;
  articleTitle: string;
  paragraphName?: string;
}) {
  const { setContentHtml } = useEditorStore();
  const isLocked = useEditorStore((state) => state.isLocked);
  const rightPanel = useEditorStore((state) => state.rightPanel);
  useEffect(() => {
    const currentContentHtml = useEditorStore.getState().contentHtml;
    if (currentContentHtml === "") {
      setContentHtml(articleHtml, "LOAD_ARTICLE");
    }
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
      <WikiViewer articleTitle={articleTitle} paragraphName={paragraphName} />

      <div className="flex flex-col h-full w-[500px] flex-shrink-0 border-l">
        <EditModeSwitch />
        {rightPanel === "chat" ? (
          <ChatContainer condition="prompt" />
        ) : (
          <GuideContainer articleTitle={articleTitle} />
        )}
      </div>
    </div>
  );
}
