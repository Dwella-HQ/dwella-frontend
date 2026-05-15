import * as React from "react";
import { User, FileText, Home } from "lucide-react";

export type SignUpStep = number;
export type SignUpProgressStep = {
  number: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type SignUpProgressProps = {
  currentStep: SignUpStep;
  steps?: SignUpProgressStep[];
};

const defaultSteps: SignUpProgressStep[] = [
  { number: 1, label: "Your Details", icon: User },
  { number: 2, label: "Documents", icon: FileText },
  { number: 3, label: "First Property", icon: Home },
];

export const SignUpProgress = ({ currentStep, steps }: SignUpProgressProps) => {
  const stepList = steps ?? defaultSteps;

  return (
    <div className="flex items-center justify-center gap-1.5 overflow-x-auto px-1 sm:gap-3 md:gap-4">
      {stepList.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;

        return (
          <React.Fragment key={step.number}>
            <div className="flex shrink-0 flex-col items-center gap-1 sm:gap-2">
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
                className={`whitespace-nowrap text-center text-[10px] font-medium leading-none sm:text-xs ${
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
            {index < stepList.length - 1 && (
              <div
                className={`h-0.5 w-5 shrink-0 sm:w-8 md:w-14 transition ${
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
