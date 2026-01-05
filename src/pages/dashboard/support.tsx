import Head from "next/head";
import * as React from "react";
import { Plus, Search } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { SupportTicketList } from "@/components/SupportTicketList";
import { SupportChatWindow } from "@/components/SupportChatWindow";
import { SupportNewTicketModal } from "@/components/SupportNewTicketModal";
import type { SupportTicket } from "@/components/SupportTicketList";
import { supportTickets, chatMessages } from "@/api/support/support.mock";

import type { NextPageWithLayout } from "../_app";

const SupportPage: NextPageWithLayout = () => {
  const [selectedTicket, setSelectedTicket] =
    React.useState<SupportTicket | null>(supportTickets[0]);
  const [activeTab, setActiveTab] = React.useState<
    "all" | "processing" | "closed"
  >("all");
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = React.useState(false);

  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseChat = () => {
    setSelectedTicket(null);
  };

  const ticketsWithActiveState = React.useMemo(() => {
    return supportTickets.map((ticket) => ({
      ...ticket,
      isActive: selectedTicket?.id === ticket.id,
    }));
  }, [selectedTicket]);

  return (
    <>
      <Head>
        <title>NESCO Partners · Support</title>
      </Head>
      <div className="w-full">
        <button
          type="button"
          onClick={() => setIsNewTicketModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-main px-4 py-2.5 text-base font-medium text-brand-white transition-fx hover:bg-brand-main/90"
        >
          <Plus className="h-5 w-5" />
          New Ticket
        </button>
      </div>
      <section className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-brand-border-light bg-brand-white shadow-sm">
          <div className="border-b border-brand-border-light p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ash" />
              <input
                type="text"
                placeholder="Search conversations"
                className="w-full rounded-lg border border-brand-border-light bg-brand-light-bg py-2 pl-10 pr-4 text-base font-medium text-brand-black placeholder:text-brand-ash focus:border-brand-main focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center border-b border-brand-border-light">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`transition-fx relative flex-1 px-4 py-3 text-base font-medium ${
                activeTab === "all"
                  ? "text-brand-main"
                  : "text-brand-ash hover:text-brand-black"
              }`}
            >
              All
              {activeTab === "all" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("processing")}
              className={`transition-fx relative flex-1 px-4 py-3 text-base font-medium ${
                activeTab === "processing"
                  ? "text-brand-main"
                  : "text-brand-ash hover:text-brand-black"
              }`}
            >
              Processing
              {activeTab === "processing" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("closed")}
              className={`transition-fx relative flex-1 px-4 py-3 text-base font-medium ${
                activeTab === "closed"
                  ? "text-brand-main"
                  : "text-brand-ash hover:text-brand-black"
              }`}
            >
              Closed
              {activeTab === "closed" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SupportTicketList
              tickets={ticketsWithActiveState}
              onTicketSelect={handleTicketSelect}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="h-full overflow-hidden rounded-2xl border border-brand-border-light bg-brand-white shadow-sm">
              <SupportChatWindow
                ticketTitle={selectedTicket.title}
                ticketStatus="Online"
                messages={chatMessages}
                onClose={handleCloseChat}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-brand-border-light bg-brand-white shadow-sm">
              <p className="text-sm text-brand-ash">
                Select a ticket to view conversation
              </p>
            </div>
          )}
        </div>
      </section>

      <SupportNewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
      />
    </>
  );
};

SupportPage.getLayout = (page) => (
  <DashboardLayout
    heading="Support"
    byText="Respond to partner requests and operational issues."
  >
    {page}
  </DashboardLayout>
);

export default SupportPage;
