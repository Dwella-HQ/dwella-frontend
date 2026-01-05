import * as React from "react";
import { X } from "lucide-react";

type SupportNewTicketModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (values: {
    subject: string;
    category: string;
    priority: string;
    description: string;
  }) => void;
};

export const SupportNewTicketModal = ({
  isOpen,
  onClose,
  onSubmit,
}: SupportNewTicketModalProps) => {
  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [priority, setPriority] = React.useState("Medium");
  const [description, setDescription] = React.useState("");

  const resetForm = React.useCallback(() => {
    setSubject("");
    setCategory("");
    setPriority("Medium");
    setDescription("");
  }, []);

  const handleClose = React.useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit?.({
        subject,
        category,
        priority,
        description,
      });
      handleClose();
    },
    [category, description, handleClose, onSubmit, priority, subject]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-brand-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-6 rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-brand-black">
              Create New Ticket
            </p>
            <p className="text-sm text-brand-ash">
              Share issue details with the support team.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-brand-ash hover:bg-brand-light-bg hover:text-brand-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="ticket-subject"
              className="text-sm font-medium text-brand-black"
            >
              Subject
            </label>
            <input
              id="ticket-subject"
              name="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              placeholder="Brief summary of the request"
              className="w-full rounded-lg border border-brand-border-light bg-brand-light-bg px-4 py-2 text-sm text-brand-black placeholder:text-brand-ash focus:border-brand-main focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="ticket-category"
                className="text-sm font-medium text-brand-black"
              >
                Category
              </label>
              <input
                id="ticket-category"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                placeholder="e.g. Transaction dispute"
                className="w-full rounded-lg border border-brand-border-light bg-brand-light-bg px-4 py-2 text-sm text-brand-black placeholder:text-brand-ash focus:border-brand-main focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="ticket-priority"
                className="text-sm font-medium text-brand-black"
              >
                Priority
              </label>
              <select
                id="ticket-priority"
                name="priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-full rounded-lg border border-brand-border-light bg-brand-light-bg px-4 py-2 text-sm text-brand-black focus:border-brand-main focus:outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="ticket-description"
              className="text-sm font-medium text-brand-black"
            >
              Description
            </label>
            <textarea
              id="ticket-description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
              placeholder="Provide detailed information about the issue"
              className="w-full rounded-lg border border-brand-border-light bg-brand-light-bg px-4 py-2 text-sm text-brand-black placeholder:text-brand-ash focus:border-brand-main focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-brand-border-light px-4 py-2 text-sm font-medium text-brand-ash transition-fx hover:border-brand-main hover:text-brand-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-brand-white transition-fx hover:bg-brand-main/90"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

