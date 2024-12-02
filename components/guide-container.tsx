import useEditorStore from "@/lib/store/editorStore";
import NormsList from "./norms-list";
import ResourceList from "./resource-list";

export default function GuideContainer() {
  const rightPanel = useEditorStore((state) => state.rightPanel);
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-col flex-1 p-4 overflow-y-auto min-h-0">
        <ResourceList />
        <div className="mt-4"></div>
        {rightPanel === "guide" && <NormsList />}
      </div>
    </div>
  );
}
