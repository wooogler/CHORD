import ConditionNav from "@/components/condition-nav";
import SideNav from "@/components/side-nav";
import Link from "next/link";
import wiki from "wikipedia";

interface EditorLayoutProps {
  children: React.ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <main className="grid grid-cols-[250px_1fr] min-h-screen p-8 gap-4">
      <aside className="border rounded-lg p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Wikipedia Articles</h2>
        <form>
          <input
            type="search"
            placeholder="Search Wikipedia articles"
            className="w-full p-2 mb-4 border rounded"
          />
        </form>
        <SideNav />
      </aside>
      <div className="flex flex-col">
        <ConditionNav />
        <article className="border-x border-b rounded-b-lg p-4 overflow-y-auto flex-grow">
          {children}
        </article>
      </div>
    </main>
  );
}
