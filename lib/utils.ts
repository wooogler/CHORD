import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as cheerio from "cheerio";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapStrToColor(str: string) {
  const colors = [
    "red",
    "green",
    "yellow",
    "pink",
    "purple",
    "indigo",
    "teal",
    "amber",
    "orange",
    "lime",
    "emerald",
    "sky",
    "violet",
    "fuchsia",
    "rose",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function cleanDiffHtml(htmlString: string) {
  const $ = cheerio.load(htmlString, null, false);

  $("*").each((_, element) => {
    if ("tagName" in element) {
      const tag = element.tagName;
      if (tag !== "ins" && tag !== "del") {
        $(element).replaceWith($(element).text());
      }
    }
  });

  $("*[data-operation-index]").removeAttr("data-operation-index");
  return $.html();
}

export function cleanWikiHtml(htmlString: string) {
  const $ = cheerio.load(htmlString);
  $("sup").remove();
  return $.html();
}
