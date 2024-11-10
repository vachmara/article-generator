import { parse } from "@wordpress/blocks";
import OpenAI from "openai";
import { __ } from "@wordpress/i18n";
import Swal from "sweetalert2";
import { useState, useEffect } from "@wordpress/element";
import {
  InspectorControls,
  RichText,
  useBlockProps,
} from "@wordpress/block-editor";
import { PanelBody } from "@wordpress/components";
import {
  faMarker,
  faMicrophone,
  faMicrophoneSlash,
} from '@fortawesome/free-solid-svg-icons';

import "./editor.scss";
import Button from "../../components/button/Button";
import SwitchCheckbox from "../../components/inputs/SwitchCheckbox";

import {
  createAssistantRun,
  uploadFile,
  listAssistants,
} from "../../integrations/openai/createAssistantRun";
import Select2Input, { Select2SingleRow } from '../../components/inputs/Select2Input';
import speech from "../../integrations/speechRecognition/speech";
import { dispatch, select } from "@wordpress/data";

/**
 * Interface attributes props
 *
 * @interface IAttributesProps
 * @typedef {IAttributesProps}
 */
interface IAttributesProps {
  prompt?: string;
  file?: File;
  toggleFile?: boolean;
}

/**
 * Interface to define parameters for populate handling
 */
interface IHandlePopulate {
  prompt: string;
  assistantId: string;
}

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/block-edit-save/#edit
 * @return {WPElement} Element to render.
 */
