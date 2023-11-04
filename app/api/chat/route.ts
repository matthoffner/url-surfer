import { Configuration, OpenAIApi } from "openai-edge";
import { OpenAIStream, StreamingTextResponse } from "ai";

import {
  createRequest,
} from "openai-function-calling-tools";

const [, requestSchema] = createRequest();

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export const runtime = "edge";

const functions: any[] = [
  requestSchema
];

export async function POST(req: Request) {
  const { messages, function_call } = await req.json()

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    stream: true,
    messages,
    functions,
    function_call
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}