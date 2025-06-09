'use client';

import { type Message, useChat } from '@ai-sdk/react';
import { createIdGenerator } from 'ai';
import { Spinner } from 'src/components/ui/spinner';

export default function Chat({
    id,
    initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] } = {}) {
  
  const { messages, setMessages, input, handleInputChange, handleSubmit, status, stop } 
  = useChat({
    id,
    initialMessages,
    sendExtraMessageFields: true,
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
    }
  });
  
  const handleDelete = (id: string) => {
    setMessages(messages.filter(message => message.id !== id))
  }

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts
            .filter(part => part.type !== 'source')
            .map((part, i) => {
            switch (part.type) {
              case 'text':
                return <span key={`${message.id}-${i}`}>{part.text}</span>;
            }
          })}
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
            className="ml-4 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 self-center"
          >
            Delete
          </button>
        </div>
      ))}

      {(status === 'submitted' || status === 'streaming') && (
        <div>
          {status === 'submitted' && <Spinner />}
          <button type="button" onClick={() => stop()}>
            Stop
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