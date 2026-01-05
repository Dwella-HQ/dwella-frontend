import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Filter, Grid3x3, List, Plus, ArrowUpDown, Check, Users } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

import { DashboardLayout } from "@/components/DashboardLayout";
import { mockProperties } from "@/data/mockLandlordData";
import type { Property } from "@/data/mockLandlordData";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyTable } from "@/components/PropertyTable";

import type { NextPageWithLayout } from "../../_app";

type ViewMode = "grid" | "list";
type FilterStatus = "all" | "active" | "inactive" | "pending" | "occupied" | "commercial" | "residential";

const PropertiesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [activeFilter, setActiveFilter] = React.useState<FilterStatus>("all");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<string>("name-asc");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [occupancyFilter, setOccupancyFilter] = React.useState<string>("all");

  const filteredProperties = React.useMemo(() => {
    let filtered = [...mockProperties];

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.status === "active");
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((p) => p.status === "pending");
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => p.status === "inactive");
    }

    // Apply occupancy filter
    if (occupancyFilter === "high") {
      filtered = filtered.filter((p) => p.occupancy >= 90);
    } else if (occupancyFilter === "medium") {
      filtered = filtered.filter((p) => p.occupancy >= 50 && p.occupancy < 90);
    } else if (occupancyFilter === "low") {
      filtered = filtered.filter((p) => p.occupancy < 50);
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      } else if (sortBy === "rent-high") {
        return b.monthlyRent - a.monthlyRent;
      } else if (sortBy === "rent-low") {
        return a.monthlyRent - b.monthlyRent;
      } else if (sortBy === "occupancy-high") {
        return b.occupancy - a.occupancy;
      } else if (sortBy === "occupancy-low") {
        return a.occupancy - b.occupancy;
      } else if (sortBy === "units") {
        return b.units - a.units;
      }
      return 0;
    });

    return filtered;
  }, [statusFilter, occupancyFilter, sortBy]);

  const handleClearFilters = React.useCallback(() => {
    setStatusFilter("all");
    setOccupancyFilter("all");
    setSortBy("name-asc");
    setActiveFilter("all");
  }, []);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (occupancyFilter !== "all") count++;
    if (sortBy !== "name-asc") count++;
    return count;
  }, [statusFilter, occupancyFilter, sortBy]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Properties</title>
      </Head>

      <section className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Properties</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your real estate portfolio
            </p>
          </div>

          {/* View Controls and Add Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Filter Button */}
            <Popover.Root open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                    isFilterOpen || activeFiltersCount > 0
                      ? "border-brand-main bg-brand-main text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="h-5 w-5" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
              <Popover.Content
                sideOffset={8}
                align="end"
                className="w-80 rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none z-40"
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">
                      Filters & Sorting
                    </h3>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs font-medium text-brand-main hover:text-brand-main/80 transition"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Sort By */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-gray-600" />
                      <label className="text-xs font-semibold uppercase text-gray-700">
                        Sort By
                      </label>
                    </div>
                    <div className="space-y-1">
                      {[
                        { value: "name-asc", label: "Name (A-Z)" },
                        { value: "rent-high", label: "Rent (High to Low)" },
                        { value: "rent-low", label: "Rent (Low to High)" },
                        { value: "occupancy-high", label: "Occupancy (High to Low)" },
                        { value: "occupancy-low", label: "Occupancy (Low to High)" },
                        { value: "units", label: "Number of Units" },
                      ].map((option) => {
                        const isSelected = sortBy === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`flex items-center justify-between cursor-pointer rounded-md px-3 py-2 transition ${
                              isSelected
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-sm text-gray-700">{option.label}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-brand-main" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Check className="h-4 w-4 text-gray-600" />
                      <label className="text-xs font-semibold uppercase text-gray-700">
                        Status
                      </label>
                    </div>
                    <div className="space-y-1">
                      {[
                        { value: "all", label: "All Properties" },
                        { value: "active", label: "Active" },
                        { value: "pending", label: "Pending Verification" },
                      ].map((option) => {
                        const isSelected = statusFilter === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`flex items-center justify-between cursor-pointer rounded-md px-3 py-2 transition ${
                              isSelected
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-sm text-gray-700">{option.label}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-brand-main" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Occupancy Rate */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <label className="text-xs font-semibold uppercase text-gray-700">
                        Occupancy Rate
                      </label>
                    </div>
                    <div className="space-y-1">
                      {[
                        { value: "all", label: "All Levels" },
                        { value: "high", label: "High (90%+)" },
                        { value: "medium", label: "Medium (50-89%)" },
                        { value: "low", label: "Low (<50%)" },
                      ].map((option) => {
                        const isSelected = occupancyFilter === option.value;
                        return (
                          <label
                            key={option.value}
                            className={`flex items-center justify-between cursor-pointer rounded-md px-3 py-2 transition ${
                              isSelected
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-sm text-gray-700">{option.label}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-brand-main" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing <span className="font-semibold">{filteredProperties.length}</span> of{" "}
                      <span className="font-semibold">{mockProperties.length}</span> properties
                    </p>
                  </div>
                </div>
              </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-gray-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded transition ${
                  viewMode === "grid"
                    ? "bg-brand-main text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex h-8 w-8 items-center justify-center rounded transition ${
                  viewMode === "list"
                    ? "bg-brand-main text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Add Property Button */}
            <button
              type="button"
              onClick={() => router.push("/dashboard/properties/new")}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-gray-900 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-gray-800 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Add Property</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "pending", label: "Pending" },
            { value: "occupied", label: "Occupied > 90%" },
            { value: "commercial", label: "Commercial" },
            { value: "residential", label: "Residential" },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setActiveFilter(filter.value as FilterStatus);
                if (filter.value === "all") {
                  setStatusFilter("all");
                } else if (filter.value === "active") {
                  setStatusFilter("active");
                } else if (filter.value === "pending") {
                  setStatusFilter("pending");
                } else if (filter.value === "occupied") {
                  setOccupancyFilter("high");
                }
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeFilter === filter.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        {activeFiltersCount > 0 && (
          <div className="text-sm text-gray-600">
            Showing {filteredProperties.length} of {mockProperties.length} properties with active filters
          </div>
        )}

        {/* Properties Display */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={index}
                onClick={() => router.push(`/dashboard/properties/${property.id}`)}
              />
            ))}
          </div>
        ) : (
          <PropertyTable
            properties={filteredProperties}
            onPropertyClick={(property) =>
              router.push(`/dashboard/properties/${property.id}`)
            }
          />
        )}
      </section>
    </>
  );
};

PropertiesPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default PropertiesPage;

