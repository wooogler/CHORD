"use client";

import React, { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";
import OpenAI from "openai";
import { Stack, Typography, Box } from "@mui/material";
import { editArticleWithPrompt } from "@/lib/llm";

export default function PromptEditor({ articleHtml }: { articleHtml: string }) {
  const [content, setContent] = useState(articleHtml);
  const [selectedHtml, setSelectedHtml] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setContent(articleHtml);
  }, [articleHtml]);

  const handleChange = (evt: React.FormEvent<HTMLDivElement>) => {
    setContent(evt.currentTarget.innerHTML);
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);

      // 1. Remove existing highlight
      const editor = document.getElementById("prompt-editor-content");
      if (editor) {
        editor.querySelectorAll(".highlight-yellow").forEach((highlight) => {
          const parent = highlight.parentNode;
          while (highlight.firstChild) {
            parent?.insertBefore(highlight.firstChild, highlight);
          }
          parent?.removeChild(highlight);
        });
      }

      // 2. Apply new highlight
      const highlightSpan = document.createElement("span");
      highlightSpan.className = "highlight-yellow";
      const selectedContent = range.extractContents();
      highlightSpan.appendChild(selectedContent);

      range.insertNode(highlightSpan);

      selection.removeAllRanges();

      setContent(
        document.getElementById("prompt-editor-content")?.innerHTML || ""
      );
      setSelectedHtml(highlightSpan.innerHTML);

      const spinnerSpan = document.createElement("span");
      spinnerSpan.className =
        "inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 hidden spinner";
      highlightSpan.appendChild(spinnerSpan);
    }
  };

  const handleSubmit = async () => {
    if (!selectedHtml || !prompt) return;

    setIsLoading(true);
    try {
      // Show spinner
      const highlightedSpan = document.querySelector(".highlight-yellow");
      if (highlightedSpan) {
        const spinner = highlightedSpan.querySelector(".spinner");
        if (spinner) spinner.classList.remove("hidden");
      }

      const editedHtml = await editArticleWithPrompt({
        articleHtml: selectedHtml,
        userPrompt: prompt,
      });
      setContent((prevContent) => {
        // Create a temporary DOM element
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = prevContent;

        // Find the span element with the highlight-yellow class
        const highlightedSpan = tempDiv.querySelector("span.highlight-yellow");

        if (highlightedSpan) {
          // Create a new span element
          const newSpan = document.createElement("span");
          newSpan.className = "highlight-green";
          newSpan.innerHTML = editedHtml || "";

          // Replace the existing element with the new one
          highlightedSpan.parentNode?.replaceChild(newSpan, highlightedSpan);

          // Return the modified HTML
          return tempDiv.innerHTML;
        }

        // If no matching element is found, return the original content
        return prevContent;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setSelectedHtml("");
      setPrompt("");
    }
  };

  return (
    <div className="grid grid-cols-[1fr_600px] h-full">
      <div className="h-full overflow-auto">
        <ContentEditable
          className="p-4 focus:outline-none min-h-full"
          id="prompt-editor-content"
          html={content}
          disabled={false}
          onChange={handleChange}
          onMouseUp={handleSelection}
        />
      </div>
      <div className="flex flex-col p-4 h-full">
        <textarea
          className="w-full h-32 p-2 border rounded mb-4"
          placeholder="Write your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === "Enter") {
              handleSubmit();
              e.preventDefault();
            }
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
}
