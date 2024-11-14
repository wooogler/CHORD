import React from "react";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Message } from "./chat-container";
import htmldiff from "node-htmldiff";

interface PromptInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  isLoading: boolean;
  handleSubmitPrompt: () => void;
  isTextSelected: boolean;
  phase: "prompt" | "editing" | "conversation";
  messages: Message[];
}

export default function PromptInput({
  userInput,
  setUserInput,
  isLoading,
  handleSubmitPrompt,
  isTextSelected,
  phase,
  messages,
}: PromptInputProps) {
  const handleExportMessages = () => {
    const outputMessages = messages.map((message) => {
      return {
        role: message.role,
        content: message.content,
        diffHtml:
          htmldiff(
            message.originalContentHtml || "",
            message.editedContentHtml || "",
            null
          ) || undefined,
        applyStatus: message.applyStatus,
      };
    });
    const json = JSON.stringify(outputMessages, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "messages-prompt.json";
    a.click();
  };
  return (
    <div className="flex flex-col p-4">
      <textarea
        className="w-full h-16 p-2 border rounded mb-4"
        placeholder={
          isTextSelected
            ? "Write your prompt here..."
            : "Please select some text first..."
        }
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.code === "Enter") {
            handleSubmitPrompt();
            e.preventDefault();
          }
        }}
        disabled={isLoading || !isTextSelected || phase === "editing"}
      />
      <div className="flex items-center space-x-2">
        <button
          onClick={handleExportMessages}
          className="bg-gray-500 text-white px-4 py-2 rounded h-10 w-10 flex items-center justify-center"
        >
          <FileDownloadIcon />
        </button>
        <button
          onClick={handleSubmitPrompt}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 flex items-center justify-center flex-1 h-10"
          disabled={isLoading || !isTextSelected || phase === "editing"}
        >
          {isLoading ? (
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
          ) : phase === "editing" ? (
            "Edit"
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
}
