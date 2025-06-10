import { generateId, type Message } from 'ai';

import { db } from '~/server/db/index'
import { chats, messages } from '~/server/db/schema'
import { eq } from "drizzle-orm"

export async function createChat(): Promise<string> {
    const id = generateId();
    await db.insert(chats).values({ id });
    return id;
}

export async function loadChat(id: string): Promise<Message[]> {
    const result = await db
        .select()
        .from(messages)
        .where(eq(messages.chat_id, id))

    return result.map(row => ({
        id: row.id,
        content: row.content?? '', //handles potential null
        role: row.role as 'system' | 'user' | 'assistant' | 'data',
        createdAt: row.createdAt,
    }))
}

export async function saveChat({
    id,
    messages: messageList,
}: {
    id: string;
    messages:Message[]
}): Promise<void> {

    await db.delete(messages).where(eq(messages.chat_id, id))

    if(messageList.length > 0){
        await db.insert(messages).values(
            messageList.map(msg => ({
                id: msg.id,
                chat_id: id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date() 
            }))
        )
    }
}
