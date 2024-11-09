import OpenAI from 'openai';
import openAiSettings from './Settings';

// construct open ai instance
// @ts-expect-error - openAiSettings returns a promise ClientsOptions not alias OpenAI
export const getOpenAi = async () => new OpenAI( await openAiSettings() );
