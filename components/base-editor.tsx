"use client";

import React, { useState } from "react";
import ContentEditable from "react-contenteditable";

export default function BaseEditor({ articleHtml }: { articleHtml: string }) {
  const [content, setContent] = useState(articleHtml);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    setContent(evt.currentTarget.innerHTML);
    console.log(content);
  };

  return (
    <div className="grid grid-cols-[1fr_600px]">
      <ContentEditable
        className="p-4"
        html={content}
        disabled={false} // Set to true to make it read-only
        onChange={handleChange}
      />
      <div>(Chat for Chord)</div>
    </div>
  );
}
