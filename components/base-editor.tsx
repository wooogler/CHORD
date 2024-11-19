"use client";

import React, { useEffect } from "react";
import BaseWikiViewer from "./base-wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";
import useEditorStore from "@/lib/store/editorStore";
export default function BaseEditor({
  articleHtml,
  articleTitle,
}: {
  articleHtml: string;
  articleTitle: string;
}) {
  const { setContentHtml } = useEditorStore();
  const isEditable = useEditorStore((state) => state.isEditable);
  const contentHtml = useEditorStore((state) => state.contentHtml);

  useEffect(() => {
    setContentHtml(articleHtml, "LOAD_ARTICLE");
  }, [articleHtml]);

  return (
    <div className="flex h-full">
      <BaseWikiViewer
        articleTitle={articleTitle}
        contentHtml={contentHtml}
        isEditable={isEditable}
      />
      <div className="flex flex-col h-full min-h-0 w-[500px] flex-shrink-0 border-l">
        <EditModeSwitch isBaseEditor={true} />
      </div>
    </div>
  );
}
