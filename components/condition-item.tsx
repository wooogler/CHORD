import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export default function ConditionItem({
  children,
  href,
  isActive,
}: {
  children: React.ReactNode;
  href: string;
  isActive: boolean;
}) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams();

  if (searchParams.get("title"))
    params.set("title", searchParams.get("title")!);
  if (searchParams.get("oldid"))
    params.set("oldid", searchParams.get("oldid")!);
  if (searchParams.get("menu")) params.set("menu", searchParams.get("menu")!);

  const queryString = params.toString();

  return (
    <Link
      href={`${href}${queryString ? `?${queryString}` : ""}`}
      className={cn(
        "px-4 py-2 border-b-2 border-transparent hover:border-blue-500 text-center flex-1 text-gray-700 visited:text-gray-700 hover:text-black hover:no-underline",
        isActive && "border-blue-500"
      )}
    >
      {children}
    </Link>
  );
}
