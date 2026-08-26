import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  formatSecurityTimestamp,
  type SecurityCodeLookup,
} from "@/lib/securitySession";

export type SecurityVerifyResult =
  | { kind: "valid"; lookup: SecurityCodeLookup; code: string; timestamp: string }
  | { kind: "invalid"; code: string };

type SecurityVerifyModalProps = {
  result: SecurityVerifyResult | null;
  onApprove: () => void;
  onDeny: () => void;
};

export const SecurityVerifyModal = ({
  result,
  onApprove,
  onDeny,
}: SecurityVerifyModalProps) => {
  const isValid = result?.kind === "valid";

  return (
    <Dialog.Root open={result !== null}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl focus:outline-none sm:p-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                isValid ? "bg-emerald-500" : "bg-red-500"
              }`}
            >
              {isValid ? (
                <Check className="h-8 w-8 text-white" strokeWidth={3} />
              ) : (
                <X className="h-8 w-8 text-white" strokeWidth={3} />
              )}
            </div>
            <Dialog.Title className="text-2xl font-bold text-gray-900">
              {isValid ? "Valid Code" : "Invalid Code"}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {isValid
                ? "This access code is valid. Approve or deny entry."
                : "This access code is invalid."}
            </Dialog.Description>

            {result ? (
              <div className="mt-5 w-full rounded-xl bg-gray-100 px-4 py-4 text-left text-sm text-gray-800">
                <p>
                  <span className="font-medium">Code:</span> {result.code}
                </p>
                {result.kind === "valid" ? (
                  <>
                    <p className="mt-1 font-semibold">
                      {result.lookup.name} ({result.lookup.role})
                    </p>
                    <p className="mt-1 text-gray-600">
                      {result.lookup.location} •{" "}
                      {formatSecurityTimestamp(result.timestamp)}
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex w-full flex-col gap-3">
              {isValid ? (
                <button
                  type="button"
                  onClick={onApprove}
                  className="h-11 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Approve Entry
                </button>
              ) : null}
              <button
                type="button"
                onClick={onDeny}
                className="h-11 w-full rounded-lg border border-red-500 bg-white text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Deny Entry
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
