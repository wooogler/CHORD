import React from "react";
import { FormControlLabel, Switch } from "@mui/material";

interface EditModeSwitchProps {
  isEditable: boolean;
  toggleEditable: () => void;
}

const EditModeSwitch: React.FC<EditModeSwitchProps> = ({
  isEditable,
  toggleEditable,
}) => {
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
