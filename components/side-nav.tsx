"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SideNav() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [titles, setTitles] = useState<Array<string>>([
    "Virginia Tech",
    "Blacksburg, Virginia",
    "Hokiebird",
  ]);

  useEffect(() => {
    let storedTitles = localStorage.getItem("titles");
    if (storedTitles === null || storedTitles === "") {
      storedTitles = "[]";
    }
    setTitles(JSON.parse(storedTitles));
  }, []);

  useEffect(() => {
    localStorage.setItem("titles", JSON.stringify(titles));
  }, [titles]);

  const handleSearch = (title: string) => {
    if (titles.every((currTitle) => currTitle !== title)) {
      titles.push(title);
      setTitles([...titles]);
    }
    const params = new URLSearchParams(searchParams);
    if (title) {
      params.set("title", title);
    } else {
      params.delete("title");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <nav>
      <h2 className="text-lg font-bold mb-4">Wikipedia Articles</h2>
      <form>
        <input
          type="search"
          placeholder="Search Wikipedia articles"
          className="w-full p-2 mb-4 border rounded"
          onKeyDown={(e) => {
            if (e.code === "Enter") {
              //@ts-expect-error there is a value present
              handleSearch(e.target.value);
              e.preventDefault();
            }
          }}
        />
      </form>
      <ul className="space-y-2">
        {titles.map((title) => (
          <li key={title}>
            <button
              onClick={() => handleSearch(title)}
              className={cn(
                "w-full text-left px-2 py-1 rounded hover:bg-gray-100",
                searchParams.get("title") === title ? "bg-gray-100" : ""
              )}
            >
              {title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
