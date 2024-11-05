import React from "react";
import { Message } from "./chat-container";
import { mapStrToColor } from "@/lib/utils";

interface ChordInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  isLoading: boolean;
  activeAgent: string | null;
  setActiveAgent: (agent: string | null) => void;
  handleSubmitReply: () => void;
  handleSubmitSuggestion: () => void;
  handleEditWithActiveAgent: () => void;
  messages: Message[];
  isTextSelected: boolean;
  phase: "prompt" | "editing" | "conversation";
}

export default function ChordInput({
  userInput,
  setUserInput,
  isLoading,
  activeAgent,
  setActiveAgent,
  handleSubmitReply,
  handleSubmitSuggestion,
  handleEditWithActiveAgent,
  messages,
  isTextSelected,
  phase,
}: ChordInputProps) {
  return (
    <div
      className={`flex flex-col p-4 rounded-lg ${
        activeAgent ? `bg-${mapStrToColor(activeAgent)}-200` : ""
      }`}
    >
      <textarea
        className="w-full h-32 p-2 border rounded mb-4"
        placeholder={
          isTextSelected
            ? "Write your suggestion here..."
            : "Please select some text first..."
        }
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.code === "Enter") {
            if (activeAgent) {
              handleSubmitReply();
            } else {
              handleSubmitSuggestion();
            }
            e.preventDefault();
          }
        }}
        disabled={
          isLoading || !isTextSelected || (phase === "editing" && !activeAgent)
        }
      />

      {activeAgent ? (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSubmitReply}
            className={`text-white px-4 py-2 rounded flex font-bold items-center justify-center flex-1 h-10 bg-${mapStrToColor(
              activeAgent
            )}-600`}
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
            ) : (
              `Reply to ${activeAgent}`
            )}
          </button>
          {!messages[messages.length - 1].activeAgent ? (
            <button
              className="text-white px-4 py-2 rounded bg-red-600 font-bold w-20"
              onClick={() => setActiveAgent(null)}
            >
              Cancel
            </button>
          ) : (
            <button
              className="text-white px-4 py-2 rounded bg-blue-600 font-bold w-20"
              onClick={handleEditWithActiveAgent}
            >
              Edit
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleSubmitSuggestion}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center flex-1 h-10 disabled:bg-gray-300"
          disabled={isLoading || !isTextSelected || phase === "editing"}
        >
          {isLoading ? (
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
          ) : phase === "editing" ? (
            "Edit or Reply"
          ) : (
            "Submit"
          )}
        </button>
      )}
    </div>
  );
}
