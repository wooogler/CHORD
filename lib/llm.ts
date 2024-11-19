"use server";

import OpenAI from "openai";
import { Message } from "./store/chatStore";
import agentProfiles from "./agentProfiles";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function editArticleWithUserInputAndPillars({
  articleHtml,
  userInput,
}: {
  articleHtml: string;
  userInput: string;
}) {
  try {
    const systemPrompt =
      `You are editing a part of a Wikipedia article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Do not change or remove any HTML tags. Ensure that your response includes all original HTML tags. Keep these four editing tasks in mind while performing your edit, giving them top priority:` +
      agentProfiles
        .slice(0, 4)
        .map((agentProfile) => agentProfile.task)
        .toString() +
      `Provide your response in the following JSON format:

{
  "feedback": "{Your natural language feedback about the edited parts, referencing the five pillars}",
  "editedHtml": "{The edited part in HTML format}"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Original HTML:\n${articleHtml}\n\nUser Request: ${userInput}\n\nPlease edit the content as requested, but make sure to keep all original HTML tags intact. Your response should be valid HTML.`,
        },
      ],
    });

    const assistantResponse = completion.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantResponse || "");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw error;
    }

    return {
      feedback: parsedResponse.feedback,
      editedHtml: parsedResponse.editedHtml,
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function editArticleWithUserInputOnly({
  articleHtml,
  userInput,
}: {
  articleHtml: string;
  userInput: string;
}) {
  console.log("articleHtml", articleHtml);
  console.log("userInput", userInput);
  try {
    const systemPrompt = `You are editing a part of a Wikipedia article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Do not change or remove any HTML tags. Ensure that your response includes all original HTML tags. Provide your response in the following JSON format:

{
  "feedback": "{Your natural language feedback about the edited parts}",
  "editedHtml": "{The edited part in HTML format}"
}`;

    const inputMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Original HTML:\n${articleHtml}\n\nUser Request: ${userInput}\n\nPlease edit the content as requested, but make sure to keep all original HTML tags intact. Your response should be valid HTML.`,
      },
    ];

    logMessages({
      functionName: "editArticleWithUserInputOnly",
      messages: inputMessages,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: inputMessages,
    });

    const assistantResponse = completion.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantResponse || "");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw error;
    }

    console.log("editedHtml", parsedResponse.editedHtml);

    return {
      feedback: parsedResponse.feedback,
      editedHtml: parsedResponse.editedHtml,
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function editArticleWithEditingAgent({
  articleHtml,
  userInput,
}: {
  articleHtml: string;
  userInput: string;
}) {
  const personality =
    "You are the user's representative, a butler of sorts. You are the liaison between the other models, and are from the upper crust, truly high class.";

  try {
    const systemPrompt = `You are editing a part of an article in HTML format based on the user's request. Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Give a short justification (under 200 characters) for your edits that is seperate from the HTML by triple bars (|||). Modify these justifications based on this personality: ${personality}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Original HTML:\n${articleHtml}\n\nUser Request: ${userInput}\n\nPlease edit the content as requested, but make sure to keep all original HTML tags intact. Your response before the triple bars (|||) should be valid HTML.`,
        },
      ],
    });

    const splitLocation =
      completion.choices[0].message.content?.indexOf("|||") ?? 0;
    const response = completion.choices[0].message.content?.substring(
      0,
      splitLocation
    );
    const explaination = completion.choices[0].message.content?.substring(
      splitLocation + 3
    );

    // Ensure the edited content includes HTML tags and remove any ```html prefix
    let cleanedContent = response?.trim() || "";
    cleanedContent = cleanedContent.replace(/^```html\s*/, "");
    cleanedContent = cleanedContent.replace(/\s*```$/, "");

    return {
      response: cleanedContent || "",
      explaination: explaination?.replaceAll("|", "").trim() || "",
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

export async function editArticleAsPillar({
  articleHtml,
  agentEdit,
  pillar,
  personality,
}: {
  articleHtml: string;
  agentEdit: string;
  pillar: string;
  personality: string;
}) {
  return openai.chat.completions
    .create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Please give feedback on the edit using the concepts of this Wikipedia pillar: ${[
            pillar,
          ]}. Keep your responses brief and to the point in less than 250 characters. Respond using this personality: ${personality}`,
        },
        {
          role: "user",
          content: `Give feedback on this edited HTML:\n${agentEdit}. This is the original HTML: \n${articleHtml}`,
        },
      ],
    })
    .then((data) => {
      // Ensure the edited content includes HTML tags and remove any ```html prefix
      let cleanedContent = data.choices[0].message.content?.trim() || "";
      cleanedContent = cleanedContent.replace(/^```html\s*/, "");
      cleanedContent = cleanedContent.replace(/\s*```$/, "");

      return cleanedContent || "";
    });
}

