import { __ } from "@wordpress/i18n";
import { getOpenAi } from "./OpenAi";
import OpenAI from "openai";

export async function createAssistantRun(
  assistant_id: string,
  options?: OpenAI.Beta.ThreadCreateAndRunParamsNonStreaming
) {
  try {
    const openai = await getOpenAi();
    const run = await openai.beta.threads.createAndRunPoll({
      assistant_id,
      ...options,
    });

    if (run.status !== "completed") {
      throw new Error(__("Failed to create assistant run", "article-gen"));
    }

    const messages = await openai.beta.threads.messages.list(run.thread_id, {
      run_id: run.id,
    });

    const message = messages.data.pop()!;
    if (message.content[0].type === "text") {
      const { text } = message.content[0];
      const { annotations } = text;
      const citations: string[] = [];

      let index = 0;
      for (let annotation of annotations) {
        text.value = text.value.replace(annotation.text, "[" + index + "]");

        // @ts-expect-error - file_citation type error
        const { file_citation } = annotation;
        if (file_citation) {
          const citedFile = await openai.files.retrieve(file_citation.file_id);
          citations.push("[" + index + "]" + citedFile.filename);
        }
        index++;
      }
      return { text: text.value, citations };
    }
  } catch (error: Error | any) {
    console.info({ error });
    const errorMessase =
      error.response.data.error.message ||
      __("Failed to create assistant run", "article-gen");
    throw new Error(errorMessase);
  }
  return { text: "", citations: [] };
}

export async function uploadFile(file: File): Promise<OpenAI.FileObject> {
  const openai = await getOpenAi();
  const fileUploaded = await openai.files.create({
    file: file,
    purpose: "assistants",
  });
  return fileUploaded;
}

export async function listAssistants(): Promise<OpenAI.Beta.Assistants.AssistantsPage> {
  const openai = await getOpenAi();
  const assistants = await openai.beta.assistants.list();
  return assistants;
}
