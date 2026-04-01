import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, ChevronRight, Check, AlertCircle, Calendar, Clock, FileText } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { Controller, useForm } from "react-hook-form";
import { DayPicker } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { inviteTenant, type RentFrequency, type IdType } from "@/api/tenants";
import { getApplicants, type Applicant } from "@/api/applicants";
import { uploadFile } from "@/api/files";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";

function LeaseDatePickerField({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseISO(value) : undefined;
  const defaultMonth = selected ?? new Date();
  const y = new Date().getFullYear();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
        >
          <span className={value ? "" : "text-gray-400"}>
            {value
              ? format(parseISO(value), "MMM d, yyyy")
              : "Select date"}
          </span>
          <Calendar className="h-4 w-4 text-gray-400" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[200] rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
          align="start"
          sideOffset={4}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            defaultMonth={defaultMonth}
            captionLayout="dropdown"
            startMonth={new Date(y - 50, 0)}
            endMonth={new Date(y + 20, 11)}
            className="text-gray-900"
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Convert YYYY-MM-DD to ISO 8601 date string (UTC midnight) */
function toISO8601Date(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toISOString();
}

const ID_TYPE_OPTIONS: { value: IdType; label: string }[] = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "DRIVER_LICENSE", label: "Driver's License" },
  { value: "PASSPORT", label: "Passport" },
  { value: "OTHER", label: "Other" },
];

type AssignTenantFormValues = {
  // Step 1
  fullName: string;
  email: string;
  phoneNumber: string;
  idType: IdType | "";
  idNumber: string;
  employed: string; // "yes" | "no" for form, mapped to isEmployed boolean
  employerName: string;
  employerContact: string;
  // Step 2
  leaseStartDate: string;
  leaseEndDate: string;
  rentAmount: string;
  rentFrequency: RentFrequency;
  serviceCharge: string;
  serviceChargeFrequency: string;
  securityDeposit: string;
  leaseOption: "auto" | "upload";
};

const RENT_FREQUENCY_OPTIONS: { value: RentFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const SERVICE_CHARGE_FREQUENCY_OPTIONS = [
  { value: "one_time", label: "One Time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export type UnitOption = {
  id: string;
  unitId: string;
  type: string;
};

export type AddTenantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  unitId?: string;
  unitLabel?: string;
  /** When opened from property details (no unitId), pass units so user can select one */
  units?: UnitOption[];
  onSuccess?: () => void;
};

const defaultValues: AssignTenantFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  idType: "",
  idNumber: "",
  employed: "",
  employerName: "",
  employerContact: "",
  leaseStartDate: "",
  leaseEndDate: "",
  rentAmount: "250,000",
  rentFrequency: "monthly",
  serviceCharge: "50,000",
  serviceChargeFrequency: "one_time",
  securityDeposit: "50,000",
  leaseOption: "auto",
};

