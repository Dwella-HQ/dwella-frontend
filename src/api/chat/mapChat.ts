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
  participantId: string;
  participantRoleId: string;
  senderId: string;
  receiverId: string;
  content: string;
  time: string;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
};

export type ChatParticipant = {
  id: string;
  roleId: string;
  role: string;
  name: string;
  email: string;
  isOnline: boolean;
};

export type ChatConversation = {
  id: string;
  name: string;
  subtitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: ChatParticipant[];
  messages: ChatMessage[];
};

export const mapChatMessage = (message: ChatMessageDTO): ChatMessage => ({
  id: String(message.id),
  chatId: String(message.chatId || ""),
  participantId: String(message.participant?.id || ""),
  participantRoleId: String(message.participant?.roleId || ""),
  senderId: String(message.participant?.roleId || message.senderId || ""),
  receiverId: String(message.receiverId || ""),
  content: message.isDeleted ? "This message was deleted" : message.content,
  time: formatTime(message.createdAt),
  isRead: message.isRead,
  isDeleted: Boolean(message.isDeleted),
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

const formatRoleLabel = (role: string): string => {
  switch (role) {
    case "landlord":
      return "Landlord";
    case "property_manager":
      return "Property Manager";
    case "tenant":
      return "Tenant";
    default:
      return role
        .replace(/_/g, " ")
        .replace(/\b[a-z]/g, (match) => match.toUpperCase());
  }
};

export const mapChat = (
  chat: ChatDTO,
  currentRoleId?: string | null,
): ChatConversation => {
  const messages = chat.messages
    .map(mapChatMessage)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latestMessage = messages[messages.length - 1];
  const participants = chat.participants.map((participant) => {
    const flat = participant as ParticipantLabelFields & {
      id?: string | number | null;
      roleId?: string | number | null;
      role?: string | null;
      isOnline?: boolean | null;
    };
    const nestedUser =
      "user" in participant && participant.user
        ? asParticipantLabelFields(participant.user)
        : null;

    return {
      id: String(flat.id || ""),
      roleId: String(flat.roleId || ""),
      role: String(flat.role || ""),
      name:
        flat.fullName ||
        flat.name ||
        flat.email ||
        nestedUser?.fullName ||
        nestedUser?.name ||
        nestedUser?.email ||
        "Participant",
      email: flat.email || nestedUser?.email || "",
      isOnline: Boolean(flat.isOnline),
    };
  });
  const participantLabels = participants
    .map((participant) => participant.name)
    .filter(Boolean);
  const otherParticipants = currentRoleId
    ? participants.filter(
        (participant) => participant.roleId !== currentRoleId,
      )
    : [];
  const displayParticipants =
    otherParticipants.length > 0 ? otherParticipants : participants;
  const displayNames = displayParticipants
    .map((participant) => participant.name)
    .filter(Boolean);
  const displayRoles = displayParticipants
    .map((participant) => formatRoleLabel(participant.role))
    .filter(Boolean);

  const lastMessage =
    chat.lastMessage || latestMessage?.content || "No messages yet";

  return {
    id: String(chat.id),
    name: displayNames.join(", ") || chat.name,
    subtitle:
      chat.propertyName ||
      chat.unit ||
      displayRoles.join(", ") ||
      participantLabels.slice(1).join(", ") ||
      "Chat",
    lastMessage,
    lastMessageTime:
      formatTime(chat.updatedAt) || latestMessage?.time || formatTime(chat.createdAt),
    unreadCount: chat.unreadCount,
    participants,
    messages,
  };
};
