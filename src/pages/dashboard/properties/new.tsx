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
  Tv
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";

import { DashboardLayout } from "@/components/DashboardLayout";
import { AddUnitModal } from "@/components/AddUnitModal";
import type { NextPageWithLayout } from "../../_app";

// Step 1 Schema
const basicDetailsSchema = z.object({
  propertyName: z.string().min(1, "Property name is required"),
  propertyType: z.string().min(1, "Property type is required"),
  yearBuilt: z.string().min(1, "Year built is required"),
  totalUnits: z.string().min(1, "Total units is required"),
  parkingSpace: z.string().min(1, "Parking space is required"),
  description: z.string().optional(),
  defaultCurrency: z.string().min(1, "Default currency is required"),
  rent: z.string().min(1, "Rent is required"),
  securityDeposit: z.string().min(1, "Security deposit is required"),
  gracePeriod: z.string().min(1, "Grace period is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

type BasicDetailsFormValues = z.infer<typeof basicDetailsSchema>;

type PropertyAmenity = 
  | "24/7 Power"
  | "Fiber Internet"
  | "Elevator"
  | "Cable TV"
  | "Water Treatment"
  | "Generator"
  | "Swimming Pool"
  | "Security Gate"
  | "Covered Parking"
  | "Gym"
  | "CCTV"
  | "Air Conditioning"
  | "Lounge";

const availableAmenities: PropertyAmenity[] = [
  "24/7 Power",
  "Fiber Internet",
  "Elevator",
  "Cable TV",
  "Water Treatment",
  "Generator",
  "Swimming Pool",
  "Security Gate",
  "Covered Parking",
  "Gym",
  "CCTV",
  "Air Conditioning",
  "Lounge",
];

// Helper function to get amenity icon
const getAmenityIcon = (amenity: PropertyAmenity) => {
  switch (amenity) {
    case "24/7 Power":
      return Zap;
    case "Water Treatment":
      return Droplet;
    case "Security Gate":
      return Shield;
    case "Covered Parking":
      return Car;
    case "Fiber Internet":
      return Wifi;
    case "Generator":
      return Battery;
    case "Swimming Pool":
      return Waves;
    case "Gym":
      return Dumbbell;
    case "Elevator":
      return ArrowUpDown;
    case "CCTV":
      return Camera;
    case "Air Conditioning":
      return Wind;
    case "Lounge":
      return Coffee;
    case "Cable TV":
      return Tv;
    default:
      return Home;
  }
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
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedAmenities, setSelectedAmenities] = React.useState<PropertyAmenity[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = React.useState<{ file: File; preview: string }[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = React.useState<{ file: File; name: string; size: string }[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<BasicDetailsFormValues>({
    resolver: zodResolver(basicDetailsSchema),
  });

  const steps = [
    { number: 1, label: "Basic Details" },
    { number: 2, label: "Photos" },
    { number: 3, label: "Documents" },
    { number: 4, label: "Units" },
  ];

  const toggleAmenity = (amenity: PropertyAmenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhotos((prev) => [
          ...prev,
          { file, preview: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const sizeKB = (file.size / 1024).toFixed(2);
      setUploadedDocuments((prev) => [
        ...prev,
        { file, name: file.name, size: `${sizeKB} KB` },
      ]);
    });
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (sizeKB: string) => {
    const size = parseFloat(sizeKB);
    if (size >= 1024) {
      return `${(size / 1024).toFixed(2)} MB`;
    }
    return `${sizeKB} KB`;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    // TODO: Submit all form data
    console.log("Property submitted");
    router.push("/dashboard/properties");
  };

  const onSubmit = handleSubmit(async (data) => {
    console.log("Basic details:", { ...data, amenities: selectedAmenities });
    setCurrentStep(2);
  });

  const handleUnitAdded = React.useCallback((unitData: any) => {
    // Generate a temporary unit ID
    const newUnit: Unit = {
      id: `temp-${Date.now()}`,
      unitId: unitData.unitName || `A${String(units.length + 1).padStart(3, "0")}`,
      type: unitData.unitType || "2BR Apt",
      amenities: unitData.amenities || [],
      rent: `N${parseInt(unitData.monthlyRent || "250000").toLocaleString()}`,
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    };
    setUnits((prev) => [...prev, newUnit]);
  }, [units.length]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Add New Property</title>
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add New Property</h1>
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
                onClick={onSubmit}
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
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={onSubmit} className="space-y-8">
                  {/* Property Details */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
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
                          <p className="mt-1 text-xs text-red-600">{errors.propertyName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Property Type
                        </label>
                        <select
                          {...register("propertyType")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        >
                          <option value="">Placeholder</option>
                          <option value="apartment">Apartment</option>
                          <option value="house">House</option>
                          <option value="duplex">Duplex</option>
                          <option value="villa">Villa</option>
                        </select>
                        {errors.propertyType && (
                          <p className="mt-1 text-xs text-red-600">{errors.propertyType.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Year Built
                        </label>
                        <input
                          type="text"
                          placeholder="Placeholder"
                          {...register("yearBuilt")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.yearBuilt && (
                          <p className="mt-1 text-xs text-red-600">{errors.yearBuilt.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Total Units
                        </label>
                        <input
                          type="number"
                          placeholder="Placeholder"
                          {...register("totalUnits")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.totalUnits && (
                          <p className="mt-1 text-xs text-red-600">{errors.totalUnits.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Parking Space
                        </label>
                        <input
                          type="text"
                          placeholder="Placeholder"
                          {...register("parkingSpace")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.parkingSpace && (
                          <p className="mt-1 text-xs text-red-600">{errors.parkingSpace.message}</p>
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
                    <h3 className="mb-4 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                      Property Amenities
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {availableAmenities.map((amenity) => {
                        const isSelected = selectedAmenities.includes(amenity);
                        const Icon = getAmenityIcon(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition ${
                              isSelected
                                ? "text-gray-700 border border-gray-200"
                                : "bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-50"
                            }`}
                            style={isSelected ? { backgroundColor: '#EFF6FF' } : {}}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{amenity}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial Settings */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                      Financial Settings
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Default Currency
                        </label>
                        <select
                          {...register("defaultCurrency")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        >
                          <option value="">Placeholder</option>
                          <option value="NGN">NGN (₦)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                        {errors.defaultCurrency && (
                          <p className="mt-1 text-xs text-red-600">{errors.defaultCurrency.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Rent
                        </label>
                        <input
                          type="text"
                          placeholder="Placeholder"
                          {...register("rent")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.rent && (
                          <p className="mt-1 text-xs text-red-600">{errors.rent.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Security Deposit (%)
                        </label>
                        <input
                          type="text"
                          placeholder="Placeholder"
                          {...register("securityDeposit")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.securityDeposit && (
                          <p className="mt-1 text-xs text-red-600">{errors.securityDeposit.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Grace Period (Days)
                        </label>
                        <select
                          {...register("gracePeriod")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        >
                          <option value="">Placeholder</option>
                          <option value="3">3</option>
                          <option value="7">7</option>
                          <option value="14">14</option>
                          <option value="30">30</option>
                        </select>
                        {errors.gracePeriod && (
                          <p className="mt-1 text-xs text-red-600">{errors.gracePeriod.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                      Location
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Street Address
                        </label>
                        <input
                          type="text"
                          placeholder="Placeholder"
                          {...register("streetAddress")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        />
                        {errors.streetAddress && (
                          <p className="mt-1 text-xs text-red-600">{errors.streetAddress.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <select
                          {...register("city")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        >
                          <option value="">Placeholder</option>
                          <option value="lagos">Lagos</option>
                          <option value="abuja">Abuja</option>
                          <option value="port-harcourt">Port Harcourt</option>
                          <option value="kano">Kano</option>
                        </select>
                        {errors.city && (
                          <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <select
                          {...register("state")}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                        >
                          <option value="">Placeholder</option>
                          <option value="lagos">Lagos</option>
                          <option value="abuja">FCT</option>
                          <option value="rivers">Rivers</option>
                          <option value="kano">Kano</option>
                        </select>
                        {errors.state && (
                          <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>
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
                  <h3 className="mb-2 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                    Property Photos
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Upload property images
                  </p>
                  
                  {uploadedPhotos.length > 0 && (
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
                          <Image
                            src={photo.preview}
                            alt={`Property photo ${index + 1}`}
                            fill
                            className="object-cover"
                          />
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
                    <p className="text-sm text-gray-600">Click to upload images</p>
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
                  <h3 className="mb-2 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                    Property Documents
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Upload important property documents (deed, registration, permits, etc.)
                  </p>

                  {uploadedDocuments.length > 0 && (
                    <div className="mb-6 space-y-3">
                      {uploadedDocuments.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 transition"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-400 hover:bg-gray-100">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      multiple
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                    <Upload className="mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload documents</p>
                    <p className="mt-1 text-xs text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG up to 10MB Multiple files allowed
                    </p>
                    {uploadedDocuments.length > 0 && (
                      <p className="mt-2 text-sm font-medium text-brand-main">
                        {uploadedDocuments.length} documents uploaded
                      </p>
                    )}
                  </label>
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
                    <h3 className="mb-2 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                      Units
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add units to this property
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddUnitModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-main/90"
                  >
                    + Add Unit
                  </button>
                </div>

                {units.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                      <Home className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No units added yet</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Click "Add Unit" to create your first unit
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
                                {unit.amenities.slice(0, 2).map((amenity, idx) => (
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
              onClick={onSubmit}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={currentStep === 4 ? handleFinish : handleNext}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Next
            </button>
          )}
        </div>
      </section>

      {/* Add Unit Modal */}
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        propertyId="temp-property-id"
        onSuccess={handleUnitAdded}
      />
    </>
  );
};

AddPropertyPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default AddPropertyPage;

