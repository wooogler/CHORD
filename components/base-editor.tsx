"use client";

import React, { useEffect, useState } from "react";
import BaseWikiViewer from "./base-wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";
export default function BaseEditor({
  articleHtml,
  articleTitle,
}: {
  articleHtml: string;
  articleTitle: string;
}) {
  const [contentHtml, setContentHtml] = useState(articleHtml);
  const [isEditable, setIsEditable] = useState(true);

  const toggleEditable = () => {
    setIsEditable(!isEditable);
  };

  useEffect(() => {
    setContentHtml(articleHtml);
  }, [articleHtml]);

  return (
    <div className="flex h-full">
      <BaseWikiViewer
        articleTitle={articleTitle}
        contentHtml={contentHtml}
        isEditable={isEditable}
      />
      <div className="flex flex-col h-full min-h-0 w-[500px] flex-shrink-0">
        <EditModeSwitch
          isEditable={isEditable}
          toggleEditable={toggleEditable}
        />
      </div>
    </div>
  );
}
