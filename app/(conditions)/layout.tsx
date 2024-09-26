"use client";

import ConditionNav from "@/components/condition-nav";
import SideNav from "@/components/side-nav";

interface EditorLayoutProps {
  children: React.ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <main className="grid grid-cols-[250px_1fr] h-screen p-8 gap-4">
      <aside className="border rounded-lg p-4 overflow-y-auto">
        <SideNav />
      </aside>
      <div className="flex flex-col h-full overflow-hidden">
        <ConditionNav />
        <article className="border-x border-b rounded-b-lg p-4 flex-grow overflow-hidden">
          {children}
        </article>
      </div>
    </main>
  );
}
