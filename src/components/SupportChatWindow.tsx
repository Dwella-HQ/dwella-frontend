import * as React from "react";
import { X } from "lucide-react";

export type ChatMessage = {
  id: string;
  sender: "user" | "support";
  content: string;
  timestamp: string;
};

export type SupportChatWindowProps = {
  ticketTitle: string;
  ticketStatus: "Online" | "Offline";
  messages: ChatMessage[];
  onClose: () => void;
};

export const SupportChatWindow = ({
  ticketTitle,
  ticketStatus,
  messages,
  onClose,
}: SupportChatWindowProps) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-brand-border-light bg-brand-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-main/10 text-sm font-medium text-brand-main">
            NS
          </div>
          <div>
            <p className="text-sm font-medium text-brand-black">
              {ticketTitle}
            </p>
            <p className="text-xs text-brand-success-text">{ticketStatus}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-brand-ash transition-fx hover:bg-brand-light-bg hover:text-brand-black"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-brand-light-bg p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex max-w-[80%] flex-col gap-1">
              <div
                className={`flex flex-col gap-1 rounded-lg px-4 py-2 text-sm ${
                  message.sender === "user"
                    ? "items-end bg-brand-main text-brand-white"
                    : "items-end bg-brand-white shadow-sm text-brand-black"
                }`}
              >
                <p className="w-full text-left">{message.content}</p>
                <span
                  className={`mt-4 self-end text-xs font-medium ${
                    message.sender === "user"
                      ? "text-brand-white/80"
                      : "text-brand-ash"
                  }`}
                >
                  {message.timestamp}
                </span>
              </div>
              {message.sender === "support" && (
                <p className="text-xs font-medium text-brand-main">
                  Nesco Support
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-brand-border-light bg-brand-white p-4 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg bg-brand-success-bg px-4 py-3 text-sm font-medium text-brand-success-text transition-fx hover:bg-brand-success-text/10"
        >
          Closed Ticket
        </button>
      </div>
    </div>
  );
};
