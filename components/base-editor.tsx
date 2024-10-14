"use client";

import React, { useEffect, useState, useCallback } from "react";
import ContentEditable from "react-contenteditable";
import { Switch, FormControlLabel } from "@mui/material";
import WikiViewer from "./wiki-viewer";
import EditModeSwitch from "./edit-mode-switch";
export default function BaseEditor({
  articleHtml,
  articleTitle,
}: {
  articleHtml: string;
  articleTitle: string;
}) {
  const [content, setContent] = useState(articleHtml);
  const [isEditable, setIsEditable] = useState(true);

  const toggleEditable = () => {
    setIsEditable(!isEditable);
  };

  useEffect(() => {
    setContent(articleHtml);
  }, [articleHtml]);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    setContent(evt.currentTarget.innerHTML);
    console.log(content);
  };

  return (
    <div className="flex h-full">
      <WikiViewer
        articleTitle={articleTitle}
        content={content}
        isEditable={isEditable}
        handleChange={handleChange}
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
