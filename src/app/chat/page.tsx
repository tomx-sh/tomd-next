import type { Metadata } from "next";
import { ChatTerminal } from "@/components/chat-terminal";

export const metadata: Metadata = {
  title: "Chat | tomd",
};

export default function ChatPage() {
  return <ChatTerminal />;
}
