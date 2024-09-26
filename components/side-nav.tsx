"use client";

import { cn } from "@/lib/utils";
import { Autocomplete, Button, Stack, TextField } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import wiki from "wikipedia";

export default function SideNav() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const defaultTitles = ["Virginia Tech", "Blacksburg, Virginia", "Hokiebird"]
  const [titles, setTitles] = useState<Array<string>>();
  const [potentialWikiArticles, setPotentialWikiArticles] = useState<Array<string>>([])

  useEffect(() => {
    const storedTitles = localStorage.getItem("titles");
    if (storedTitles === null || storedTitles === undefined || storedTitles === "") {
      setTitles(defaultTitles)
    } else {
      setTitles(JSON.parse(storedTitles));
    }
  }, []);

  useEffect(() => {
    if (titles) {
      localStorage.setItem("titles", JSON.stringify(titles));
    }
  }, [titles]);

  const handleSearch = (title: string) => {
    if (titles?.every((currTitle) => currTitle !== title)) {
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
        <Autocomplete
          disablePortal
          options={potentialWikiArticles}
          className="w-full p-2 mb-4 border rounded"
          sx={{ backgroundColor: "white" }}
          renderInput={(params) => <TextField {...params} label="Search Wikipedia articles" />}
          onChange={(e, newValue) => {
            if (newValue) {
              handleSearch(newValue);
            }
          }}
          onInputChange={(e, newInputValue) => {
            if (newInputValue) {
              wiki.search(newInputValue, { suggestion: true, limit: 10 }).then((data) => {
                setPotentialWikiArticles(data.results.map((result) => result.title))
              });
            }
          }}
        />
      </form>
      <ul className="space-y-2">
        {titles && titles.map((title) => (
          <li key={title}>
            <Stack spacing={1} direction="row">
              <button
                onClick={() => handleSearch(title)}
                className={cn(
                  "w-full text-left px-2 py-1 rounded hover:bg-gray-100",
                  searchParams.get("title") === title ? "bg-gray-100" : ""
                )}
              >
                {title}
              </button>
              <Button color="error" variant="contained" onClick={() => {
                setTitles(titles.filter((currTitle) => currTitle !== title))
              }}>
                Delete
              </Button>
            </Stack>
          </li>
        ))}
      </ul>
    </nav>
  );
}
