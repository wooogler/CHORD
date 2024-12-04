import wikipedia from "wikipedia";
import * as cheerio from "cheerio";

export async function getArticleHtmlByTitle({
  title,
  oldid,
}: {
  title: string;
  oldid?: string;
}): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: "parse",
      format: "json",
      prop: "text",
      formatversion: "2",
    });

    if (oldid) {
      params.set("oldid", oldid);
    } else {
      params.set("page", title);
    }

    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?${params}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const $ = cheerio.load(data.parse.text as string);
    $("style, meta").remove();
    $("*")
      .contents()
      .filter(function () {
        return this.nodeType === 8;
      })
      .remove();
    $("h2").each((_, element) => {
      if ($(element).text().includes("References")) {
        $(element).parent().nextAll().remove();
        $(element).parent().remove();
      }
    });
    $("sup").remove();
    $("table[class*='sidebar']").remove();
    $("table[class*='ambox']").remove();
    $("span.mw-editsection").remove();
    $("p").addClass("wiki-paragraph");
    $("a").addClass("wiki-link");
    $("div[role='note']").remove();

    return $.html();
  } catch (error) {
    console.error(`Error getting article html: ${error}`);
    return "";
  }
}

export async function getArticleTalkByTitle(
  title: string
): Promise<string | null> {
  try {
    const page = await wikipedia.page("Talk:" + title);
    const returnField = await page.content();
    return returnField;
  } catch (error) {
    console.error(`Error getting article talk: ${error}`);
    return "";
  }
}

export function excludeParagraph(html: string, paragraphName: string) {
  const $ = cheerio.load(html);
  $(`div.mw-heading>[id*="${paragraphName}"]`).each((_, element) => {
    const startElement = $(element).parent();
    let currentElement = startElement.next();

    while (currentElement.length && !currentElement.hasClass("mw-heading")) {
      const nextElement = currentElement.next();
      if (currentElement.is("p")) {
        currentElement.remove();
      }
      currentElement = nextElement;
    }
    startElement.after("<p class='target-paragraph'>Write this paragraph</p>");
  });

  return $.html();
}
