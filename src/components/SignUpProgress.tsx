import * as React from "react";
import { User, FileText, Home } from "lucide-react";

export type SignUpStep = 1 | 2 | 3;

export type SignUpProgressProps = {
  currentStep: SignUpStep;
};

export const SignUpProgress = ({ currentStep }: SignUpProgressProps) => {
  const steps = [
    {
      number: 1,
      label: "Your Details",
      icon: User,
    },
    {
      number: 2,
      label: "Documents",
      icon: FileText,
    },
    {
      number: 3,
      label: "First Property",
      icon: Home,
    },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;
        const isInactive = step.number > currentStep;

        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <div
                className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full transition ${
                  isCompleted
                    ? "bg-brand-green"
                    : isActive
                    ? "bg-brand-main"
                    : "bg-gray-300"
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium ${
                  isCompleted
                    ? "text-brand-green"
                    : isActive
                    ? "text-brand-main"
                    : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-16 transition ${
                  isCompleted ? "bg-brand-green" : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
