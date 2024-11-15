import React from "react";
import { FormControlLabel, Switch } from "@mui/material";
import useEditorStore from "@/lib/store/editorStore";

const EditModeSwitch: React.FC = () => {
  const isEditable = useEditorStore((state) => state.isEditable);
  const { setIsEditable } = useEditorStore();

  const toggleEditable = () => {
    setIsEditable(!isEditable);
  };

  return (
    <FormControlLabel
      control={
        <Switch
          checked={isEditable}
          onChange={toggleEditable}
          color="primary"
        />
      }
      label={isEditable ? "Edit mode ON" : "Edit mode OFF"}
      className="mb-4"
    />
  );
};

export default EditModeSwitch;
