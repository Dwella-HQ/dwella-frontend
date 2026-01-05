import type { SupportTicket } from "@/components/SupportTicketList";
import type { ChatMessage } from "@/components/SupportChatWindow";

export const supportTickets: SupportTicket[] = [
  {
    id: "1",
    title: "NESCO SUPPORT",
    preview:
      "I have a question about the budget for the upcoming project. It seems like there's a disc...",
    timestamp: "Yesterday",
    status: "resolved",
  },
  {
    id: "2",
    title: "NESCO SUPPORT",
    preview:
      "I have a question about the budget for the upcoming project. It seems like there's a disc...",
    timestamp: "1 min ago",
    status: "unread",
  },
  {
    id: "3",
    title: "NESCO SUPPORT",
    preview:
      "I have a question about the budget for the upcoming project. It seems like there's a disc...",
    timestamp: "21 Oct 2025",
    status: "processing",
  },
  {
    id: "4",
    title: "NESCO SUPPORT",
    preview:
      "I have a question about the budget for the upcoming project. It seems like there's a disc...",
    timestamp: "12 May 2025",
    status: "resolved",
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "user",
    content:
      "Thank you. Please enter the amount and date of the transaction (eg 100, December 21th).",
    timestamp: "13:34",
  },
  {
    id: "2",
    sender: "support",
    content:
      "Thank you. Please enter the amount and date of the transaction (eg 100, December 21th).",
    timestamp: "13:34",
  },
  {
    id: "3",
    sender: "user",
    content:
      "Thank you. Please enter the amount and date of the transaction (eg 100, December 21th).",
    timestamp: "13:34",
  },
  {
    id: "4",
    sender: "support",
    content:
      "Thank you. Please enter the amount and date of the transaction (eg 100, December 21th).",
    timestamp: "13:34",
  },
  {
    id: "5",
    sender: "user",
    content:
      "Thank you. Please enter the amount and date of the transaction (eg 100, December 21th).",
    timestamp: "13:34",
  },
  {
    id: "6",
    sender: "support",
    content:
      "Thank you. Please enter the amount and date of the transaction (eg 100, December 21th).",
    timestamp: "13:34",
  },
];
