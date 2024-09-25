"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SideNav() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const titles = ["Virginia Tech", "blacksburg, Virginia", "HokieBird"];

  const handleSearch = (title: string) => {
    console.log(title);
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
