"use client";

import React, { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";

export default function BaseEditor({ articleHtml }: { articleHtml: string }) {
  const [content, setContent] = useState(articleHtml);

  useEffect(() => {
    setContent(articleHtml);
  }, [articleHtml]);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    setContent(evt.currentTarget.innerHTML);
    console.log(content);
  };

  return (
    <div className="grid grid-cols-[1fr_600px] h-screen overflow-hidden">
      <div className="overflow-auto">
        <ContentEditable
          className="p-4 focus:outline-none"
          html={content}
          disabled={false}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
