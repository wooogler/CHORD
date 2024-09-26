"use client";

import ConditionNav from "@/components/condition-nav";
import SideNav from "@/components/side-nav";
import { usePathname, useRouter, useSearchParams } from "next/navigation";


interface EditorLayoutProps {
  children: React.ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (title: string) => {
    const params = new URLSearchParams(searchParams);
    if (title) {
      params.set("title", title);
    } else {
      params.delete("title");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <main className="grid grid-cols-[250px_1fr] min-h-screen p-8 gap-4">
      <aside className="border rounded-lg p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Wikipedia Articles</h2>
        <form>
          <input
            type="search"
            placeholder="Search Wikipedia articles"
            className="w-full p-2 mb-4 border rounded"
            onKeyDown={(e) => {
              if (e.code === "Enter") {
                //@ts-expect-error there is a value present
                handleSearch(e.target.value)
                e.preventDefault()
              }
            }}
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
