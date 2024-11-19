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
  const title = searchParams.get("title");
  const menu = searchParams.get("menu");

  return (
    <Link
      href={`${href}${
        title || menu
          ? `?${title ? `title=${title}` : ""}${
              menu ? `${title ? "&" : ""}menu=${menu}` : ""
            }`
          : ""
      }`}
      className={cn(
        "px-4 py-2 border-b-2 border-transparent hover:border-blue-500 text-center flex-1 text-gray-700 visited:text-gray-700 hover:text-black hover:no-underline",
        isActive && "border-blue-500"
      )}
    >
      {children}
    </Link>
  );
}
