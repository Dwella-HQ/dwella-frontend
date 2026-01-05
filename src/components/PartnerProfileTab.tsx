import * as React from "react";
import { Calendar, Copy, Mail, MapPin, Phone, User } from "lucide-react";

export type PartnerProfileTabProps = {
  onSuspendPartner?: () => void;
  onResetPassword?: () => void;
};

export const PartnerProfileTab = ({
  onSuspendPartner,
  onResetPassword,
}: PartnerProfileTabProps) => {
  const handleCopyEmail = React.useCallback(() => {
    navigator.clipboard.writeText("@buypowerpartner.com");
  }, []);

  return (
    <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-brand-black">
        Basic Information
      </h2>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-main/10 text-lg font-medium text-brand-main">
          AU
        </div>
        <div>
          <p className="text-base font-semibold text-brand-black">Admin User</p>
          <p className="text-sm text-brand-ash">@buypowerpartner.com</p>
        </div>
      </div>

      <div className="grid gap-6 border-t border-brand-border-light pt-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-brand-ash" />
            <span className="text-sm font-normal text-brand-black">
              Esther Adamu
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-brand-ash" />
            <span className="text-sm font-normal text-brand-black">
              @buypowerpartner.com
            </span>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="cursor-pointer rounded p-1 text-brand-ash transition-fx hover:bg-brand-light-bg hover:text-brand-black"
              aria-label="Copy email"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-brand-ash" />
            <span className="text-sm font-normal text-brand-black">
              +2348123674727
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-brand-ash" />
            <span className="text-sm font-normal text-brand-black">
              Added October 27, 2025
            </span>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-brand-ash" />
            <span className="text-sm font-normal text-brand-black">
              Nigeria
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-brand-border-light pt-6">
        <button
          type="button"
          onClick={onSuspendPartner}
          className="cursor-pointer rounded-lg border border-brand-failed-text px-4 py-2 text-sm font-medium text-brand-failed-text transition-fx hover:bg-brand-failed-bg"
        >
          Suspend Partner
        </button>
        <button
          type="button"
          onClick={onResetPassword}
          className="cursor-pointer rounded-lg border border-brand-border-light px-4 py-2 text-sm font-medium text-brand-black transition-fx hover:bg-brand-light-bg"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
};
