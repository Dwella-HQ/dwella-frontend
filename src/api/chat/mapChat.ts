import type { ChatDTO, ChatMessageDTO } from "./chat.schema";

const formatTime = (dateString?: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  time: string;
  isRead: boolean;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  name: string;
  subtitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
};

export const mapChatMessage = (message: ChatMessageDTO): ChatMessage => ({
  id: String(message.id),
  chatId: String(message.chatId || ""),
  senderId: String(message.senderId || ""),
  receiverId: String(message.receiverId || ""),
  content: message.content,
  time: formatTime(message.createdAt),
  isRead: message.isRead,
  createdAt: message.createdAt,
});

type ParticipantLabelFields = {
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
};

const asParticipantLabelFields = (value: unknown): ParticipantLabelFields | null => {
  if (!value || typeof value !== "object") return null;
  return value as ParticipantLabelFields;
};

export const mapChat = (chat: ChatDTO): ChatConversation => {
  const messages = chat.messages.map(mapChatMessage);
  const latestMessage = messages[0];
  const participantLabels = chat.participants
    .map((participant) => {
      const flat = participant as ParticipantLabelFields;
      const nestedUser =
        "user" in participant && participant.user
          ? asParticipantLabelFields(participant.user)
          : null;
      return (
        flat.fullName ||
        flat.name ||
        flat.email ||
        nestedUser?.fullName ||
        nestedUser?.name ||
        nestedUser?.email
      );
    })
    .filter(Boolean);

  return {
    id: String(chat.id),
    name: chat.name,
    subtitle:
      chat.propertyName ||
      chat.unit ||
      participantLabels.slice(1).join(", ") ||
      "Chat",
    lastMessage: chat.lastMessage || latestMessage?.content || "No messages yet",
    lastMessageTime:
      formatTime(chat.updatedAt) || latestMessage?.time || formatTime(chat.createdAt),
    unreadCount: chat.unreadCount,
    messages,
  };
};
