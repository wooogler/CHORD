"use client";

import React, { useEffect } from "react";
import ChatContainer from "./chat-container";
import WikiViewer from "./wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";
import useEditorStore from "@/lib/store/editorStore";
import useChatStore from "@/lib/store/chatStore";

export default function PromptEditor({
  articleHtml,
  articleTitle,
}: {
  articleHtml: string;
  articleTitle: string;
}) {
  const { setContentHtml, emptyContentLogs } = useEditorStore();
  const { emptyChatStore } = useChatStore();
  const isLocked = useEditorStore((state) => state.isLocked);

  useEffect(() => {
    setContentHtml(articleHtml, "LOAD_ARTICLE");
    emptyContentLogs();
    emptyChatStore();
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
      <div className="flex flex-col h-full w-[500px] flex-shrink-0 border-l">
        <EditModeSwitch />
        <ChatContainer condition="prompt" />
      </div>
    </div>
  );
}
