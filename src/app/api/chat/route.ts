import { xai } from '@ai-sdk/xai';
import { coreMessageSchema, streamText } from 'ai';
import { parse } from 'path';
import { z } from "zod"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Defining Zod schema
const requestBodySchema = z.object({
    messages: z.array(coreMessageSchema)
})

// Infer the TS type from schema
type RequestBody = z.infer<typeof requestBodySchema>

export async function POST(req: Request) {
  let parsedBody: RequestBody
  const requestJson = await req.json();
  parsedBody = requestBodySchema.parse(requestJson)
  const { messages } = parsedBody

  const result = streamText({
    model: xai('grok-3'),
    system: 'You are a helpful assistant.',
    messages,
  });

  return result.toDataStreamResponse();
}