export const AddTenantModal = ({
  isOpen,
  onClose,
  propertyId,
  unitId,
  unitLabel,
  units,
  onSuccess,
}: AddTenantModalProps) => {
  const { user } = useUser();
  const { showToast } = useToast();
  const [step, setStep] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<"new" | "applicants">("new");
  const [selectedUnitId, setSelectedUnitId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [idDocumentId, setIdDocumentId] = React.useState<string | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = React.useState<string | null>(null);
  const [idFileName, setIdFileName] = React.useState<string | null>(null);
  const [idUploading, setIdUploading] = React.useState(false);
  const idPreviewUrlRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    idPreviewUrlRef.current = idPreviewUrl;
  }, [idPreviewUrl]);
  const [leaseDocumentId, setLeaseDocumentId] = React.useState<string | null>(null);
  const [leaseUploading, setLeaseUploading] = React.useState(false);
  const [leaseFileName, setLeaseFileName] = React.useState<string | null>(null);

  const [applicants, setApplicants] = React.useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = React.useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = React.useState<string | null>(null);
  /** True after Continue from step 1 on the "New Tenant" tab — auto lease is turned off */
  const [newTenantStep1Complete, setNewTenantStep1Complete] = React.useState(false);

  const fromPropertyPage = Boolean(units?.length && !unitId);
  const effectiveUnitId = unitId ?? selectedUnitId;
  const selectedUnit = units?.find((u) => u.id === selectedUnitId);

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AssignTenantFormValues>({
    defaultValues,
  });

  const formValues = watch();

  const leaseAutoDisabled =
    Boolean(selectedApplicantId) ||
    (activeTab === "new" && step >= 2 && newTenantStep1Complete);

  React.useEffect(() => {
    if (leaseAutoDisabled) {
      setValue("leaseOption", "upload");
    }
  }, [leaseAutoDisabled, setValue]);

  const displayLabel = React.useMemo(() => {
    if (unitLabel) return unitLabel;
    if (selectedUnit) return `${selectedUnit.unitId} • ${selectedUnit.type}`;
    if (unitId) return `Unit ${unitId.slice(0, 8)}...`;
    return "Select unit";
  }, [unitLabel, selectedUnit, unitId]);

  const resetAndClose = React.useCallback(() => {
    if (idPreviewUrlRef.current) {
      URL.revokeObjectURL(idPreviewUrlRef.current);
      idPreviewUrlRef.current = null;
    }
    setStep(1);
    setActiveTab("new");
    setSelectedUnitId(null);
    setSelectedApplicantId(null);
    setNewTenantStep1Complete(false);
    setApplicants([]);
    setSubmitError(null);
    setIdDocumentId(null);
    setIdPreviewUrl(null);
    setIdFileName(null);
    setLeaseDocumentId(null);
    setLeaseFileName(null);
    reset(defaultValues);
    onClose();
  }, [onClose, reset]);

  React.useEffect(() => {
    if (!isOpen || activeTab !== "applicants") return;
    setApplicantsLoading(true);
    getApplicants({
      ...(effectiveUnitId && { unitId: effectiveUnitId }),
      ...(propertyId && { propertyId }),
    })
      .then((res) => {
        if (res.success) setApplicants(res.data);
      })
      .finally(() => setApplicantsLoading(false));
  }, [isOpen, activeTab, effectiveUnitId, propertyId]);

  const handleIdUpload = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (idPreviewUrl) URL.revokeObjectURL(idPreviewUrl);
      if (file.type.startsWith("image/")) {
        setIdPreviewUrl(URL.createObjectURL(file));
      } else {
        setIdPreviewUrl(null);
      }
      setIdFileName(file.name);
      setIdUploading(true);
      const result = await uploadFile({
        file,
        folder: "tenant",
        label: "id_document",
        token: user?.token,
      });
      if (result.success) {
        setIdDocumentId(result.data.id);
      }
      setIdUploading(false);
      e.target.value = "";
    },
    [user?.token, idPreviewUrl]
  );

  const clearIdDocument = React.useCallback(() => {
    if (idPreviewUrl) URL.revokeObjectURL(idPreviewUrl);
    setIdPreviewUrl(null);
    setIdFileName(null);
    setIdDocumentId(null);
  }, [idPreviewUrl]);

  const handleLeaseUpload = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLeaseFileName(file.name);
      setLeaseUploading(true);
      const result = await uploadFile({
        file,
        folder: "tenant",
        label: "lease_document",
        token: user?.token,
      });
      if (result.success) {
        setLeaseDocumentId(result.data.id);
        setValue("leaseOption", "upload");
      }
      setLeaseUploading(false);
      e.target.value = "";
    },
    [user?.token, setValue]
  );

  const clearLeaseDocument = React.useCallback(() => {
    setLeaseFileName(null);
    setLeaseDocumentId(null);
  }, []);

  const onConfirmAssignment = React.useCallback(async () => {
    if (!effectiveUnitId) {
      setSubmitError("Unit is required.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    const rentAmount = Number(formValues.rentAmount?.replace(/\D/g, "")) || 0;
    const serviceCharge = Number(formValues.serviceCharge?.replace(/\D/g, "")) || 0;
    const securityDeposit = Number(formValues.securityDeposit?.replace(/\D/g, "")) || 0;

    const serviceChargeFreq =
      formValues.serviceChargeFrequency === "one_time"
        ? "yearly"
        : (formValues.serviceChargeFrequency as RentFrequency);

    const payload = {
      email: formValues.email,
      fullName: formValues.fullName,
      phoneNumber: formValues.phoneNumber,
      unitId: effectiveUnitId,
      idType: formValues.idType as IdType,
      idNumber: formValues.idNumber,
      idDocumentId: idDocumentId!,
      isEmployed: formValues.employed === "yes",
      employerName: formValues.employerName,
      employerContact: formValues.employerContact,
      leaseStartDate: toISO8601Date(formValues.leaseStartDate),
      leaseEndDate: toISO8601Date(formValues.leaseEndDate),
      rentFrequency: formValues.rentFrequency,
      rentAmount,
      securityDeposit,
      serviceCharge,
      serviceChargeFrequency: serviceChargeFreq,
      ...(formValues.leaseOption === "upload" && leaseDocumentId
        ? { leaseDocumentId }
        : {}),
    };

    console.log("[Assign Tenant] Request payload:", payload);
    console.log("[Assign Tenant] leaseStartDate (raw):", formValues.leaseStartDate, "-> ISO:", payload.leaseStartDate);
    console.log("[Assign Tenant] leaseEndDate (raw):", formValues.leaseEndDate, "-> ISO:", payload.leaseEndDate);

    try {
      const result = await inviteTenant(payload);

      console.log("[Assign Tenant] Server response:", result);

      if (result.success) {
        showToast("Tenant invited successfully", "success");
        onSuccess?.();
        resetAndClose();
      } else {
        setSubmitError(result.error);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }, [effectiveUnitId, formValues, leaseDocumentId, idDocumentId, resetAndClose, showToast]);

  const step1ValidNew =
    !!formValues.fullName?.trim() &&
    !!formValues.email?.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email) &&
    !!formValues.phoneNumber?.trim() &&
    !!formValues.idType &&
    !!formValues.idNumber?.trim() &&
    !!idDocumentId &&
    !!formValues.employed &&
    !!formValues.employerName?.trim() &&
    !!formValues.employerContact?.trim() &&
    (!fromPropertyPage || !!selectedUnitId);
  const step1Valid =
    activeTab === "applicants"
      ? !!selectedApplicantId && (!fromPropertyPage || !!selectedUnitId)
      : step1ValidNew;

  const handleContinueFromApplicants = React.useCallback(() => {
    const applicant = applicants.find((a) => a.id === selectedApplicantId);
    if (!applicant) return;
    setNewTenantStep1Complete(false);
    setValue("fullName", applicant.fullName);
    setValue("email", applicant.email);
    setValue("phoneNumber", applicant.phoneNumber ?? "");
    setStep(2);
  }, [applicants, selectedApplicantId, setValue]);

  const step2Valid =
    formValues.leaseStartDate &&
    formValues.leaseEndDate &&
    Number(formValues.rentAmount?.replace(/\D/g, "")) > 0 &&
    (formValues.leaseOption === "auto" || !!leaseDocumentId) &&
    (!selectedApplicantId ||
      (!!formValues.idType &&
        !!formValues.idNumber?.trim() &&
        !!idDocumentId &&
        !!formValues.employed &&
        !!formValues.employerName?.trim() &&
        !!formValues.employerContact?.trim()));

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
          />
        </Dialog.Overlay>
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900">
                  Assign Tenant
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-gray-600">
                  {displayLabel}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Step indicator - centered */}
            <div className="mb-6 flex justify-center">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        step > s
                          ? "bg-green-600 text-white"
                          : step === s
                          ? "bg-gray-900 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step > s ? <Check className="h-4 w-4" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`h-0.5 w-8 rounded ${
                          step > s ? "bg-green-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1 */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4 flex gap-2 rounded-lg bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("new");
                        setSelectedApplicantId(null);
                        setNewTenantStep1Complete(false);
                        setValue("leaseOption", "auto");
                      }}
                      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                        activeTab === "new"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      New Tenant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("applicants");
                        setNewTenantStep1Complete(false);
                      }}
                      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                        activeTab === "applicants"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      From Applicants
                    </button>
                  </div>

                  {activeTab === "new" && (
                    <form
                      id="assign-tenant-step1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (step1Valid) {
                          setNewTenantStep1Complete(true);
                          setStep(2);
                        }
                      }}
                      className="space-y-6"
                    >
                      {fromPropertyPage && (
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Unit <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedUnitId ?? ""}
                            onChange={(e) => setSelectedUnitId(e.target.value || null)}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          >
                            <option value="">Placeholder</option>
                            {units?.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.unitId} • {u.type}
                              </option>
                            ))}
                          </select>
                          {!selectedUnitId && (
                            <p className="mt-1 text-xs text-red-600">Select a unit</p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="Placeholder"
                          {...register("fullName", { required: true })}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-xs text-red-600">Required</p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            placeholder="Placeholder"
                            {...register("email", { required: true })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          />
                          {errors.email && (
                            <p className="mt-1 text-xs text-red-600">Required</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          <Controller
                            name="phoneNumber"
                            control={control}
                            rules={{ required: "Phone number is required" }}
                            render={({ field }) => (
                              <PhoneInputWithCountry
                                id="phoneNumber"
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="801 234 5678"
                                aria-invalid={!!errors.phoneNumber}
                                aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
                              />
                            )}
                          />
                          {errors.phoneNumber && (
                            <p id="phoneNumber-error" className="mt-1 text-xs text-red-600">
                              {errors.phoneNumber.message as string}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            ID Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...register("idType", { required: true })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          >
                            <option value="">Select type</option>
                            {ID_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          {errors.idType && (
                            <p className="mt-1 text-xs text-red-600">Required</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            ID Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 12345678901"
                            {...register("idNumber", { required: true })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          />
                          {errors.idNumber && (
                            <p className="mt-1 text-xs text-red-600">Required</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Upload ID Document <span className="text-red-500">*</span>
                        </label>
                        {idDocumentId ? (
                          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            {idPreviewUrl ? (
                              <img
                                src={idPreviewUrl}
                                alt="ID preview"
                                className="h-16 w-24 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-24 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                                PDF
                              </div>
                            )}
                            <span className="flex-1 truncate text-sm text-gray-700">
                              {idFileName ?? "Document"}
                            </span>
                            <button
                              type="button"
                              onClick={clearIdDocument}
                              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-6 transition hover:border-gray-400 hover:bg-gray-100">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={handleIdUpload}
                              disabled={idUploading}
                            />
                            {idUploading ? (
                              <span className="text-sm text-gray-500">Uploading…</span>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Click to upload ID document (image or PDF)
                                </span>
                              </>
                            )}
                          </label>
                        )}
                        {!idDocumentId && !idUploading && (
                          <p className="mt-1 text-xs text-red-600">ID document is required</p>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Employed? <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...register("employed", { required: true })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                          {errors.employed && (
                            <p className="mt-1 text-xs text-red-600">Required</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Employer Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Company or N/A"
                            {...register("employerName", { required: true })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          />
                          {errors.employerName && (
                            <p className="mt-1 text-xs text-red-600">Required</p>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Employer Contact <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Phone or email"
                            {...register("employerContact", { required: true })}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          />
                          {errors.employerContact && (
                            <p className="mt-1 text-xs text-red-600">Required</p>
                          )}
                        </div>
                      </div>
                    </form>
                  )}

                  {activeTab === "applicants" && (
                    <div className="space-y-3">
                      {applicantsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                        </div>
                      ) : applicants.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                          No applicants yet. Applicants will appear here when the list is available from the server.
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {applicants.map((a) => {
                            const initial = (a.fullName || "?").charAt(0).toUpperCase();
                            const isSelected = selectedApplicantId === a.id;
                            return (
                              <li key={a.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedApplicantId(a.id)}
                                  className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition ${
                                    isSelected
                                      ? "border-brand-main bg-brand-main/5"
                                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                                    {initial}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {a.fullName}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">{a.email}</p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    {a.creditScore != null && (
                                      <p className="text-xs font-medium text-gray-700">
                                        {a.creditScore} Credit
                                      </p>
                                    )}
                                    {a.status && (
                                      <span
                                        className={`inline-block text-xs font-medium ${
                                          a.status.toLowerCase() === "approved"
                                            ? "text-green-600"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {a.status}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    {activeTab === "applicants" ? (
                      <button
                        type="button"
                        onClick={handleContinueFromApplicants}
                        disabled={!step1Valid}
                        className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Continue <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        form="assign-tenant-step1"
                        disabled={!step1Valid}
                        className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Continue <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-6">
                    {selectedApplicantId && (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">
                          Tenant verification
                        </h3>
                        <p className="mb-3 text-xs text-gray-500">
                          Provide ID and employment details for the selected applicant.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              ID Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              {...register("idType", { required: true })}
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                            >
                              <option value="">Select type</option>
                              {ID_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {errors.idType && (
                              <p className="mt-1 text-xs text-red-600">Required</p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              ID Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 12345678901"
                              {...register("idNumber", { required: true })}
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                            />
                            {errors.idNumber && (
                              <p className="mt-1 text-xs text-red-600">Required</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Upload ID Document <span className="text-red-500">*</span>
                          </label>
                          {idDocumentId ? (
                            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                              {idPreviewUrl ? (
                                <img
                                  src={idPreviewUrl}
                                  alt="ID preview"
                                  className="h-16 w-24 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-24 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                                  PDF
                                </div>
                              )}
                              <span className="flex-1 truncate text-sm text-gray-700">
                                {idFileName ?? "Document"}
                              </span>
                              <button
                                type="button"
                                onClick={clearIdDocument}
                                className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-6 transition hover:border-gray-400 hover:bg-gray-100">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={handleIdUpload}
                                disabled={idUploading}
                              />
                              {idUploading ? (
                                <span className="text-sm text-gray-500">Uploading…</span>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    Click to upload ID document (image or PDF)
                                  </span>
                                </>
                              )}
                            </label>
                          )}
                          {!idDocumentId && !idUploading && (
                            <p className="mt-1 text-xs text-red-600">ID document is required</p>
                          )}
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Employed? <span className="text-red-500">*</span>
                            </label>
                            <select
                              {...register("employed", { required: true })}
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                            >
                              <option value="">Select</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                            {errors.employed && (
                              <p className="mt-1 text-xs text-red-600">Required</p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Employer Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Company or N/A"
                              {...register("employerName", { required: true })}
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                            />
                            {errors.employerName && (
                              <p className="mt-1 text-xs text-red-600">Required</p>
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Employer Contact <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Phone or email"
                              {...register("employerContact", { required: true })}
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                            />
                            {errors.employerContact && (
                              <p className="mt-1 text-xs text-red-600">Required</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Lease Details
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Lease Start Date
                          </label>
                          <Controller
                            name="leaseStartDate"
                            control={control}
                            rules={{ required: "Lease start date is required" }}
                            render={({ field }) => (
                              <LeaseDatePickerField
                                id="lease-start-date"
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                          {errors.leaseStartDate && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.leaseStartDate.message as string}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Lease End Date
                          </label>
                          <Controller
                            name="leaseEndDate"
                            control={control}
                            rules={{ required: "Lease end date is required" }}
                            render={({ field }) => (
                              <LeaseDatePickerField
                                id="lease-end-date"
                                value={field.value}
                                onChange={field.onChange}
                              />
                            )}
                          />
                          {errors.leaseEndDate && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.leaseEndDate.message as string}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Rent
                          </label>
                          <input
                            type="text"
                            placeholder="₦250,000"
                            {...register("rentAmount")}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              if (v === "") {
                                setValue("rentAmount", "");
                                return;
                              }
                              setValue(
                                "rentAmount",
                                Number(v).toLocaleString("en-NG")
                              );
                            }}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Rent Frequency
                          </label>
                          <select
                            {...register("rentFrequency")}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          >
                            {RENT_FREQUENCY_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Service Charge
                          </label>
                          <input
                            type="text"
                            placeholder="₦50,000"
                            {...register("serviceCharge")}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              setValue(
                                "serviceCharge",
                                v === "" ? "" : Number(v).toLocaleString("en-NG")
                              );
                            }}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Service Charge Frequency
                          </label>
                          <select
                            {...register("serviceChargeFrequency")}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          >
                            {SERVICE_CHARGE_FREQUENCY_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Security Deposit
                          </label>
                          <input
                            type="text"
                            placeholder="₦50,000"
                            {...register("securityDeposit")}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              setValue(
                                "securityDeposit",
                                v === "" ? "" : Number(v).toLocaleString("en-NG")
                              );
                            }}
                            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Lease Documents
                      </h3>
                      <div className="space-y-3">
                        {leaseAutoDisabled && (
                          <p className="text-xs text-gray-600">
                            {selectedApplicantId
                              ? "This applicant is already in your pipeline. Upload a signed lease—auto-generated leases are not available when assigning from applicants."
                              : "Tenant details are saved for this assignment. Upload a signed lease—auto-generated leases are not available after tenant details are entered."}
                          </p>
                        )}
                        <label
                          className={`flex items-start gap-3 rounded-lg border border-gray-200 p-4 ${
                            leaseAutoDisabled
                              ? "cursor-not-allowed bg-gray-50 opacity-60"
                              : "cursor-pointer hover:bg-gray-50/50"
                          }`}
                        >
                          <input
                            type="radio"
                            value="auto"
                            {...register("leaseOption")}
                            disabled={leaseAutoDisabled}
                            className="mt-1 h-4 w-4 text-brand-main focus:ring-brand-main disabled:cursor-not-allowed"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              Auto Generate Standard Lease
                            </p>
                            <p className="text-sm text-gray-600">
                              Auto-fill with tenant & unit details
                            </p>
                          </div>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50/50">
                          <input
                            type="radio"
                            value="upload"
                            {...register("leaseOption")}
                            className="mt-1 h-4 w-4 text-brand-main focus:ring-brand-main"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">
                              Upload Signed Lease
                            </p>
                            <p className="text-sm text-gray-600">
                              PDF, DOCX up to 10MB
                            </p>
                            {(leaseFileName || leaseDocumentId) && !leaseUploading ? (
                              <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                                <span className="min-w-0 truncate text-sm text-gray-900">
                                  {leaseFileName ?? "Lease document"}
                                </span>
                                {leaseDocumentId && (
                                  <span className="text-xs text-green-600 flex-shrink-0">Uploaded</span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    clearLeaseDocument();
                                  }}
                                  className="rounded p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex-shrink-0"
                                  aria-label="Remove lease document"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  className="mt-2 hidden"
                                  id="lease-upload"
                                  onChange={handleLeaseUpload}
                                  disabled={leaseUploading}
                                />
                                <label
                                  htmlFor="lease-upload"
                                  className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  <Upload className="h-4 w-4" />
                                  {leaseUploading ? "Uploading..." : "Upload"}
                                </label>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (step2Valid) setStep(3);
                      }}
                      disabled={!step2Valid}
                      className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Continue <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Assignment Summary
                      </h3>
                      <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                        <div className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 text-sm">
                          <span className="text-gray-600">Tenant</span>
                          <span className="font-medium text-gray-900 text-right">
                            {formValues.fullName || "—"}
                          </span>
                          <span className="text-gray-600">Unit</span>
                          <span className="font-medium text-gray-900 text-right">
                            {displayLabel.replace(/^Unit\s/i, "") || "—"}
                          </span>
                          <span className="text-gray-600">Lease Term</span>
                          <span className="font-medium text-gray-900 text-right">
                            {formValues.leaseStartDate && formValues.leaseEndDate
                              ? `${formValues.leaseStartDate} – ${formValues.leaseEndDate}`
                              : "—"}
                          </span>
                          <span className="text-gray-600">Monthly Rent</span>
                          <span className="font-medium text-gray-900 text-right">
                            {formValues.rentFrequency === "monthly" && formValues.rentAmount
                              ? `₦${formValues.rentAmount}`
                              : formValues.rentAmount
                              ? `₦${formValues.rentAmount} (${formValues.rentFrequency})`
                              : "—"}
                          </span>
                          <span className="text-gray-600">Deposit</span>
                          <span className="font-medium text-gray-900 text-right">
                            {formValues.securityDeposit
                              ? `₦${formValues.securityDeposit}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-700">
                        The tenant will receive an email invitation to access their portal for
                        rent payments and maintenance requests.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-800">
                        Lease agreement will be sent for e-signature immediately after
                        assignment.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={onConfirmAssignment}
                      disabled={isSubmitting}
                      className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span className="ml-2">Assigning...</span>
                        </>
                      ) : (
                        "Confirm Assignment"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
