import React from "react";

interface PromptInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  isLoading: boolean;
  handleSubmitPrompt: () => void;
  isTextSelected: boolean;
  phase: "prompt" | "editing" | "conversation";
}

export default function PromptInput({
  userInput,
  setUserInput,
  isLoading,
  handleSubmitPrompt,
  isTextSelected,
  phase,
}: PromptInputProps) {
  return (
    <div className="flex flex-col p-4">
      <textarea
        className="w-full h-32 p-2 border rounded mb-4"
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
