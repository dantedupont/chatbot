import { xai } from '@ai-sdk/xai';
import { 
    streamText,
    appendResponseMessages,
    createIdGenerator,
    appendClientMessage,
    type Message  
 } from 'ai';
import { saveChat, loadChat } from '~/tools/chat-store'
import { errorHandler } from '~/tools/errors';
import { z } from "zod"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {

  const { message, id } = await req.json() as { message: Message; id: string }
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
    tools: {
      getWeatherInformation: {
        description: 'show the weather in a given city to the user',
        parameters: z.object({ city: z.string() }),
        execute: async ({}: { city: string }) => {
          const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy']
          return weatherOptions[
            Math.floor(Math.random() * weatherOptions.length)
          ];
        },
      },
      askForConfirmation: {
        description: 'Ask the user for confirmation',
        parameters: z.object({
          message: z.string().describe('The message to ask fro confirmation'),
        }),
      },
      getLocation: {
        description: 
          "Get the user location. Always ask for confirmation before using this tool",
        parameters: z.object({})
      }
    }
  });

  // consume the stream to ensure it runs to completion & triggers onFinish
  // even when the client response is aborted:
  void result.consumeStream(); // no await

  return result.toDataStreamResponse({
    sendSources: true,
    getErrorMessage: errorHandler, 
  });
}
