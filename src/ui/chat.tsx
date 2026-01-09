'use client';

import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { Spinner } from 'src/components/ui/spinner';
import  ReactMarkdown  from 'react-markdown'

export default function Chat({
    id,
    initialMessages,
  }: { id?: string | undefined; initialMessages?: Message[] } = {}) {
  
  const { messages, setMessages, input, handleInputChange, handleSubmit, status, stop, addToolResult } 
  = useChat({
    id,
    initialMessages,
    sendExtraMessageFields: true,
    maxSteps: 5,
    generateId: createIdGenerator({
        prefix: 'msgc',
        size: 16
    }),
    experimental_prepareRequestBody({ messages, id }) {
        return { message: messages[messages.length - 1], id }
    },
    onError: error => {
      console.log('An error ocurred:', error);
    },
    onFinish: (message, { usage, finishReason })  => {
      console.log('Finished streaming message:', message);
      console.log('Token usage:', usage);
      console.log('Finish reason:', finishReason);
    },
    async onToolCall({ toolCall }) {
      if(toolCall.toolName === 'getLocation') {
        const cities = [
          'New York',
          'Los Angeles',
          'Chicago',
          'San Francisco'
        ];
        return cities[Math.floor(Math.random() * cities.length)]
      }
    }
  });
  
  const handleDelete = (id: string) => {
    setMessages(messages.filter(message => message.id !== id))
  }

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div 
          key={message.id} 
          className="group flex flex-col mb-4 p-2 border rounded-lg shadow-sm relative"
        >
          <div className="whitespace-pre-wrap mb-2">
            <strong className="font-semibold">
              {message.role === 'user' ? 'User: ' : 'AI: '}
            </strong>
            {message.parts
              .filter(part => part.type !== 'source')
              .map((part, i) => {
              switch (part.type) {
                // render text 
                case 'text':
                  return <span key={`${message.id}-${i}`}><ReactMarkdown>{part.text}</ReactMarkdown></span>;
                
                // for tool invocation, distinguishing between tools and state:
                case 'tool-invocation': {
                  const callId = part.toolInvocation.toolCallId;

                  switch (part.toolInvocation.toolName) {
                    case 'askForConfirmation': {
                      switch (part.toolInvocation.state) {
                        case 'call':
                          return (
                            <div key={callId}>
                              {(part.toolInvocation.args as { message: string }).message}
                              <div>
                                <button
                                  onClick={() => 
                                    addToolResult({
                                      toolCallId: callId,
                                      result: "Yes, confirmed"
                                    })
                                  }
                                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() =>
                                  addToolResult({
                                    toolCallId: callId,
                                    result: 'No, denied',
                                  })
                                  }
                                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          );
                      case 'result':
                        return (
                          <div key={callId}>
                            Location access allowed:{' '}
                            {part.toolInvocation.result}
                          </div>
                        );
                    }
                    break;
                  }

                  case 'getWeatherInformation': {
                    switch (part.toolInvocation.state) {
                      // example of pre-rendering streaming tool calls:
                      case 'partial-call':
                        return (
                          <pre key={callId}>
                            {JSON.stringify(part.toolInvocation, null, 2)}
                          </pre>
                        );
                      case 'call':
                        return (
                          <div key={callId}>
                            Getting weather information for{' '}
                            {(part.toolInvocation.args as { city: string }).city}...
                          </div>
                        );
                      case 'result':
                        return (
                          <div key={callId}>
                            Weather in {(part.toolInvocation.args as { city: string }).city}:{' '}
                            {part.toolInvocation.result}
                          </div>
                        );
                    }
                    break;
                  }
                }
              }
            }
          })}
          <br />
        </div>
          {message.parts
            .filter(part => part.type === 'source')
            .map(part => (
              <span key={`source-${part.source.id}`}>
                [
                <a href={part.source.url} target="_blank">
                  {part.source.title ?? new URL(part.source.url).hostname}
                </a>
                ]
              </span>
          ))}
          <button 
            onClick={() => handleDelete(message.id)}
            className="self-start px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400
                       opacity-0 pointer-events-none transition-opacity duration-300
                       group-hover:opacity-100 group-hover:pointer-events-auto"
          >
            Delete
          </button>
        </div>
      ))}

      {(status === 'submitted' || status === 'streaming') && (
        <div className="flex items-center justify-center my-4">
          {status === 'submitted' && <Spinner />}
          <button type="button" onClick={() => stop()}>
            Stop Generating
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
        <div className="flex w-full max-w-md"> 
          <input
            className="flex-grow p-2 border border-zinc-300 dark:border-zinc-800 rounded-l shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900"
            value={input}
            placeholder="Say something..."
            onChange={handleInputChange}
            disabled={status !== 'ready'}
          />
          <button
            type="submit" 
            className="px-4 py-2 bg-blue-500 text-white rounded-r shadow-xl hover:bg-blue-600 disabled:opacity-50"
            disabled={status !== 'ready' || input.trim() === ''} // Disable if not ready or input is empty
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}