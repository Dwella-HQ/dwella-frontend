import { z } from "zod";

const idSchema = z.union([z.string(), z.number()]).transform(String);

const userRefSchema = z
  .object({
    id: idSchema.optional(),
    fullName: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    role: z
      .union([
        z.string(),
        z.object({ name: z.string().optional().nullable() }).passthrough(),
      ])
      .optional()
      .nullable(),
  })
  .passthrough();

const chatRefSchema = z
  .object({
    id: idSchema.optional(),
    ref: z.string().optional().nullable(),
  })
  .passthrough()
  .optional()
  .nullable();

const chatParticipantSchema = z
  .object({
    id: idSchema.optional(),
    user: userRefSchema.optional().nullable(),
    role: z.string().optional().nullable(),
    roleId: idSchema.optional().nullable(),
    isOnline: z.boolean().optional().nullable(),
  })
  .passthrough();

export const chatMessageSchema = z
  .object({
    id: idSchema,
    chat: chatRefSchema,
    participant: chatParticipantSchema.optional().nullable(),
    chatId: idSchema.optional().nullable(),
    chat_id: idSchema.optional().nullable(),
    senderId: idSchema.optional().nullable(),
    sender_id: idSchema.optional().nullable(),
    receiverId: idSchema.optional().nullable(),
    receiver_id: idSchema.optional().nullable(),
    userId: idSchema.optional().nullable(),
    user_id: idSchema.optional().nullable(),
    content: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
    text: z.string().optional().nullable(),
    body: z.string().optional().nullable(),
    files: z.array(z.unknown()).optional().nullable(),
    read: z.boolean().optional().nullable(),
    isRead: z.boolean().optional().nullable(),
    isDeleted: z.boolean().optional().nullable(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
  })
  .passthrough()
  .transform((message) => {
    const now = new Date().toISOString();
    return {
      ...message,
      chatId: message.chatId ?? message.chat_id ?? message.chat?.id ?? "",
      senderId:
        message.senderId ??
        message.sender_id ??
        message.participant?.user?.id ??
        message.participant?.roleId ??
        message.userId ??
        "",
      receiverId: message.receiverId ?? message.receiver_id ?? "",
      content:
        message.content ||
        message.message ||
        message.text ||
        message.body ||
        "",
      isRead: Boolean(message.isRead ?? message.read),
      createdAt: message.createdAt || now,
      updatedAt: message.updatedAt || message.createdAt || now,
    };
  });

export const chatSchema = z
  .object({
    id: idSchema,
    ref: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    userName: z.string().optional().nullable(),
    participantName: z.string().optional().nullable(),
    receiverName: z.string().optional().nullable(),
    participants: z
      .array(z.union([userRefSchema, chatParticipantSchema]))
      .optional()
      .nullable(),
    users: z.array(userRefSchema).optional().nullable(),
    messages: z.array(chatMessageSchema).optional().nullable(),
    lastMessage: z
      .union([z.string(), chatMessageSchema])
      .optional()
      .nullable(),
    unreadCount: z.number().optional().nullable(),
    unread_count: z.number().optional().nullable(),
    propertyName: z.string().optional().nullable(),
    unit: z.string().optional().nullable(),
    lastMessageDate: z.string().optional().nullable(),
    deletedAt: z.string().optional().nullable(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
  })
  .passthrough()
  .transform((chat) => {
    const participants = chat.participants ?? chat.users ?? [];
    const firstParticipant = participants[0];
    const getParticipantLabel = (participant: unknown): string => {
      if (!participant || typeof participant !== "object") return "";
      const record = participant as Record<string, unknown>;
      const directName =
        (typeof record.fullName === "string" && record.fullName) ||
        (typeof record.name === "string" && record.name) ||
        (typeof record.email === "string" && record.email);
      if (directName) return directName;

      const nestedUser = record.user;
      if (nestedUser && typeof nestedUser === "object") {
        const userRecord = nestedUser as Record<string, unknown>;
        return (
          (typeof userRecord.fullName === "string" && userRecord.fullName) ||
          (typeof userRecord.name === "string" && userRecord.name) ||
          (typeof userRecord.email === "string" && userRecord.email) ||
          ""
        );
      }

      return "";
    };
    const lastMessage =
      typeof chat.lastMessage === "string"
        ? chat.lastMessage
        : chat.lastMessage?.content || chat.messages?.[0]?.content || "";

    return {
      ...chat,
      name:
        chat.name ||
        chat.title ||
        chat.userName ||
        chat.participantName ||
        chat.receiverName ||
        getParticipantLabel(firstParticipant) ||
        "Conversation",
      participants,
      messages: chat.messages ?? [],
      lastMessage,
      unreadCount: chat.unreadCount ?? chat.unread_count ?? 0,
      createdAt: chat.createdAt ?? new Date().toISOString(),
      updatedAt:
        chat.updatedAt ??
        chat.lastMessageDate ??
        chat.createdAt ??
        new Date().toISOString(),
    };
  });

export type ChatMessageDTO = z.infer<typeof chatMessageSchema>;
export type ChatDTO = z.infer<typeof chatSchema>;
