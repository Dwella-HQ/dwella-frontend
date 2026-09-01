import * as React from "react";

type DataUnavailableBannerProps = {
  title: string;
  description?: string;
  tone?: "warning" | "neutral";
};

export const DataUnavailableBanner = ({
  title,
  description,
  tone = "warning",
}: DataUnavailableBannerProps) => {
  const styles =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-gray-200 bg-gray-50 text-gray-900";

  return (
    <div
      className={`rounded-2xl border px-6 py-10 text-center ${styles}`}
      role="status"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm opacity-80">{description}</p>
      ) : null}
    </div>
  );
};
