"use client";

import React, { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";
import OpenAI from "openai";
import { Stack, Typography, Box } from "@mui/material";

export default function PromptEditor({ articleHtml }: { articleHtml: string }) {
  const [content, setContent] = useState(articleHtml);
  const [selectedText, setSelectedText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [convoMessages, setConvoMessages] = useState<Array<string>>([]);
  const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPEN_API_KEY, dangerouslyAllowBrowser: true });


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

  const getPromptAnswer = () => {
    setPrompt("")
    setSelectedText("")
    const overallPrompt = 'Change this piece of text: "' + selectedText + '" by following this prompt: "' + prompt + '"'
    convoMessages.push(overallPrompt)
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that edits Wikipedia articles, following all style guides." },
        {
          role: "user",
          content: overallPrompt,
        },
      ],
    }).then((completion) => {
      if (completion.choices[0].message.content) {
        convoMessages.push(completion.choices[0].message.content as string)
      }
      setConvoMessages([...convoMessages])
    })
  }

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
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.code === "Enter") {
              getPromptAnswer()
              e.preventDefault()
            }
          }}
        />
        <button onClick={() => {
          getPromptAnswer()
        }} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Submit
        </button>
        <Stack>
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
        </Stack>
      </div>
    </div>
  );
}
