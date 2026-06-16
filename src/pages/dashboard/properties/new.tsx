import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  X,
  Upload,
  FileText,
  Home,
  ExternalLink,
  Zap,
  Droplet,
  Shield,
  Car,
  Wifi,
  Battery,
  Waves,
  Dumbbell,
  ArrowUpDown,
  Camera,
  Wind,
  Coffee,
  Tv,
  AlertTriangle,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { Country, State, City } from "country-state-city";

import { DashboardLayout } from "@/components/DashboardLayout";
import {
  AddUnitModal,
  type AddUnitFormValues,
} from "@/components/AddUnitModal";
import { useToast } from "@/components/Toast";
import { createProperty } from "@/api/properties";
import { uploadFile, deleteFile } from "@/api/files";
import { getAmenities } from "@/api/amenities";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import { useUser } from "@/contexts/UserContext";
import {
  getLandlordByUser,
  getLandlordVerificationStatus,
  isApprovedLandlordVerificationComplete,
  type LandlordVerificationStatus,
} from "@/api/landlord";
import type { CreatePropertyRequestDTO } from "@/api/properties";
import type { NextPageWithLayout } from "../../_app";

// Step 1 Schema
const basicDetailsSchema = z.object({
  propertyName: z.string().min(1, "Property name is required"),
  yearBuilt: z
    .string()
    .length(4, "Year must be exactly 4 characters (e.g., 2024)"),
  parkingSpace: z.string().min(1, "Parking space is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

type BasicDetailsFormValues = z.infer<typeof basicDetailsSchema>;

// Helper function to get amenity icon by name (API-driven names)
const getAmenityIcon = (amenityName: string) => {
  const lower = amenityName.toLowerCase();
  if (lower.includes("power") || lower.includes("24/7")) return Zap;
  if (lower.includes("water")) return Droplet;
  if (lower.includes("security") || lower.includes("secure")) return Shield;
  if (lower.includes("parking") || lower.includes("car")) return Car;
  if (lower.includes("internet") || lower.includes("wifi")) return Wifi;
  if (lower.includes("pool") || lower.includes("swim")) return Waves;
  if (lower.includes("gym") || lower.includes("fitness")) return Dumbbell;
  if (lower.includes("elevator")) return ArrowUpDown;
  if (lower.includes("cctv") || lower.includes("camera")) return Camera;
  if (lower.includes("air conditioning") || lower.includes("ac")) return Wind;
  if (lower.includes("lounge") || lower.includes("clubhouse")) return Coffee;
  if (lower.includes("tv") || lower.includes("cable")) return Tv;
  if (lower.includes("battery") || lower.includes("generator")) return Battery;
  return Home;
};

type Unit = {
  id: string;
  unitId: string;
  type: string;
  amenities: string[];
  rent: string;
  image: string;
};

const AddPropertyPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { selectedLandlord } = useSelectedLandlord();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>(
    [],
  );
  const [apiAmenities, setApiAmenities] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [amenitiesLoading, setAmenitiesLoading] = React.useState(true);
  const [uploadedPhotos, setUploadedPhotos] = React.useState<
    {
      file: File;
      preview: string;
      fileId?: string;
      isUploading?: boolean;
      uploadError?: string;
    }[]
  >([]);
  const [uploadedDocuments, setUploadedDocuments] = React.useState<
    {
      file: File;
      name: string;
      size: string;
      fileId?: string;
      isUploading?: boolean;
      uploadError?: string;
    }[]
  >([]);
  const [photoUploadProgress, setPhotoUploadProgress] = React.useState<
    Record<number, number>
  >({});
  const [documentUploadProgress, setDocumentUploadProgress] = React.useState<
    Record<number, number>
  >({});

  // Document types state
  const [landSurveyDoc, setLandSurveyDoc] = React.useState<{
    file: File;
    name: string;
    size: string;
    fileId?: string;
    isUploading?: boolean;
    uploadError?: string;
  } | null>(null);
  const [proofOfOwnershipDoc, setProofOfOwnershipDoc] = React.useState<{
    file: File;
    name: string;
    size: string;
    fileId?: string;
    isUploading?: boolean;
    uploadError?: string;
  } | null>(null);
  const [powerOfAttorneyDoc, setPowerOfAttorneyDoc] = React.useState<{
    file: File;
    name: string;
    size: string;
    fileId?: string;
    isUploading?: boolean;
    uploadError?: string;
  } | null>(null);
  const [otherDoc, setOtherDoc] = React.useState<{
    file: File;
    name: string;
    size: string;
    fileId?: string;
    isUploading?: boolean;
    uploadError?: string;
  } | null>(null);

  const [landSurveyProgress, setLandSurveyProgress] = React.useState(0);
  const [proofOfOwnershipProgress, setProofOfOwnershipProgress] =
    React.useState(0);
  const [powerOfAttorneyProgress, setPowerOfAttorneyProgress] =
    React.useState(0);
  const [otherDocProgress, setOtherDocProgress] = React.useState(0);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const yearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 80 }, (_, idx) => String(currentYear - idx));
  }, []);

  React.useEffect(() => {
    getAmenities().then((result) => {
      if (result.success) setApiAmenities(result.data);
      setAmenitiesLoading(false);
    });
  }, []);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isLandlordVerified, setIsLandlordVerified] = React.useState(true);
  const [landlordVerificationStatus, setLandlordVerificationStatus] =
    React.useState<LandlordVerificationStatus | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = React.useState<
    string | null
  >(null);
  const [createdPropertyName, setCreatedPropertyName] =
    React.useState<string>("");

  React.useEffect(() => {
    if (!user?.id || user.role !== "landlord") {
      setIsLandlordVerified(true);
      setLandlordVerificationStatus(null);
      return;
    }
    let cancelled = false;
    getLandlordByUser(String(user.id)).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setIsLandlordVerified(
          isApprovedLandlordVerificationComplete(result.data),
        );
        setLandlordVerificationStatus(
          getLandlordVerificationStatus(result.data),
        );
      } else {
        setIsLandlordVerified(true);
        setLandlordVerificationStatus(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    watch,
    setValue,
  } = useForm<BasicDetailsFormValues>({
    resolver: zodResolver(basicDetailsSchema),
    defaultValues: {
      country: "Nigeria",
      yearBuilt: String(new Date().getFullYear()),
    },
  });

  // Watch state to filter cities
  const selectedState = watch("state");

  // Get Nigeria country code
  const nigeria = Country.getAllCountries().find((c) => c.name === "Nigeria");
  const nigeriaCode = nigeria?.isoCode || "NG";

  // Get all Nigerian states
  const nigerianStates = State.getStatesOfCountry(nigeriaCode);

  // Get cities for selected state
  const citiesForState = selectedState
    ? City.getCitiesOfState(nigeriaCode, selectedState)
    : [];

  const steps = [
    { number: 1, label: "Basic Details" },
    { number: 2, label: "Photos" },
    { number: 3, label: "Documents" },
    { number: 4, label: "Units" },
  ];

  const toggleAmenity = (amenityName: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityName)
        ? prev.filter((a) => a !== amenityName)
        : [...prev, amenityName],
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
          folder: "property",
          label: "property_photo",
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

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      const sizeKB = (file.size / 1024).toFixed(2);
      const newDoc = {
        file,
        name: file.name,
        size: `${sizeKB} KB`,
        isUploading: true,
        uploadError: undefined,
      };

      // Add document immediately with uploading state and get the index
      let docIndex: number;
      setUploadedDocuments((prev) => {
        docIndex = prev.length;
        setDocumentUploadProgress((prevProgress) => ({
          ...prevProgress,
          [docIndex]: 0,
        }));
        return [...prev, newDoc];
      });

      // Upload immediately using the captured index
      uploadFile({
        file,
        folder: "property",
        label: "property_document",
        onProgress: (percent) =>
          setDocumentUploadProgress((prev) => ({
            ...prev,
            [docIndex!]: percent,
          })),
      }).then((result) => {
        setUploadedDocuments((prev) => {
          const updated = [...prev];
          if (updated[docIndex!]) {
            updated[docIndex!] = {
              ...updated[docIndex!],
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
    }
  };

  const removeDocument = async (index: number) => {
    const doc = uploadedDocuments[index];

    // If document has been uploaded, delete it from server
    if (doc?.fileId) {
      const deleteResult = await deleteFile(doc.fileId);
      if (!deleteResult.success) {
        showToast(
          deleteResult.error || "Failed to delete document from server",
          "error",
        );
        return;
      }
    }

    // Remove from local state
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
    setDocumentUploadProgress((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleDocumentTypeUpload = async (
    file: File,
    type: "landSurvey" | "proofOfOwnership" | "powerOfAttorney" | "other",
  ) => {
    const sizeKB = (file.size / 1024).toFixed(2);
    const newDoc = {
      file,
      name: file.name,
      size: `${sizeKB} KB`,
      isUploading: true,
      uploadError: undefined,
    };

    // Set the document state based on type
    const setterMap = {
      landSurvey: setLandSurveyDoc,
      proofOfOwnership: setProofOfOwnershipDoc,
      powerOfAttorney: setPowerOfAttorneyDoc,
      other: setOtherDoc,
    };
    const progressSetterMap = {
      landSurvey: setLandSurveyProgress,
      proofOfOwnership: setProofOfOwnershipProgress,
      powerOfAttorney: setPowerOfAttorneyProgress,
      other: setOtherDocProgress,
    };

    setterMap[type](newDoc);
    progressSetterMap[type](0);

    // Upload immediately
    uploadFile({
      file,
      folder: "property",
      label: `property_${type}`,
      onProgress: (percent) => progressSetterMap[type](percent),
    }).then((result) => {
      setterMap[type]((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          isUploading: false,
          fileId: result.success ? result.data.id : undefined,
          uploadError: result.success ? undefined : result.error,
        };
      });

      if (!result.success) {
        showToast(result.error || `Failed to upload ${file.name}`, "error");
      }
    });
  };

  const removeDocumentType = async (
    type: "landSurvey" | "proofOfOwnership" | "powerOfAttorney" | "other",
  ) => {
    const getterMap = {
      landSurvey: () => landSurveyDoc,
      proofOfOwnership: () => proofOfOwnershipDoc,
      powerOfAttorney: () => powerOfAttorneyDoc,
      other: () => otherDoc,
    };
    const setterMap = {
      landSurvey: setLandSurveyDoc,
      proofOfOwnership: setProofOfOwnershipDoc,
      powerOfAttorney: setPowerOfAttorneyDoc,
      other: setOtherDoc,
    };

    const doc = getterMap[type]();

    // If document has been uploaded, delete it from server
    if (doc?.fileId) {
      const deleteResult = await deleteFile(doc.fileId);
      if (!deleteResult.success) {
        showToast(
          deleteResult.error || "Failed to delete document from server",
          "error",
        );
        return;
      }
    }

    // Remove from local state
    setterMap[type](null);
    const progressSetterMap = {
      landSurvey: setLandSurveyProgress,
      proofOfOwnership: setProofOfOwnershipProgress,
      powerOfAttorney: setPowerOfAttorneyProgress,
      other: setOtherDocProgress,
    };
    progressSetterMap[type](0);
  };

  const formatFileSize = (sizeKB: string) => {
    const size = parseFloat(sizeKB);
    if (size >= 1024) {
      return `${(size / 1024).toFixed(2)} MB`;
    }
    return `${sizeKB} KB`;
  };

  const handleNext = async () => {
    if (currentStep === 3) {
      await handleCreateProperty();
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateProperty = async () => {
    if (user?.role === "landlord" && !isLandlordVerified) {
      const message =
        landlordVerificationStatus === "REJECTED"
          ? "Your landlord verification was rejected. Reupload your documents from Settings for admin review."
          : "Your landlord account is not approved yet. Property creation is disabled until verification is approved.";
      setSubmitError(message);
      showToast(message, "error");
      return;
    }

    const landlordIdFromStorage =
      typeof window !== "undefined" ? localStorage.getItem("landlordId") : null;
    const landlordId = selectedLandlord?.id || landlordIdFromStorage;

    if (!landlordId) {
      const message = "Please select a landlord account first";
      setSubmitError(message);
      showToast(message, "error");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate form
      const isValid = await trigger();
      if (!isValid) {
        const message = "Please fill in all required fields";
        setSubmitError(message);
        showToast(message, "error");
        setIsSubmitting(false);
        return;
      }

      // Get form values
      const formData = getValues();
      // landlordId already resolved above

      // Collect photo IDs (already uploaded)
      const photoIds: string[] = [];
      for (const photo of uploadedPhotos) {
        if (photo.fileId) {
          photoIds.push(photo.fileId);
        } else if (photo.uploadError) {
          const message = `Photo "${photo.file.name}" failed to upload: ${photo.uploadError}`;
          setSubmitError(message);
          showToast(message, "error");
          setIsSubmitting(false);
          return;
        } else if (photo.isUploading) {
          const message = "Please wait for all photos to finish uploading";
          setSubmitError(message);
          showToast(message, "error");
          setIsSubmitting(false);
          return;
        }
      }

      // Collect document IDs (already uploaded) from individual document types
      const documentIds: string[] = [];

      // Check Land Survey Document
      if (!landSurveyDoc) {
        setSubmitError("Land Survey Document is required");
        showToast("Land Survey Document is required", "error");
        setIsSubmitting(false);
        return;
      }
      if (landSurveyDoc.uploadError) {
        setSubmitError(
          `Land Survey Document failed to upload: ${landSurveyDoc.uploadError}`,
        );
        showToast(
          `Land Survey Document failed to upload: ${landSurveyDoc.uploadError}`,
          "error",
        );
        setIsSubmitting(false);
        return;
      }
      if (landSurveyDoc.isUploading) {
        setSubmitError(
          "Please wait for Land Survey Document to finish uploading",
        );
        showToast(
          "Please wait for Land Survey Document to finish uploading",
          "error",
        );
        setIsSubmitting(false);
        return;
      }
      if (landSurveyDoc.fileId) {
        documentIds.push(landSurveyDoc.fileId);
      }

      // Check Proof of Ownership
      if (!proofOfOwnershipDoc) {
        setSubmitError("Proof of Ownership is required");
        showToast("Proof of Ownership is required", "error");
        setIsSubmitting(false);
        return;
      }
      if (proofOfOwnershipDoc.uploadError) {
        setSubmitError(
          `Proof of Ownership failed to upload: ${proofOfOwnershipDoc.uploadError}`,
        );
        showToast(
          `Proof of Ownership failed to upload: ${proofOfOwnershipDoc.uploadError}`,
          "error",
        );
        setIsSubmitting(false);
        return;
      }
      if (proofOfOwnershipDoc.isUploading) {
        setSubmitError(
          "Please wait for Proof of Ownership to finish uploading",
        );
        showToast(
          "Please wait for Proof of Ownership to finish uploading",
          "error",
        );
        setIsSubmitting(false);
        return;
      }
      if (proofOfOwnershipDoc.fileId) {
        documentIds.push(proofOfOwnershipDoc.fileId);
      }

      // Check Power of Attorney
      if (!powerOfAttorneyDoc) {
        setSubmitError("Power of Attorney is required");
        showToast("Power of Attorney is required", "error");
        setIsSubmitting(false);
        return;
      }
      if (powerOfAttorneyDoc.uploadError) {
        setSubmitError(
          `Power of Attorney failed to upload: ${powerOfAttorneyDoc.uploadError}`,
        );
        showToast(
          `Power of Attorney failed to upload: ${powerOfAttorneyDoc.uploadError}`,
          "error",
        );
        setIsSubmitting(false);
        return;
      }
      if (powerOfAttorneyDoc.isUploading) {
        setSubmitError("Please wait for Power of Attorney to finish uploading");
        showToast(
          "Please wait for Power of Attorney to finish uploading",
          "error",
        );
        setIsSubmitting(false);
        return;
      }
      if (powerOfAttorneyDoc.fileId) {
        documentIds.push(powerOfAttorneyDoc.fileId);
      }

      // Check Other Document (optional)
      if (otherDoc) {
        if (otherDoc.uploadError) {
          setSubmitError(
            `Other Document failed to upload: ${otherDoc.uploadError}`,
          );
          showToast(
            `Other Document failed to upload: ${otherDoc.uploadError}`,
            "error",
          );
          setIsSubmitting(false);
          return;
        }
        if (otherDoc.isUploading) {
          setSubmitError("Please wait for Other Document to finish uploading");
          showToast(
            "Please wait for Other Document to finish uploading",
            "error",
          );
          setIsSubmitting(false);
          return;
        }
        if (otherDoc.fileId) {
          documentIds.push(otherDoc.fileId);
        }
      }

      // Map form data to API format
      const propertyData: CreatePropertyRequestDTO = {
        landlordId,
        name: formData.propertyName,
        yearBuilt: formData.yearBuilt || undefined,
        numberOfUnits: Math.max(1, units.length), // At least 1 unit (will be updated when units are added)
        description: formData.description || undefined,
        parkingSpace: formData.parkingSpace === "yes",
        photoIds: photoIds.length > 0 ? photoIds : undefined,
        documentIds: documentIds.length > 0 ? documentIds : undefined,
        address: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        amenities: selectedAmenities,
      };

      console.log("Create property payload:", propertyData);

      const result = await createProperty(propertyData);

      if (result.success) {
        setCreatedPropertyId(result.data.id);
        setCreatedPropertyName(formData.propertyName);
        if (typeof window !== "undefined") {
          localStorage.setItem("lastCreatedPropertyId", result.data.id);
        }
        setCurrentStep(4);
        showToast("Property created successfully. Add units now.", "success");
      } else {
        const message = result.error || "Failed to create property";
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
  };

  const handleFinish = async () => {
    if (!createdPropertyId) {
      setSubmitError("Please create the property before finishing.");
      return;
    }
    await router.push(`/dashboard/properties/${createdPropertyId}`);
  };

  const onSubmit = handleSubmit(async (data) => {
    console.log("Basic details:", { ...data, amenities: selectedAmenities });
    setCurrentStep(2);
  });

  const handleNextStep1 = async () => {
    const isValid = await trigger();
    if (isValid) {
      const formData = getValues();
      console.log("Basic details:", {
        ...formData,
        amenities: selectedAmenities,
      });
      setCurrentStep(2);
    }
  };

  const handleUnitAdded = React.useCallback(
    (unitData: AddUnitFormValues & { amenities?: string[] }) => {
      const beds = parseInt(String(unitData.bedrooms ?? ""), 10);
      const rentAmount = Number(
        String(unitData.monthlyRent ?? "").replace(/[^0-9.]/g, ""),
      );
      const typeLabel =
        !Number.isFinite(beds) || beds < 0
          ? "2BR Apt"
          : beds === 0
            ? "Studio Apt"
            : `${beds}BR Apt`;
      // Generate a temporary unit ID
      const newUnit: Unit = {
        id: `temp-${Date.now()}`,
        unitId:
          unitData.unitName || `A${String(units.length + 1).padStart(3, "0")}`,
        type: typeLabel,
        amenities: unitData.amenities || [],
        rent: rentAmount > 0 ? `N${rentAmount.toLocaleString()}` : "—",
        image:
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
      };
      setUnits((prev) => [...prev, newUnit]);
    },
    [units.length],
  );

  return (
    <>
      <Head>
        <title>Dwelliva · Add New Property</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Add New Property
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Create a new Property with complete details.
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`rounded-lg px-3 sm:px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                currentStep === 1
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Back
            </button>
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNextStep1}
                className="rounded-lg bg-gray-900 px-3 sm:px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 whitespace-nowrap"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={currentStep === 4 ? handleFinish : handleNext}
                className="rounded-lg bg-gray-900 px-3 sm:px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 whitespace-nowrap"
              >
                {currentStep === 4 ? "Finish" : "Next"}
              </button>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="w-full bg-white py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 sm:gap-8">
            {steps.map((step) => {
              const isActive = step.number === currentStep;
              return (
                <div key={step.number} className="flex flex-col gap-2 flex-1">
                  <div
                    className={`transition w-full h-2 rounded-[10px] ${
                      isActive ? "bg-brand-main" : "bg-gray-300"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium whitespace-nowrap ${
                      isActive ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          {user?.role === "landlord" && !isLandlordVerified ? (
            <div
              className={`mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
                landlordVerificationStatus === "REJECTED"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                {landlordVerificationStatus === "REJECTED"
                  ? "Your landlord verification was rejected. Reupload your documents from Settings for admin review before creating properties."
                  : "Your landlord account is not approved yet. Property creation is disabled until verification is approved."}
              </p>
            </div>
          ) : null}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form
                  id="property-form"
                  onSubmit={onSubmit}
                  className="space-y-8"
                >
                  {/* Property Details */}
                  <div>
                    <h3
                      className="mb-4 text-sm font-semibold uppercase"
                      style={{ color: "#99A1AF" }}
                    >
                      Property Details
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Property Name
                        </label>
                        <input
                          type="text"
                          placeholder="Placeholder"
                          {...register("propertyName")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.propertyName && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.propertyName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Year Built
                        </label>
                        <select
                          {...register("yearBuilt")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        >
                          <option value="">Select Year</option>
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        {errors.yearBuilt && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.yearBuilt.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Parking Space
                        </label>
                        <select
                          {...register("parkingSpace")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        >
                          <option value="">Placeholder</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                        {errors.parkingSpace && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.parkingSpace.message}
                          </p>
                        )}
                      </div>
                      <div className="sm:col-span-3">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          placeholder="Enter property description..."
                          rows={4}
                          {...register("description")}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Property Amenities */}
                  <div>
                    <h3
                      className="mb-4 text-sm font-semibold uppercase"
                      style={{ color: "#99A1AF" }}
                    >
                      Property Amenities
                    </h3>
                    {amenitiesLoading ? (
                      <div className="text-sm text-gray-500">
                        Loading amenities…
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {apiAmenities.map((amenity) => {
                          const isSelected = selectedAmenities.includes(
                            amenity.name,
                          );
                          const Icon = getAmenityIcon(amenity.name);
                          return (
                            <button
                              key={amenity.id}
                              type="button"
                              onClick={() => toggleAmenity(amenity.name)}
                              className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition ${
                                isSelected
                                  ? "text-gray-700 border border-gray-200"
                                  : "bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-50"
                              }`}
                              style={
                                isSelected ? { backgroundColor: "#EFF6FF" } : {}
                              }
                            >
                              <Icon className="h-4 w-4" />
                              <span>{amenity.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <h3
                      className="mb-4 text-sm font-semibold uppercase"
                      style={{ color: "#99A1AF" }}
                    >
                      Location
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Address
                        </label>
                        <input
                          type="text"
                          placeholder="Street address"
                          {...register("address")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.address && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.address.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <select
                          {...register("state", {
                            onChange: () => {
                              // Clear city when state changes
                              setValue("city", "");
                            },
                          })}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        >
                          <option value="">Select State</option>
                          {nigerianStates.map((state) => (
                            <option key={state.isoCode} value={state.isoCode}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                        {errors.state && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.state.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <select
                          {...register("city")}
                          disabled={!selectedState}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                        >
                          <option value="">
                            {selectedState
                              ? "Select City"
                              : "Select State First"}
                          </option>
                          {citiesForState.map((city) => (
                            <option key={city.name} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                        {errors.city && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.city.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          placeholder="Placeholder"
                          {...register("postalCode")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.postalCode && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.postalCode.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3
                    className="mb-2 text-sm font-semibold uppercase"
                    style={{ color: "#99A1AF" }}
                  >
                    Property Photos
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Upload property images
                  </p>

                  {uploadedPhotos.length > 0 && (
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                        >
                          <Image
                            src={photo.preview}
                            alt={`Property photo ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {photo.isUploading &&
                            photoUploadProgress[index] !== undefined && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white text-xs">
                                <span>Uploading...</span>
                                <div className="mt-2 h-1.5 w-24 rounded-full bg-white/30">
                                  <div
                                    className="h-1.5 rounded-full bg-white"
                                    style={{
                                      width: `${photoUploadProgress[index]}%`,
                                    }}
                                  />
                                </div>
                                <span className="mt-1">
                                  {photoUploadProgress[index]}%
                                </span>
                              </div>
                            )}
                          {photo.uploadError && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 text-white text-xs p-2">
                              <span className="font-semibold">
                                Upload Failed
                              </span>
                              <span className="mt-1 text-center text-[10px]">
                                {photo.uploadError}
                              </span>
                            </div>
                          )}
                          {photo.fileId &&
                            !photo.isUploading &&
                            !photo.uploadError && (
                              <div className="absolute left-2 top-2 rounded-full bg-green-500 p-1 text-white">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-400 hover:bg-gray-100">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Upload className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload images
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG up to 10MB + Multiple images allowed
                    </p>
                    {uploadedPhotos.length > 0 && (
                      <p className="mt-2 text-sm font-medium text-brand-green">
                        {uploadedPhotos.length} images uploaded
                      </p>
                    )}
                  </label>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3
                    className="mb-2 text-sm font-semibold uppercase"
                    style={{ color: "#99A1AF" }}
                  >
                    Property Documents
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Upload important property documents (deed, registration,
                    permits, etc.)
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Land Survey Document */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <h4 className="mb-1 text-sm font-medium text-gray-900">
                        Land Survey Document
                      </h4>
                      <p className="mb-3 text-xs text-gray-500">
                        Property map, title deed, or official record
                      </p>
                      {landSurveyDoc ? (
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="flex-1 truncate text-sm text-gray-900">
                            {landSurveyDoc.name}
                          </span>
                          {landSurveyDoc.isUploading && (
                            <div className="ml-2 flex items-center gap-2 text-xs text-gray-500">
                              <div className="h-1.5 w-20 rounded-full bg-gray-200">
                                <div
                                  className="h-1.5 rounded-full bg-brand-main"
                                  style={{ width: `${landSurveyProgress}%` }}
                                />
                              </div>
                              <span>{landSurveyProgress}%</span>
                            </div>
                          )}
                          {landSurveyDoc.fileId &&
                            !landSurveyDoc.isUploading &&
                            !landSurveyDoc.uploadError && (
                              <span className="ml-2 text-xs text-green-600">
                                Uploaded
                              </span>
                            )}
                          {landSurveyDoc.uploadError && (
                            <span className="ml-2 text-xs text-red-600">
                              Failed
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDocumentType("landSurvey")}
                            className="ml-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                          <Upload className="h-4 w-4" />
                          Choose File
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentTypeUpload(file, "landSurvey");
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Proof of Ownership */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <h4 className="mb-1 text-sm font-medium text-gray-900">
                        Proof of Ownership
                      </h4>
                      <p className="mb-3 text-xs text-gray-500">
                        Document, receipt of purchase, or transfer agreement
                      </p>
                      {proofOfOwnershipDoc ? (
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="flex-1 truncate text-sm text-gray-900">
                            {proofOfOwnershipDoc.name}
                          </span>
                          {proofOfOwnershipDoc.isUploading && (
                            <div className="ml-2 flex items-center gap-2 text-xs text-gray-500">
                              <div className="h-1.5 w-20 rounded-full bg-gray-200">
                                <div
                                  className="h-1.5 rounded-full bg-brand-main"
                                  style={{
                                    width: `${proofOfOwnershipProgress}%`,
                                  }}
                                />
                              </div>
                              <span>{proofOfOwnershipProgress}%</span>
                            </div>
                          )}
                          {proofOfOwnershipDoc.fileId &&
                            !proofOfOwnershipDoc.isUploading &&
                            !proofOfOwnershipDoc.uploadError && (
                              <span className="ml-2 text-xs text-green-600">
                                Uploaded
                              </span>
                            )}
                          {proofOfOwnershipDoc.uploadError && (
                            <span className="ml-2 text-xs text-red-600">
                              Failed
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              removeDocumentType("proofOfOwnership")
                            }
                            className="ml-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                          <Upload className="h-4 w-4" />
                          Choose File
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentTypeUpload(
                                  file,
                                  "proofOfOwnership",
                                );
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Power of Attorney */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <h4 className="mb-1 text-sm font-medium text-gray-900">
                        Power of attorney
                      </h4>
                      <p className="mb-3 text-xs text-gray-500">
                        Property map, title deed, or official record
                      </p>
                      {powerOfAttorneyDoc ? (
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="flex-1 truncate text-sm text-gray-900">
                            {powerOfAttorneyDoc.name}
                          </span>
                          {powerOfAttorneyDoc.isUploading && (
                            <div className="ml-2 flex items-center gap-2 text-xs text-gray-500">
                              <div className="h-1.5 w-20 rounded-full bg-gray-200">
                                <div
                                  className="h-1.5 rounded-full bg-brand-main"
                                  style={{
                                    width: `${powerOfAttorneyProgress}%`,
                                  }}
                                />
                              </div>
                              <span>{powerOfAttorneyProgress}%</span>
                            </div>
                          )}
                          {powerOfAttorneyDoc.fileId &&
                            !powerOfAttorneyDoc.isUploading &&
                            !powerOfAttorneyDoc.uploadError && (
                              <span className="ml-2 text-xs text-green-600">
                                Uploaded
                              </span>
                            )}
                          {powerOfAttorneyDoc.uploadError && (
                            <span className="ml-2 text-xs text-red-600">
                              Failed
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              removeDocumentType("powerOfAttorney")
                            }
                            className="ml-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                          <Upload className="h-4 w-4" />
                          Choose File
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentTypeUpload(
                                  file,
                                  "powerOfAttorney",
                                );
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Other Document */}
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <h4 className="mb-1 text-sm font-medium text-gray-900">
                        Other Document
                      </h4>
                      <p className="mb-3 text-xs text-gray-500">
                        Document, receipt of purchase, or transfer agreement
                        (Optional)
                      </p>
                      {otherDoc ? (
                        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <span className="flex-1 truncate text-sm text-gray-900">
                            {otherDoc.name}
                          </span>
                          {otherDoc.isUploading && (
                            <div className="ml-2 flex items-center gap-2 text-xs text-gray-500">
                              <div className="h-1.5 w-20 rounded-full bg-gray-200">
                                <div
                                  className="h-1.5 rounded-full bg-brand-main"
                                  style={{ width: `${otherDocProgress}%` }}
                                />
                              </div>
                              <span>{otherDocProgress}%</span>
                            </div>
                          )}
                          {otherDoc.fileId &&
                            !otherDoc.isUploading &&
                            !otherDoc.uploadError && (
                              <span className="ml-2 text-xs text-green-600">
                                Uploaded
                              </span>
                            )}
                          {otherDoc.uploadError && (
                            <span className="ml-2 text-xs text-red-600">
                              Failed
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDocumentType("other")}
                            className="ml-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                          <Upload className="h-4 w-4" />
                          Choose File
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentTypeUpload(file, "other");
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="mb-2 text-sm font-semibold uppercase"
                      style={{ color: "#99A1AF" }}
                    >
                      Units
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add units to this property
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddUnitModalOpen(true)}
                    disabled={!createdPropertyId}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-main/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    + Add Unit
                  </button>
                </div>

                {units.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                      <Home className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      No units added yet
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Click &quot;Add Unit&quot; to create your first unit
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            S/N
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Image
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Unit ID
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Amenities
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Rent
                          </th>
                          <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            View Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {units.map((unit, index) => (
                          <tr key={unit.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {String(index + 1).padStart(2, "0")}
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <div className="relative h-12 w-16 overflow-hidden rounded border border-gray-200 flex-shrink-0">
                                <Image
                                  src={unit.image}
                                  alt={unit.unitId}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                              {unit.unitId}
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                              {unit.type}
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                              <div className="flex flex-wrap gap-1">
                                {unit.amenities
                                  .slice(0, 2)
                                  .map((amenity, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                                    >
                                      {amenity}
                                    </span>
                                  ))}
                                {unit.amenities.length > 2 && (
                                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                    +{unit.amenities.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {unit.rent}
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-sm whitespace-nowrap">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-brand-main hover:text-brand-main/80 transition"
                              >
                                View Details
                                <ExternalLink className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              currentStep === 1
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <p className="text-sm font-medium text-gray-700">
            Step {currentStep} of 4
          </p>
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={handleNextStep1}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={currentStep === 4 ? handleFinish : handleNext}
              disabled={isSubmitting && currentStep === 3}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {isSubmitting && currentStep === 3
                ? "Creating property..."
                : currentStep === 4
                  ? "Finish"
                  : "Next"}
            </button>
          )}
        </div>
      </section>

      {/* Add Unit Modal */}
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        propertyId={createdPropertyId || "temp-property-id"}
        propertyLabel={createdPropertyName}
        onSuccess={handleUnitAdded}
      />
    </>
  );
};

AddPropertyPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default AddPropertyPage;
