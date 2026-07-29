import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import type { StayListing } from "@/data/mockShortStay";

type Props = {
  property: StayListing;
  href?: string;
};

const formatNaira = (amount: number) =>
  amount > 0 ? `₦${amount.toLocaleString("en-NG")}` : "Contact for price";

export const ShortStayPropertyCard = ({ property, href }: Props) => {
  const images =
    property.images && property.images.length > 0
      ? property.images
      : [property.image];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const showAmenities = property.amenities.slice(0, 3);
  const extra = property.amenities.length - 3;
  const isShortLet = property.listingType === "short_let";
  const detailHref = href ?? `/property/${property.id}`;

  const goTo = React.useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex(((index % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
    >
      <Link href={detailHref} className="block">
        <div className="relative aspect-[4/3] w-full bg-gray-100">
          <Image
            src={images[activeIndex] || property.image}
            alt={property.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {property.status === "active" ? (
            <span className="absolute left-3 top-3 rounded-full bg-[#22C55E] px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              Active
            </span>
          ) : null}

          {isShortLet ? (
            <span className="absolute right-3 top-3 rounded-full bg-[#F5A623] px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm">
              Short-Let
            </span>
          ) : null}

          {images.length > 1 ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {images.slice(0, 4).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Show photo ${idx + 1}`}
                  onClick={(e) => goTo(idx, e)}
                  className={`h-1.5 rounded-full transition ${
                    idx === activeIndex
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/55 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-[15px] font-bold text-gray-900">
              {property.name}
            </h3>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-gray-900">
              <Star className="h-3.5 w-3.5 fill-gray-900 text-gray-900" />
              {property.rating.toFixed(1)}
            </span>
          </div>

          <p className="mt-1.5 flex items-start gap-1 text-sm text-gray-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{property.address}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {showAmenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
              >
                {amenity}
              </span>
            ))}
            {extra > 0 ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                +{extra}
              </span>
            ) : null}
          </div>

          {isShortLet && property.minNights > 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Minimum {property.minNights} night
              {property.minNights === 1 ? "" : "s"} • Maximum{" "}
              {property.maxNights} nights
            </p>
          ) : null}

          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">
              Monthly Rent
            </p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {formatNaira(property.monthlyRent)}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
