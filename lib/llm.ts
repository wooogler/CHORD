"use server";

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function editArticleWithPrompt({
  articleHtml,
  userPrompt,
}: {
  articleHtml: string;
  userPrompt: string;
}) {
  console.log("articleHtml", articleHtml);
  console.log("userPrompt", userPrompt);
  try {
    const systemPrompt = `You are editing a part of a Wikipedia article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Do not change or remove any HTML tags. Ensure that your response includes all original HTML tags.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Original HTML:\n${articleHtml}\n\nUser Request: ${userPrompt}\n\nPlease edit the content as requested, but make sure to keep all original HTML tags intact. Your response should be valid HTML.`,
        },
      ],
    });

    const editedContent = completion.choices[0].message.content;
    console.log("editedContent", editedContent);

    // Ensure the edited content includes HTML tags and remove any ```html prefix
    let cleanedContent = editedContent?.trim() || "";
    cleanedContent = cleanedContent.replace(/^```html\s*/, "");
    cleanedContent = cleanedContent.replace(/\s*```$/, "");

    return cleanedContent || "";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}
