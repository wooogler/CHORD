import React, { useEffect } from "react";
import {
  Button,
  FormControlLabel,
  IconButton,
  Switch,
  Tab,
  Tabs,
} from "@mui/material";
import useEditorStore from "@/lib/store/editorStore";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import FileDownload from "@mui/icons-material/FileDownload";
import useChatStore from "@/lib/store/chatStore";

const EditModeSwitch: React.FC<{ isBaseEditor?: boolean }> = ({
  isBaseEditor = false,
}) => {
  const isEditable = useEditorStore((state) => state.isEditable);
  const rightPanel = useEditorStore((state) => state.rightPanel);
  const { getMessageLogs } = useChatStore();
  const { setIsEditable, undo, redo, getContentLogs, setRightPanel } =
    useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  const toggleEditable = () => {
    setIsEditable(!isEditable);
  };

  const handleDownloadLogs = () => {
    const contentLogs = getContentLogs();
    const messageLogs = getMessageLogs();
    const json = JSON.stringify(
      {
        createdAt: Date.now(),
        numberOfContentLogs: contentLogs.length,
        numberOfMessageLogs: messageLogs.length,
        contentLogs,
        messageLogs,
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex ml-2">
        <IconButton onClick={undo} title="Undo">
          <UndoIcon />
        </IconButton>
        <IconButton onClick={redo} title="Redo">
          <RedoIcon />
        </IconButton>
      </div>
      {rightPanel !== "guide-only" && (
        <Tabs value={rightPanel} onChange={(_, value) => setRightPanel(value)}>
          <Tab value="guide" label="Guide" />
          <Tab value="chat" label="Chat" />
        </Tabs>
      )}
      {isBaseEditor ? (
        <FormControlLabel
          control={
            <Switch
              checked={isEditable}
              onChange={toggleEditable}
              color="primary"
            />
          }
          label={isEditable ? "Edit mode ON" : "Edit mode OFF"}
        />
      ) : (
        rightPanel !== "guide-only" && (
          <Button
            variant="outlined"
            onClick={handleDownloadLogs}
            title="Download logs"
            startIcon={<FileDownload />}
          >
            Logs
          </Button>
        )
      )}
    </div>
  );
};

export default EditModeSwitch;
