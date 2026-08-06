import * as React from "react";

import {
  createServiceApartmentOffering,
  deleteServiceApartmentOffering,
  getServiceApartmentOffering,
  pricingTierFromOffering,
  SERVICE_APARTMENT_PRICING_MODES,
  updateServiceApartmentOffering,
  type ServiceApartmentOfferingDTO,
  type ServiceApartmentPricingMode,
} from "@/api/properties";
import { useToast } from "@/components/Toast";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main";

type FormState = {
  pricing: Record<ServiceApartmentPricingMode, string>;
  minimumStay: string;
  maximumStay: string;
  clockoutTime: string;
  rules: string;
  description: string;
};

const emptyForm: FormState = {
  pricing: { weekly: "", biweekly: "", monthly: "" },
  minimumStay: "1",
  maximumStay: "30",
  clockoutTime: "11:00",
  rules: "",
  description: "",
};

function formFromOffering(offering: ServiceApartmentOfferingDTO): FormState {
  return {
    pricing: {
      weekly: String(pricingTierFromOffering(offering, "weekly") || ""),
      biweekly: String(pricingTierFromOffering(offering, "biweekly") || ""),
      monthly: String(pricingTierFromOffering(offering, "monthly") || ""),
    },
    minimumStay:
      offering.minimumStay != null ? String(offering.minimumStay) : "1",
    maximumStay:
      offering.maximumStay != null ? String(offering.maximumStay) : "30",
    clockoutTime: offering.clockoutTime || "11:00",
    rules: offering.rules || "",
    description: offering.description || "",
  };
}

type Props = {
  unitId: string;
  onChanged?: () => void;
};

export const ServiceApartmentOfferingPanel = ({ unitId, onChanged }: Props) => {
  const { showToast } = useToast();
  const [enabled, setEnabled] = React.useState(false);
  const [hasOffering, setHasOffering] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getServiceApartmentOffering(unitId);
    if (result.success && result.data) {
      setHasOffering(true);
      setEnabled(true);
      setForm(formFromOffering(result.data));
    } else {
      setHasOffering(false);
      setEnabled(false);
      setForm(emptyForm);
      // 404 = no offering yet — not an error for the panel
      if (result.success === false && result.statusCode !== 404) {
        // Keep quiet for missing offerings; surface unexpected errors lightly
        if (result.statusCode && result.statusCode >= 500) {
          setError(result.error);
        }
      }
    }
    setLoading(false);
  }, [unitId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleSave = React.useCallback(async () => {
    setError(null);
    const pricing = SERVICE_APARTMENT_PRICING_MODES.map(({ value }) => ({
      mode: value,
      price: form.pricing[value].trim(),
    })).filter((p) => p.price.length > 0);
    if (pricing.length === 0) {
      setError(
        "Set at least one rate (weekly, biweekly, or monthly).",
      );
      return;
    }
    if (!form.clockoutTime.trim()) {
      setError("Checkout time is required.");
      return;
    }
    if (!form.rules.trim()) {
      setError("House rules are required.");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    const minStay = Number.parseInt(form.minimumStay, 10);
    const maxStay = Number.parseInt(form.maximumStay, 10);

    setSaving(true);
    const payload = {
      minimumStay: Number.isFinite(minStay) && minStay > 0 ? minStay : undefined,
      maximumStay: Number.isFinite(maxStay) && maxStay > 0 ? maxStay : undefined,
      clockoutTime: form.clockoutTime.trim(),
      pricing,
      rules: form.rules.trim(),
      description: form.description.trim(),
    };

    const result = hasOffering
      ? await updateServiceApartmentOffering(unitId, payload)
      : await createServiceApartmentOffering(unitId, {
          unitId,
          ...payload,
        });

    if (!result.success) {
      setError(result.error || "Could not save service apartment offering.");
      showToast(result.error || "Failed to save offering", "error");
      setSaving(false);
      return;
    }

    setHasOffering(true);
    setEnabled(true);
    showToast(
      hasOffering ? "Service apartment offering updated" : "Unit listed as service apartment",
      "success",
    );
    onChanged?.();
    setSaving(false);
  }, [form, hasOffering, onChanged, showToast, unitId]);

  const handleRemove = React.useCallback(async () => {
    if (!hasOffering) {
      setEnabled(false);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await deleteServiceApartmentOffering(unitId);
    if (!result.success) {
      setError(result.error || "Could not remove offering.");
      showToast(result.error || "Failed to remove offering", "error");
      setSaving(false);
      return;
    }
    setHasOffering(false);
    setEnabled(false);
    setForm(emptyForm);
    showToast("Service apartment offering removed", "success");
    onChanged?.();
    setSaving(false);
  }, [hasOffering, onChanged, showToast, unitId]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-600">Loading service apartment…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Service apartment
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            List this unit for short stays (weekly/biweekly/monthly pricing,
            stay limits, and house rules). Guests can browse it when the
            property is open for service apartments.
          </p>
        </div>
        <label className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-gray-800">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const next = e.target.checked;
              setEnabled(next);
              if (!next && hasOffering) {
                void handleRemove();
              }
            }}
            className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-brand-main"
          />
          List as service apartment
        </label>
      </div>

      {enabled ? (
        <div className="space-y-4 border-t border-gray-100 pt-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pricing
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Set a rate for one or more stay durations — guests pay this
              total for that period, not a nightly rate. At least one is
              required.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SERVICE_APARTMENT_PRICING_MODES.map(({ value, label }) => (
                <div key={value}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    {label} price (₦)
                  </label>
                  <input
                    value={form.pricing[value]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        pricing: { ...p.pricing, [value]: e.target.value },
                      }))
                    }
                    inputMode="decimal"
                    placeholder={
                      value === "weekly"
                        ? "150000"
                        : value === "biweekly"
                          ? "280000"
                          : "500000"
                    }
                    className={inputClassName}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Checkout time
              </label>
              <input
                type="time"
                value={form.clockoutTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clockoutTime: e.target.value }))
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Minimum stay (nights)
              </label>
              <input
                type="number"
                min={1}
                value={form.minimumStay}
                onChange={(e) =>
                  setForm((p) => ({ ...p, minimumStay: e.target.value }))
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Maximum stay (nights)
              </label>
              <input
                type="number"
                min={1}
                value={form.maximumStay}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maximumStay: e.target.value }))
                }
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Bright 2BR with reliable power, treated water, and fast Wi‑Fi."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              House rules
            </label>
            <textarea
              rows={3}
              value={form.rules}
              onChange={(e) =>
                setForm((p) => ({ ...p, rules: e.target.value }))
              }
              placeholder={"No parties\nNo smoking\nPets on request"}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : hasOffering
                  ? "Update offering"
                  : "Create offering"}
            </button>
            {hasOffering ? (
              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Remove listing
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
