import * as React from "react";
import { motion } from "framer-motion";
import { X, ArrowLeft, Check, Upload, AlertCircle } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { createUnit } from "@/api/units";
import { uploadFile, deleteFile } from "@/api/files";
import { getAmenities } from "@/api/amenities";
import { useToast } from "@/components/Toast";
import { useUser } from "@/contexts/UserContext";

const addUnitSchema = z.object({
  property: z.string().min(1, "Property is required"),
  unitName: z.string().min(1, "Unit name is required"),
  bedrooms: z.string().min(1, "Bedrooms is required"),
  bathrooms: z.string().min(1, "Bathrooms is required"),
  monthlyRent: z.string().min(1, "Monthly rent is required"),
  rentDuration: z.string().min(1, "Rent duration is required"),
  cautionFee: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export type AddUnitFormValues = z.infer<typeof addUnitSchema>;

export type AddUnitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyLabel?: string;
  /** When opening from global pages (e.g. All Units), lets the landlord pick which property to attach the unit to */
  pickerProperties?: { id: string; name: string }[];
  onSuccess?: (data: AddUnitFormValues & { amenities: string[] }) => void;
};

export const AddUnitModal = ({
  isOpen,
  onClose,
  propertyId,
  propertyLabel,
  pickerProperties,
  onSuccess,
}: AddUnitModalProps) => {
  const { showToast } = useToast();
  const { user } = useUser();
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>(
    [],
  );
  const [apiAmenities, setApiAmenities] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [amenitiesLoading, setAmenitiesLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = React.useState<
    {
      file: File;
      preview: string;
      fileId?: string;
      isUploading?: boolean;
      uploadError?: string;
    }[]
  >([]);
  const [photoUploadProgress, setPhotoUploadProgress] = React.useState<
    Record<number, number>
  >({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const preassignedProperty =
    Boolean(propertyId) &&
    propertyId !== "" &&
    propertyId !== "temp-property-id";
  const resolvedPropertyLabel = React.useMemo(() => {
    if (propertyLabel && propertyLabel.trim()) return propertyLabel;
    if (pickerProperties && propertyId) {
      const found = pickerProperties.find((p) => p.id === propertyId);
      if (found) return found.name;
    }
    return "Select property";
  }, [pickerProperties, propertyId, propertyLabel]);

  React.useEffect(() => {
    getAmenities().then((result) => {
      if (result.success) setApiAmenities(result.data);
      setAmenitiesLoading(false);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AddUnitFormValues>({
    resolver: zodResolver(addUnitSchema),
    defaultValues: {
      property: propertyId,
      rentDuration: "monthly",
    },
  });

  React.useEffect(() => {
    if (propertyId && propertyId !== "temp-property-id") {
      setValue("property", propertyId);
    }
  }, [propertyId, setValue]);

  React.useEffect(() => {
    if (
      isOpen &&
      pickerProperties &&
      pickerProperties.length > 0 &&
      (!propertyId || propertyId === "")
    ) {
      setValue("property", pickerProperties[0].id);
    }
  }, [isOpen, pickerProperties, propertyId, setValue]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto = {
          file,
          preview: reader.result as string,
          isUploading: true,
          uploadError: undefined,
        };

        // Add photo immediately with uploading state and get the index
        let photoIndex: number;
        setUploadedPhotos((prev) => {
          photoIndex = prev.length;
          setPhotoUploadProgress((prevProgress) => ({
            ...prevProgress,
            [photoIndex]: 0,
          }));
          return [...prev, newPhoto];
        });

        // Upload immediately using the captured index
        uploadFile({
          file,
          folder: "unit",
          label: "unit_photo",
          token: user?.token,
          onProgress: (percent) =>
            setPhotoUploadProgress((prev) => ({
              ...prev,
              [photoIndex!]: percent,
            })),
        }).then((result) => {
          setUploadedPhotos((prev) => {
            const updated = [...prev];
            if (updated[photoIndex!]) {
              updated[photoIndex!] = {
                ...updated[photoIndex!],
                isUploading: false,
                fileId: result.success ? result.data.id : undefined,
                uploadError: result.success ? undefined : result.error,
              };
            }
            return updated;
          });

          if (!result.success) {
            showToast(result.error || `Failed to upload ${file.name}`, "error");
          }
        });
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = async (index: number) => {
    const photo = uploadedPhotos[index];

    // If photo has been uploaded, delete it from server
    if (photo?.fileId) {
      const deleteResult = await deleteFile(photo.fileId);
      if (!deleteResult.success) {
        showToast(
          deleteResult.error || "Failed to delete photo from server",
          "error",
        );
        return;
      }
    }

    // Remove from local state
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUploadProgress((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  // Reset photos when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setUploadedPhotos([]);
      setPhotoUploadProgress({});
    }
  }, [isOpen]);

  const onSubmit = handleSubmit(async (data) => {
    const pickedFromForm =
      typeof data.property === "string" && data.property.trim().length > 0;

    const effectivePropertyId = preassignedProperty
      ? propertyId
      : pickedFromForm
        ? data.property
        : "";

    const legacyNoApi =
      !preassignedProperty &&
      !pickedFromForm &&
      (!pickerProperties || pickerProperties.length === 0);

    if (legacyNoApi) {
      const unitData = { ...data, amenities: selectedAmenities };
      if (onSuccess) {
        onSuccess(unitData);
      }
      reset();
      setSelectedAmenities([]);
      onClose();
      return;
    }

    if (!effectivePropertyId) {
      showToast("Please select a property.", "error");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Map form data to API format
      const unitData = {
        name: data.unitName,
        rentAmount: parseFloat(data.monthlyRent.replace(/[^0-9.]/g, "")),
        numberOfBedrooms: parseInt(data.bedrooms),
        numberOfBathrooms: parseInt(data.bathrooms),
        isAvailable: true,
        amenities: selectedAmenities,
      };

      const result = await createUnit(effectivePropertyId, unitData);

      if (result.success) {
        const unitFormData = { ...data, amenities: selectedAmenities };
        if (onSuccess) {
          onSuccess(unitFormData);
        }
        showToast("Unit created successfully", "success");
        reset();
        setSelectedAmenities([]);
        onClose();
      } else {
        const message = result.error || "Failed to create unit";
        setSubmitError(message);
        showToast(message, "error");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      setSubmitError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
          />
        </Dialog.Overlay>
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-0 shadow-xl focus:outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 mb-6 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </Dialog.Close>
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-900">
                    Add New Unit
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-gray-600">
                    Create a new unit with complete details.
                  </Dialog.Description>
                </div>
              </div>
              <button
                type="submit"
                form="add-unit-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>

            {/* Form */}
            <form
              id="add-unit-form"
              onSubmit={onSubmit}
              className="space-y-6 px-6 pb-6"
            >
              {/* Error Message */}
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-900">
                        Error
                      </h3>
                      <p className="mt-1 text-sm text-red-700">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Unit Details */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase text-gray-700">
                  Unit Details
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Property
                    </label>
                    <select
                      {...register("property")}
                      disabled={preassignedProperty}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    >
                      {preassignedProperty ? (
                        <option value={propertyId}>
                          {resolvedPropertyLabel}
                        </option>
                      ) : (
                        <>
                          <option value="">Select property</option>
                          {pickerProperties && pickerProperties.length > 0
                            ? pickerProperties.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))
                            : null}
                        </>
                      )}
                    </select>
                    {errors.property && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.property.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Unit Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 2B"
                      {...register("unitName")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    />
                    {errors.unitName && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.unitName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2"
                      {...register("bedrooms")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    />
                    {errors.bedrooms && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.bedrooms.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2"
                      {...register("bathrooms")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    />
                    {errors.bathrooms && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.bathrooms.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Unit rent
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 250000"
                      {...register("monthlyRent")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    />
                    {errors.monthlyRent && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.monthlyRent.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <select
                      {...register("rentDuration")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    {errors.rentDuration && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.rentDuration.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Caution Fee
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 50000"
                      {...register("cautionFee")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase text-gray-700">
                  Amenities
                </h3>
                {amenitiesLoading ? (
                  <p className="text-sm text-gray-500">Loading amenities…</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {apiAmenities.map((amenity) => {
                      const isSelected = selectedAmenities.includes(
                        amenity.name,
                      );
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.name)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                            isSelected
                              ? "text-gray-700 border border-gray-200"
                              : "bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-50"
                          }`}
                          style={
                            isSelected ? { backgroundColor: "#EFF6FF" } : {}
                          }
                        >
                          {amenity.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Unit Photos */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase text-gray-700">
                  Unit Photos
                </h3>

                {/* Uploaded Photos Grid */}
                {uploadedPhotos.length > 0 && (
                  <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          <Image
                            src={photo.preview}
                            alt={`Unit photo ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {photo.isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-center">
                                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent mb-2"></div>
                                <p className="text-xs text-white">
                                  {photoUploadProgress[index] || 0}%
                                </p>
                              </div>
                            </div>
                          )}
                          {photo.uploadError && (
                            <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center">
                              <div className="text-center p-2">
                                <AlertCircle className="h-5 w-5 text-white mx-auto mb-1" />
                                <p className="text-xs text-white">
                                  Upload failed
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          disabled={photo.isUploading}
                          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-48 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-brand-main hover:bg-brand-main/5 transition"
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload unit photos
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG up to 10MB • Multiple images allowed
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
