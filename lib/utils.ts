import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
    "stone",
    "amber",
    "orange",
    "lime",
    "emerald",
    "cyan",
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
