import { createFileRoute } from "@tanstack/react-router";
import { ChatShell } from "@/components/chat/ChatShell";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  return <ChatShell key={threadId} threadId={threadId} />;
}