export async function getFeedbackFromAgent({
  editedHtml,
  task,
  personality,
  chatHistory,
  isMultiAgentChat = false,
}: {
  editedHtml: string;
  task: string;
  personality: string;
  chatHistory?: Message[];
  isMultiAgentChat?: boolean;
}) {
  const inputMessages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an AI assistant providing feedback on edited content. ${
        isMultiAgentChat
          ? "Keep your response ultra-concise (max 100 characters)."
          : ""
      } Match the given personality and be casual like in a group chat.`,
    },
    {
      role: "user",
      content: `Edited Content:
${editedHtml}

Task:
${task}

Personality:
${personality}

${
  chatHistory
    ? `Chat History:
${formatChatHistory(chatHistory)}`
    : ""
}

Please provide your feedback on the edited content.`,
    },
  ];

  logMessages({
    functionName: "getFeedbackFromAgent",
    messages: inputMessages,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: inputMessages,
  });

  const agentResponse = completion.choices[0].message.content;

  return agentResponse;
}

export async function getReactionFromAgent(
  editedHtml: string,
  task: string,
  personality: string,
  message: string
) {
  const inputMessages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an AI assistant selecting a single emoji from this list: (👍, 👎, 😠, 😑, 🤯) to respond to a message. The message you are reacting to was created in response to an edited HTML page. Use your given personality to select the best emoji.`,
    },
    {
      role: "system",
      content: `Edited Content:
${editedHtml}

Task:
${task}

Personality:
${personality}
}

Please select an emoji to react to this message: ${message}`,
    },
  ];

  logMessages({
    functionName: "getReactionFromAgent",
    messages: inputMessages,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: inputMessages,
  });

  const agentResponse = completion.choices[0].message.content;

  return agentResponse;
}

function formatChatHistory(chatHistory: Message[]) {
  return chatHistory
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
}

export async function editArticleWithConversation({
  articleHtml,
  conversation,
}: {
  articleHtml: string;
  conversation: Message[];
}) {
  try {
    const systemPrompt = `You are editing a part of a Wikipedia article in HTML format based on the conversation between a user and an agent. Consider ONLY the user's messages from the conversation to make appropriate edits - ignore the agent's responses. Maintain the original HTML structure, including all HTML tags, while only modifying the content based on the user's requests. Do not change or remove any HTML tags. Ensure that your response includes all original HTML tags. Provide your response in the following JSON format:

{
  "feedback": "{Your natural language feedback explaining the changes made based on the user's requests}",
  "editedHtml": "{The edited part in HTML format}"
}`;

    const inputMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Original HTML:\n${articleHtml}\n\nConversation History:\n${formatChatHistory(
          conversation
        )}\n\nPlease edit the content based on the conversation context while keeping all original HTML tags intact. Your response should be valid HTML.`,
      },
    ];

    logMessages({
      functionName: "editArticleWithConversation",
      messages: inputMessages,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: inputMessages,
    });

    const assistantResponse = completion.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantResponse || "");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw error;
    }

    return {
      feedback: parsedResponse.feedback,
      editedHtml: parsedResponse.editedHtml,
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}

function logMessages({
  functionName,
  messages,
}: {
  functionName: string;
  messages: OpenAI.ChatCompletionMessageParam[];
}) {
  console.log(`
${functionName} - messages:
-------------------------------------------`);
  messages.forEach((message) => {
    console.log(`
${message.role} - content:
${message.content}
-------------------------------------------`);
  });
}

export async function editArticleWithContext({
  articleHtml,
  surroundingHtml,
  userInput,
}: {
  articleHtml: string;
  surroundingHtml: string;
  userInput: string;
}) {
  console.log("articleHtml", articleHtml);
  console.log("surroundingHtml", surroundingHtml);
  console.log("userInput", userInput);

  try {
    const systemPrompt = `You are editing a part of a Wikipedia article in HTML format based on the user's request. You will be provided with both the target HTML to edit and its surrounding context. Use this context to make more informed edits while maintaining consistency with the surrounding content.

Maintain the original HTML structure, including all HTML tags, while only modifying the content as specified by the user. Do not change or remove any HTML tags. Your response should include only the edited target section, not the surrounding context.

Provide your response in the following JSON format:

{
  "feedback": "{Your natural language feedback about the edited parts and how it fits with the surrounding context}",
  "editedHtml": "{The edited target section in HTML format}"
}`;

    const inputMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Context HTML:\n${surroundingHtml}\n\nTarget HTML to Edit:\n${articleHtml}\n\nUser Request: ${userInput}\n\nPlease edit the target content as requested while considering the surrounding context. Make sure to keep all original HTML tags intact. Your response should contain only the edited target section in valid HTML format.`,
      },
    ];

    logMessages({
      functionName: "editArticleWithContext",
      messages: inputMessages,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: inputMessages,
    });

    const assistantResponse = completion.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantResponse || "");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw error;
    }

    console.log("editedHtml", parsedResponse.editedHtml);

    return {
      feedback: parsedResponse.feedback,
      editedHtml: parsedResponse.editedHtml,
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}
