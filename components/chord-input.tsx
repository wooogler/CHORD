import React from "react";
import { mapStrToColor } from "@/lib/utils";
import htmldiff from "node-htmldiff";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import useChatStore from "@/lib/store/chatStore";

interface ChordInputProps {
  userInput: string;
  setUserInput: (input: string) => void;
  handleSubmitReply: () => void;
  handleSubmitSuggestion: () => void;
  handleEditWithActiveAgent: () => void;
  isTextSelected: boolean;
}

export default function ChordInput({
  userInput,
  setUserInput,
  handleSubmitReply,
  handleSubmitSuggestion,
  handleEditWithActiveAgent,
  isTextSelected,
}: ChordInputProps) {
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const phase = useChatStore((state) => state.phase);
  const activeAgent = useChatStore((state) => state.activeAgent);
  const { setActiveAgent } = useChatStore();

  const handleExportMessages = () => {
    const outputMessages = messages.map((message) => {
      return {
        role: message.role,
        content: message.content,
        agentName: message.agentName,
        diffHtml:
          htmldiff(
            message.originalContentHtml || "",
            message.editedContentHtml || "",
            null
          ) || undefined,
        move: message.move,
        applyStatus: message.applyStatus,
        reactions: message.reactions,
      };
    });
    const json = JSON.stringify(outputMessages, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "messages-chord.json";
    a.click();
  };

  return (
    <div
      className={`flex flex-col p-4 rounded-lg ${
        activeAgent ? `bg-${mapStrToColor(activeAgent)}-200` : ""
      }`}
    >
      <textarea
        className="w-full h-16 p-2 border rounded mb-4"
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

      <div className="flex items-center space-x-2">
        <button
          onClick={handleExportMessages}
          className="bg-gray-500 text-white px-4 py-2 rounded h-10 w-10 flex items-center justify-center"
        >
          <FileDownloadIcon />
        </button>
        {activeAgent ? (
          <>
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
          </>
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
    </div>
  );
}
