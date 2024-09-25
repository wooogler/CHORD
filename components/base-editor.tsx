"use client";

import React, { useState } from "react";

export default function BaseEditor({ articleHtml }: { articleHtml: string }) {
  const [content, setContent] = useState(articleHtml);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    setContent(evt.currentTarget.innerHTML);
  };

  return (
    <div className="grid grid-cols-[1fr_600px]">
      <div
        dangerouslySetInnerHTML={{ __html: articleHtml }}
        contentEditable
        className="p-4"
      />
      <div>(Chat for Chord)</div>
    </div>
  );
}
