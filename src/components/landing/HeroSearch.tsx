import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Home,
  Wallet,
  Sparkles,
  Search,
} from "lucide-react";
import { getAmenities } from "@/api/amenities";

export type HeroSearchValues = {
  destination: string;
  type: string;
  budget: string;
  amenity: string;
};

type HeroSearchProps = {
  values?: HeroSearchValues;
  onChange?: (values: HeroSearchValues) => void;
  onSearch?: (values: HeroSearchValues) => void;
  showBreadcrumb?: boolean;
  title?: React.ReactNode;
  subtitle?: string;
  id?: string;
};

const defaultValues: HeroSearchValues = {
  destination: "",
  type: "",
  budget: "",
  amenity: "",
};

export const HeroSearch = ({
  values,
  onChange,
  onSearch,
  showBreadcrumb = true,
  title,
  subtitle = "Discover verified properties across Nigeria.",
  id,
}: HeroSearchProps) => {
  const [internal, setInternal] = React.useState<HeroSearchValues>(defaultValues);
  const [amenities, setAmenities] = React.useState<
    { id: string; name: string }[]
  >([]);
  const current = values ?? internal;

  React.useEffect(() => {
    getAmenities({ skipAuth: true }).then((result) => {
      if (result.success) setAmenities(result.data);
    });
  }, []);

  const update = React.useCallback(
    (patch: Partial<HeroSearchValues>) => {
      const next = { ...current, ...patch };
      if (onChange) onChange(next);
      else setInternal(next);
    },
    [current, onChange],
  );

  return (
    <section
      id={id}
      className="relative overflow-hidden bg-[var(--brand-main)] pb-14 pt-6 md:pb-16 md:pt-8"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35) 0, transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2) 0, transparent 35%), linear-gradient(135deg, rgba(4,27,58,0.25), transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {showBreadcrumb ? (
          <nav className="mb-6 text-sm text-white/80">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">Properties</span>
          </nav>
        ) : null}

        <div className="text-center text-white">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {title ?? "Find Your Perfect Home"}
          </h1>
          <p className="mt-2 text-base opacity-90 md:text-lg">{subtitle}</p>
        </div>

        <div className="mx-auto mt-8 max-w-5xl">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white p-3 shadow-xl sm:flex-row sm:items-center sm:gap-2 sm:p-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                type="text"
                value={current.destination}
                onChange={(e) => update({ destination: e.target.value })}
                placeholder="Search destinations (Lagos, Abuja, Uyo...)"
                className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 sm:min-w-[130px]">
              <Home className="h-4 w-4 shrink-0 text-gray-400" />
              <select
                value={current.type}
                onChange={(e) => update({ type: e.target.value })}
                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
              >
                <option value="">Type</option>
                <option value="Self Contain">Self Contain</option>
                <option value="2 Bedroom Flat">2 Bedroom Flat</option>
                <option value="3 Bedroom Flat">3 Bedroom Flat</option>
                <option value="Duplex">Duplex</option>
                <option value="Serviced Apartment">Serviced Apartment</option>
              </select>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 sm:min-w-[130px]">
              <Wallet className="h-4 w-4 shrink-0 text-gray-400" />
              <select
                value={current.budget}
                onChange={(e) => update({ budget: e.target.value })}
                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
              >
                <option value="">Budget</option>
                <option value="0-200000">Under ₦200k</option>
                <option value="200000-500000">₦200k – ₦500k</option>
                <option value="500000-1000000">₦500k – ₦1M</option>
                <option value="1000000+">₦1M+</option>
              </select>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 sm:min-w-[140px]">
              <Sparkles className="h-4 w-4 shrink-0 text-gray-400" />
              <select
                value={current.amenity}
                onChange={(e) => update({ amenity: e.target.value })}
                className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
              >
                <option value="">Amenity</option>
                {amenities.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => onSearch?.(current)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
