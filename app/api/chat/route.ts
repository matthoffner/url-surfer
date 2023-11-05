import { Configuration, OpenAIApi } from "openai-edge";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { createUrlSurfer } from "@/app/tools/surfer";

const [, requestSchema] = createUrlSurfer();

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

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