import { loadChat } from '~/tools/chat-store'
import Chat from 'src/ui/chat'

export default async function Page(props: { params: Promise<{ id: string}> }) {
    const { id } = await props.params; //get chat ID from URL
    const messages = await loadChat(id); //load chat messages
    return <Chat id={id} initialMessages={messages} />
}