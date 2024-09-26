"use client";

import React, { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";
import OpenAI from "openai";
import { Stack, Typography, Box } from "@mui/material";

export default function PromptEditor({ articleHtml }: { articleHtml: string }) {
  const [content, setContent] = useState(articleHtml);
  const [prompt, setPrompt] = useState("");

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
        // Replace all existing spans with the original content (removing highlight)
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

      // Clear the selection
      selection.removeAllRanges();

      // Update the content state to reflect changes
      setContent(
        document.getElementById("prompt-editor-content")?.innerHTML || ""
      );
    }
  };

  // const getPromptAnswer = () => {
  //   setPrompt("")
  //   setSelectedText("")
  //   const overallPrompt = 'Change this piece of text: "' + selectedText + '" by following this prompt: "' + prompt + '"'
  //   convoMessages.push(overallPrompt)
  //   openai.chat.completions.create({
  //     model: "gpt-4o-mini",
  //     messages: [
  //       { role: "system", content: "You are a helpful assistant that edits Wikipedia articles, following all style guides." },
  //       {
  //         role: "user",
  //         content: overallPrompt,
  //       },
  //     ],
  //   }).then((completion) => {
  //     if (completion.choices[0].message.content) {
  //       convoMessages.push(completion.choices[0].message.content as string)
  //     }
  //     setConvoMessages([...convoMessages])
  //   })
  // }

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
              // getPromptAnswer()
              e.preventDefault();
            }
          }}
        />
        <button
          onClick={() => {
            // getPromptAnswer()
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit
        </button>
        {/* <Stack>
          {convoMessages.map((message, index) => {
            return (
              <Box
                key={message}
                sx={{
                  m: 1,
                  maxWidth: "80%", borderRadius: 5,
                  backgroundColor: index % 2 === 0 ? "white" : "cornsilk",
                  alignSelf: index % 2 === 0 ? "self-end" : null
                }}
              >
                <Typography sx={{ m: 1, mx: 2, overflow: "auto", color: "black" }}>
                  {message}
                </Typography>
              </Box>
            )
          })}
        </Stack> */}
      </div>
    </div>
  );
}
