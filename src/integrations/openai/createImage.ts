import { getOpenAi } from "./OpenAi";
import { __ } from "@wordpress/i18n";

export async function createImage(
  prompt: string,
  size:
    | "256x256"
    | "512x512"
    | "1024x1024"
    | "1792x1024"
    | "1024x1792"
    | null = null,
  responseType: "base64" | "url" = "url"
): Promise<string> {
  if (prompt.trim().length === 0) {
    throw new Error(__("Please enter a valid prompt", "article-gen"));
  }

  try {
    const openai = await getOpenAi();
    const result = await openai.images.generate({
      prompt: generateImagePrompt(prompt),
      n: 1,
      user: (window as any)?.userSettings?.uid,
      size: size ?? "1024x1024",
      response_format: responseType === "url" ? "url" : "b64_json",
    });
    const image = result.data[0];

    if (responseType === "base64") return image.b64_json || "";
    return image.url || "";
  } catch (error: any) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      throw new Error(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      throw new Error(
        __("An error occurred during your request.", "article-gen")
      );
    }
  }
}

export function generateImagePrompt(input: string): string {
  const capitalizedPrompt =
    input[0].toUpperCase() + input.slice(1).toLowerCase();
  return `${capitalizedPrompt}`;
}
