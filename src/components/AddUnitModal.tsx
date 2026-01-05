import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Check, Upload } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addUnitSchema = z.object({
  property: z.string().min(1, "Property is required"),
  unitName: z.string().min(1, "Unit name is required"),
  unitType: z.string().min(1, "Unit type is required"),
  bedrooms: z.string().min(1, "Bedrooms is required"),
  bathrooms: z.string().min(1, "Bathrooms is required"),
  size: z.string().min(1, "Size is required"),
  floor: z.string().min(1, "Floor is required"),
  monthlyRent: z.string().min(1, "Monthly rent is required"),
  cautionFee: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

export type AddUnitFormValues = z.infer<typeof addUnitSchema>;

export type AddUnitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onSuccess?: (data: AddUnitFormValues & { amenities: string[] }) => void;
};

const availableAmenities = [
  "AC",
  "Balcony",
  "Fan",
  "Kitchenette",
  "Bathtub",
  "Dishwasher",
  "Microwave",
  "Refrigerator",
  "Washing Machine",
  "Garden Access",
  "Smart Lock",
  "CCTV",
  "Water Heater",
  "Ensuite",
  "Wardrobe",
];

export const AddUnitModal = ({
  isOpen,
  onClose,
  propertyId,
  onSuccess,
}: AddUnitModalProps) => {
  const [selectedAmenities, setSelectedAmenities] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddUnitFormValues>({
    resolver: zodResolver(addUnitSchema),
    defaultValues: {
      property: propertyId,
      unitType: "2BR Apt",
    },
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const onSubmit = handleSubmit(async (data) => {
    const unitData = { ...data, amenities: selectedAmenities };
    
    if (onSuccess) {
      onSuccess(unitData);
    } else {
      // TODO: Submit unit data
      console.log("Add unit:", unitData);
    }
    
    reset();
    setSelectedAmenities([]);
    onClose();
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
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
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
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Check className="h-4 w-4" />
              Save
            </button>
          </div>

          {/* Form */}
          <form id="add-unit-form" onSubmit={onSubmit} className="space-y-6">
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
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  >
                    <option value="">Placeholder</option>
                    <option value="1">Harmony Court - 3BR Duplex</option>
                  </select>
                  {errors.property && (
                    <p className="mt-1 text-xs text-red-600">{errors.property.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Unit Name
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("unitName")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.unitName && (
                    <p className="mt-1 text-xs text-red-600">{errors.unitName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Unit Type
                  </label>
                  <select
                    {...register("unitType")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  >
                    <option value="2BR Apt">2BR Apt</option>
                    <option value="1BR Apt">1BR Apt</option>
                    <option value="Studio Apt">Studio Apt</option>
                    <option value="Self Contain">Self Contain</option>
                  </select>
                  {errors.unitType && (
                    <p className="mt-1 text-xs text-red-600">{errors.unitType.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    placeholder="Placeholder"
                    {...register("bedrooms")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.bedrooms && (
                    <p className="mt-1 text-xs text-red-600">{errors.bedrooms.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Floor
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("floor")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.floor && (
                    <p className="mt-1 text-xs text-red-600">{errors.floor.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Size
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("size")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.size && (
                    <p className="mt-1 text-xs text-red-600">{errors.size.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    placeholder="Placeholder"
                    {...register("bathrooms")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.bathrooms && (
                    <p className="mt-1 text-xs text-red-600">{errors.bathrooms.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Monthly Rent
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("monthlyRent")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.monthlyRent && (
                    <p className="mt-1 text-xs text-red-600">{errors.monthlyRent.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Caution Fee
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
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
              <div className="flex flex-wrap gap-2">
                {availableAmenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "text-gray-700 border border-gray-200"
                          : "bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-50"
                      }`}
                      style={isSelected ? { backgroundColor: '#EFF6FF' } : {}}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unit Photo */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase text-gray-700">
                Unit Photo
              </h3>
              <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Click to upload image</p>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG up to 10MB • Multiple images allowed
                  </p>
                </div>
              </div>
            </div>
          </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

