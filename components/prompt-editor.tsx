"use client";

import React, { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";

export default function PromptEditor({ articleHtml }: { articleHtml: string }) {
  const [content, setContent] = useState(articleHtml);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    setContent(articleHtml);
  }, [articleHtml]);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    setContent(evt.currentTarget.innerHTML);
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  return (
    <div className="grid grid-cols-[1fr_600px] h-screen overflow-hidden">
      <div className="overflow-auto">
        <ContentEditable
          className="p-4 focus:outline-none"
          html={content}
          disabled={false}
          onChange={handleChange}
          onMouseUp={handleSelection}
        />
      </div>
      <div className="flex flex-col p-4 sticky top-0 h-screen">
        <textarea
          className="w-full h-32 p-2 border rounded mb-4"
          placeholder="Write your prompt here..."
          value={selectedText}
          onChange={(e) => setSelectedText(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Submit
        </button>
      </div>
    </div>
  );
}
