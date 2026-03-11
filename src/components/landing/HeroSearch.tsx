import * as React from "react";
import { getAmenities } from "@/api/amenities";

export const HeroSearch = () => {
  const [amenities, setAmenities] = React.useState<
    { id: string; name: string }[]
  >([]);

  React.useEffect(() => {
    getAmenities({ skipAuth: true }).then((result) => {
      if (result.success) setAmenities(result.data);
    });
  }, []);

  return (
    <section className="relative bg-[var(--brand-main)] pb-16 pt-8 md:pb-20 md:pt-12">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Find Your Perfect Home
          </h1>
          <p className="mt-2 text-lg opacity-90">
            Discover verified properties across Nigeria
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-4xl">
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-lg sm:flex-row sm:items-center sm:gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <span className="text-gray-400">📍</span>
              <input
                type="text"
                placeholder="Search destinations (Lagos, Abuja, Uyo...)"
                className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
              />
            </div>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[var(--brand-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-main)]">
              <option value="">Type</option>
              <option value="self-contain">Self Contain</option>
              <option value="2br">2 Bedroom Flat</option>
              <option value="3br">3 Bedroom Flat</option>
              <option value="4br">4 Bedroom Flat</option>
            </select>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[var(--brand-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-main)]">
              <option value="">Budget</option>
              <option value="100-200">N100k - N200k</option>
              <option value="200-400">N200k - N400k</option>
              <option value="400-600">N400k - N600k</option>
              <option value="600+">N600k+</option>
            </select>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[var(--brand-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-main)]">
              <option value="">Amenity</option>
              {amenities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
