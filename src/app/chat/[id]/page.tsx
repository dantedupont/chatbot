import { loadChat } from '~/tools/chat-store'
import { auth } from "~/lib/auth"
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Chat from 'src/ui/chat'

export default async function Page(props: { params: Promise<{ id: string}> }) {
    const { id } = await props.params; //get chat ID from URL
    const messages = await loadChat(id); //load chat messages

    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session?.user) {
        console.log("user not authenticated, redirecting to login");
        redirect('/login')
    }
    return <Chat id={id} initialMessages={messages} />
}