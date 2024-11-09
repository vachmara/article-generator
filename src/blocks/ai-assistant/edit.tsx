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
    });
  }, []);

  const setToggleFile = (toggle: boolean) => {
    setAttributes({ toggleFile: toggle });
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
        onClick={() => { }
        }
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
                  "The OpenAI API is powered by a diverse set of models with different capabilities and price points.",
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
