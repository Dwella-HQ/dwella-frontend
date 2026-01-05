import * as React from "react";
import { CheckCircle2, Clock } from "lucide-react";

// export type TicketStatus = "resolved" | "processing" | "closed" | "unread";
export type TicketStatus = "resolved" | "processing" | "unread";

export type SupportTicket = {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  status: TicketStatus;
  isActive?: boolean;
};

const statusIcons: Record<TicketStatus, React.ReactNode> = {
  resolved: <CheckCircle2 className="h-4 w-4 text-brand-success-text" />,
  processing: <Clock className="h-4 w-4 text-brand-pending-text" />,
  // closed: <Clock className="h-4 w-4 text-brand-ash" />,
  unread: <span className="h-2 w-2 rounded-full bg-brand-main" />,
};

export type SupportTicketListProps = {
  tickets: SupportTicket[];
  onTicketSelect: (ticket: SupportTicket) => void;
};

export const SupportTicketList = ({
  tickets,
  onTicketSelect,
}: SupportTicketListProps) => {
  return (
    <div className="flex flex-col">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          type="button"
          onClick={() => onTicketSelect(ticket)}
          className={`transition-fx flex items-start gap-3 border-b border-brand-border-light p-4 text-left hover:bg-brand-main-bg/40 ${
            ticket.isActive
              ? "border-l-4 border-l-brand-main bg-brand-main-bg"
              : ""
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-main/10 text-sm font-medium text-brand-main">
            NS
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <p className="text-base font-semibold text-brand-main">
                {ticket.title}
              </p>
              <div className="flex items-center gap-2 text-xs font-normal text-brand-ash">
                {statusIcons[ticket.status]}
                <span>{ticket.timestamp}</span>
              </div>
            </div>

            <p className="text-sm font-normal text-brand-black">
              Transaction Dispute
            </p>

            <p className="mt-1 truncate text-sm font-normal text-brand-black">
              {ticket.preview}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};
