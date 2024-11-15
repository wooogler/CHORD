"use client";

import React, { useEffect } from "react";
import ChatContainer from "./chat-container";
import WikiViewer from "./wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";
import useEditorStore from "@/lib/store/editorStore";
import useChatStore from "@/lib/store/chatStore";

export default function ChordEditor({
  articleHtml,
  articleTitle,
}: {
  articleHtml: string;
  articleTitle: string;
}) {
  const { setContentHtml } = useEditorStore();
  const { setMessages } = useChatStore();
  const isLocked = useEditorStore((state) => state.isLocked);

  useEffect(() => {
    setContentHtml(articleHtml);
    setMessages([]);
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
      <div className="flex flex-col h-full min-h-0 w-[500px] flex-shrink-0">
        <EditModeSwitch />

        <ChatContainer condition="chord" />
      </div>
    </div>
  );
}
