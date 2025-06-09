import { xai } from '@ai-sdk/xai';
import { 
    coreMessageSchema,
    streamText,
    appendResponseMessages,
    createIdGenerator,
    appendClientMessage  
 } from 'ai';
import { saveChat } from '~/tools/chat-store'
import { loadChat } from '~/tools/chat-store'
import { z } from "zod"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Defining Zod schema
// const requestBodySchema = z.object({
//     messages: z.array(coreMessageSchema),
//     id: z.string()
// })

// // Infer the TS type from schema
// type RequestBody = z.infer<typeof requestBodySchema>

export async function POST(req: Request) {
//   const requestJson = await req.json() as unknown;
//   const parsedBody = requestBodySchema.parse(requestJson)
//   const { messages, id } = parsedBody
  const { message, id } = await req.json();
  // load previous messages from the server
  const previousMessages = await loadChat(id)

  // append the new message to the previous messages
  const messages = appendClientMessage({
    messages: previousMessages,
    message
  })

  const result = streamText({
    model: xai('grok-3'),
    system: 'You are a helpful assistant.',
    messages,
    experimental_generateMessageId: createIdGenerator({
        prefix: 'msgs',
        size: 16,
    }),
    async onFinish({ response }) {
        await saveChat({
            id,
            messages: appendResponseMessages({
                messages,
                responseMessages: response.messages,
            })
        })
    },
  });

  // consume the stream to ensure it runs to completion & triggers onFinish
  // even when the client response is aborted:
  result.consumeStream(); // no await

  return result.toDataStreamResponse({
    sendSources: true,
    getErrorMessage: error => {
      if (error == null) {
        return 'unknown error';
      }

      if (typeof error === 'string') {
        return error;
      }

      if (error instanceof Error) {
        return error.message;
      }

      return JSON.stringify(error);
    },
  });
}