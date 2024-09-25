"use client";

import ConditionItem from "./condition-item";
import { usePathname } from "next/navigation";

export default function ConditionNav() {
  const pathname = usePathname();
  return (
    <div className="flex border-b w-full">
      <ConditionItem href="/base" isActive={pathname === "/base"}>
        Baseline
      </ConditionItem>
      <ConditionItem href="/prompt" isActive={pathname === "/prompt"}>
        Prompt
      </ConditionItem>
      <ConditionItem href="/chord" isActive={pathname === "/chord"}>
        CHORD
      </ConditionItem>
    </div>
  );
}
