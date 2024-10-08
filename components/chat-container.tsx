"use client";

import { editArticleWithPrompt } from "@/lib/llm";
import React, { useState } from "react";

export default function ChatContainer({
  selectedHtml,
  setSelectedHtml,
  setContentHtml,
  condition,
}: {
  selectedHtml: string;
  setSelectedHtml: React.Dispatch<React.SetStateAction<string>>;
  setContentHtml: React.Dispatch<React.SetStateAction<string>>;
  condition: "prompt" | "chord";
}) {
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
    }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedHtml || !userInput) return;

    setIsLoading(true);
    if (condition === "prompt") {
      try {
        // Show spinner
        const highlightedSpan = document.querySelector(".highlight-yellow");
        if (highlightedSpan) {
          const spinner = highlightedSpan.querySelector(".spinner");
          if (spinner) spinner.classList.remove("hidden");
        }

        const editedHtml = await editArticleWithPrompt({
          articleHtml: selectedHtml,
          userInput: userInput,
        });

        setContentHtml((prevContentHtml: string) => {
          // Create a temporary DOM element
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = prevContentHtml;

          // Find the span element with the highlight-yellow class
          const highlightedSpan = tempDiv.querySelector(
            "span.highlight-yellow"
          );

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
          return prevContentHtml;
        });

        setMessages([
          ...messages,
          { role: "user", content: userInput },
          { role: "assistant", content: editedHtml },
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
        setSelectedHtml("");
        setUserInput("");
      }
    } else if (condition === "chord") {
      try {
        setMessages([
          ...messages,
          { role: "user", content: userInput },
          { role: "assistant", content: "chord messages" },
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col p-4">
        <div className="flex flex-col space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[70%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-200 text-black self-start"
              }`}
              dangerouslySetInnerHTML={{ __html: message.content }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col p-4 h-full justify-end">
        <textarea
          className="w-full h-32 p-2 border rounded mb-4"
          placeholder="Write your prompt here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
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