export default function Edit({
  attributes,
  setAttributes,
}: {
  attributes: IAttributesProps;
  setAttributes: (value: IAttributesProps) => void;
}) {
  const { prompt, file, toggleFile } = attributes as IAttributesProps;
  const [loading, setLoading] = useState<boolean>(false);
  const [speechStatus, setSpeechStatus] = useState<boolean>(false);
  const [speechResponse, setSpeechResponse] =
    useState<SpeechRecognition | null>(null);
  const [assistants, setAssistants] =
    useState<OpenAI.Beta.Assistants.AssistantsPage | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      Swal.fire({
        title: __("Wait...", "article-gen"),
        text: __(`Creating your article`, "article-gen"),
        icon: "info",
        toast: true,
        position: "center",
        showConfirmButton: false,
      });
    }
  });

  useEffect(() => {
    listAssistants().then((response) => {
      setAssistants(response);
      setAssistantId(response.data[0].id);
    });
  }, []);

  const setToggleFile = (toggle: boolean) => {
    setAttributes({ toggleFile: toggle });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Check if the file type is accept=".doc,.docx,.pdf,.txt,.html,.md"
    if (!['application/msword', 'application/pdf', 'text/plain', 'text/html', 'text/markdown'].includes(file?.type ?? ""))
      return;

    if (file) {
      setAttributes({ file });
    }
  }

  /**
   * Handle populate post
   *
   * @param {IHandlePopulate} param - The parameters for populating post
   * @param {React.Dispatch<React.SetStateAction<boolean>>} setLoading - Function to set loading state
   */
  async function handlePopulate(
    { prompt, assistantId }: IHandlePopulate,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) {
    try {
      setLoading(true);

      // Upload the file if toggleFile is enabled and file is provided
      let uploadedFileId = null;
      if (toggleFile && file) {
        const uploadedFile = await uploadFile(file);
        uploadedFileId = uploadedFile.id;
      }

      // Including the prompt in options as a necessary parameter
      const runOptions: OpenAI.Beta.ThreadCreateAndRunParamsNonStreaming = {
        assistant_id: assistantId,
        thread: {
          messages: [{ role: "user", content: prompt, attachments: uploadedFileId ? [{ tools: [{ type: "file_search" }], file_id: uploadedFileId }] : [] }],
        }
      };

      const { text, citations } = await createAssistantRun(runOptions);

      console.log({ text, citations });
      Swal.close(); // close all popups

      const blocks = parse(text);
      dispatch("core/block-editor").removeBlock(
        select("core/block-editor").getSelectedBlockClientId() ?? ""
      );
      dispatch("core/block-editor").insertBlocks(blocks);

    } catch (e: any) {
      Swal.fire({
        title: __("Error", "article-gen"),
        text: e.message,
        icon: "error",
        toast: true,
        position: "bottom",
        showConfirmButton: false,
        showCloseButton: true,
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle generation
   */
  function handleGeneration() {
    if (!prompt || !assistantId) {
      Swal.fire({
        title: __("Error", "article-gen"),
        text: __("Please fill the prompt and select an assistant", "article-gen"),
        icon: "error",
        toast: true,
        position: "bottom",
        showConfirmButton: false,
        showCloseButton: true,
      });
      return;
    }

    handlePopulate({ prompt, assistantId }, setLoading)
  }

  /**
   * speech recognition handle
   *
   * @param {string} attr
   */
  function speechHandle(attr: string) {
    if (!speechStatus) {
      setSpeechStatus(true);
    } else {
      setSpeechStatus(false);
      if (speechResponse) {
        speechResponse.abort();
        return;
      }
    }

    if (attr === "prompt") {
      document.getElementById("text-generator-prompt")?.focus();
    } else if (attr === "context") {
      document.getElementById("text-generator-context")?.focus();
    }

    const speechResult = speech({
      resultCallback: (t) => {
        if (attr === "prompt") {
          setAttributes({ prompt: t });
        }
      },
      endCallback: () => setSpeechStatus(false),
      lang: "",
      continuous: false,
      interimResults: false,
    });

    setSpeechResponse(typeof speechResult === "object" ? speechResult : null);
  }

  return (
    <div
      {...useBlockProps()}
      style={{
        backgroundColor: '#ffffff',
        padding: `20px 20px 20px 20px`,
      }}
    >
      <div className="block items-center relative">
        <RichText
          className="wp-block-article-generator-prompt flex-none focus:outline-none focus:ring focus:ring-primary"
          tagName="h4"
          placeholder={__(
            'Write the subject of the article',
            'article-gen'
          )}
          id="text-generator-prompt"
          value={prompt || ''}
          onChange={(prompt: string) =>
            setAttributes({ prompt })
          }
        />
        <Button
          icon={speechStatus ? faMicrophoneSlash : faMicrophone}
          buttonCustomClass={`w-[43px] h-10 absolute right-2 top-[20%] border-none flex justify-center items-center`}
          type={speechStatus ? 'success' : 'primary'}
          iconCustomClass="block !px-0"
          onClick={() => speechHandle('prompt')}
        />
      </div>

      <div className="justify-between flex gap-5">
        <label>
          {__('Enable file upload', 'article-gen')}
          <SwitchCheckbox
            enabled={toggleFile || false}
            setEnabled={setToggleFile}
          />
        </label>
      </div>

      {toggleFile && (
        <div className="mt-6">
          <input
            type="file"
            accept=".doc,.docx,.pdf,.txt,.html,.md"
            onChange={handleFileChange}
          />
        </div>
      )}

      <Button
        text={
          loading
            ? __('Generating...', 'article-gen')
            : __('Generate', 'article-gen')
        }
        buttonCustomClass="article-gen-btn"
        disabled={loading}
        iconCustomClass="btn-icon"
        type="primary"
        icon={faMarker}
        onClick={handleGeneration}

      />
      <InspectorControls>
        <PanelBody
          title={__('Settings', 'article-gen')}
          initialOpen={false}
          icon={'admin-settings' as any}
        >
          <div className="mb-6">
            <label>
              {__('Assistant', 'article-gen')}:{' '}
              <strong>{assistants?.data.filter(assistant => assistant.id === assistantId)[0]?.name ?? assistantId}</strong>
              <div className="mt-2">
                <Select2Input
                  defaultValue={assistantId}
                  isMulti={false}
                  onChange={input => setAssistantId(input.value)}
                  options={assistants?.data.map(assistant => ({
                    value: assistant.id,
                    label: assistant.name,
                  }) as Select2SingleRow) ?? []}
                />
              </div>
              <small>
                {__(
                  "OpenAI assistant can be created from the OpenAI playground",
                  'article-gen'
                )}
              </small>
            </label>
          </div>
        </PanelBody>
      </InspectorControls>
    </div>
  );
}
