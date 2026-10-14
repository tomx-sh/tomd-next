import type { Metadata } from "next";
import { Chat } from "@/components/chat";

export const metadata: Metadata = {
  title: "Chat | tomd",
};

export default function ChatPage() {
  return <Chat />;
}
