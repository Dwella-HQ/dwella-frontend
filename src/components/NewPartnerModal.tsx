import * as React from "react";
import { X } from "lucide-react";

import type { PartnerStatus } from "@/components/PartnersTable";

export type NewPartnerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (values: {
    name: string;
    email: string;
    status: PartnerStatus;
  }) => void;
};

export const NewPartnerModal = ({
  isOpen,
  onClose,
  onSubmit,
}: NewPartnerModalProps) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<PartnerStatus>("Active");

  const resetForm = React.useCallback(() => {
    setName("");
    setEmail("");
    setStatus("Active");
  }, []);

  const handleClose = React.useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit?.({
        name,
        email,
        status,
      });
      handleClose();
    },
    [email, handleClose, name, onSubmit, status]
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
              Add New Partner
            </p>
            <p className="text-sm text-brand-ash">
              Create a new partner account for the platform.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-lg p-2 text-brand-ash transition-fx hover:bg-brand-light-bg hover:text-brand-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="partner-name"
              className="text-sm font-medium text-brand-black"
            >
              Partner Name
            </label>
            <input
              id="partner-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Enter partner name"
              className="w-full rounded-lg border border-brand-border-light bg-brand-light-bg px-4 py-2 text-sm text-brand-black placeholder:text-brand-ash focus:border-brand-main focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="partner-email"
              className="text-sm font-medium text-brand-black"
            >
              Email / Domain
            </label>
            <input
              id="partner-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="@partnerdomain.com"
              className="w-full rounded-lg border border-brand-border-light bg-brand-light-bg px-4 py-2 text-sm text-brand-black placeholder:text-brand-ash focus:border-brand-main focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="partner-status"
              className="text-sm font-medium text-brand-black"
            >
              Status
            </label>
            <select
              id="partner-status"
              name="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as PartnerStatus)
              }
              className="w-full cursor-pointer rounded-lg border border-brand-border-light bg-brand-light-bg px-4 py-2 text-sm text-brand-black focus:border-brand-main focus:outline-none"
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-lg border border-brand-border-light px-4 py-2 text-sm font-medium text-brand-ash transition-fx hover:border-brand-main hover:text-brand-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-brand-white transition-fx hover:bg-brand-main/90"
            >
              Add Partner
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
