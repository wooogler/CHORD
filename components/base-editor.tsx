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
    <div className="grid grid-cols-[1fr_600px] h-screen overflow-hidden">
      <WikiViewer
        articleTitle={articleTitle}
        content={content}
        isEditable={isEditable}
        handleChange={handleChange}
      />
      <div className="flex flex-col h-full">
        <EditModeSwitch
          isEditable={isEditable}
          toggleEditable={toggleEditable}
        />
      </div>
    </div>
  );
}
