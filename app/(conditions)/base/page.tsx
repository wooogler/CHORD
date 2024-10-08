import BaseEditor from "@/components/base-editor";
import { getArticleHtmlByTitle } from "@/lib/wiki";

export default async function BasePage({
  searchParams,
}: {
  searchParams?: {
    title?: string;
  };
}) {
  const title = searchParams?.title || "";
  let articleHtml = "";

  if (title) {
    articleHtml = (await getArticleHtmlByTitle(title)) || "";
  }

  return <BaseEditor articleHtml={articleHtml} articleTitle={title} />;
}
