export type AdminMetric = {
  label: string;
  value: string;
  delta: string;
};

export const adminMetrics: AdminMetric[] = [
  { label: "Total Users", value: "10,000", delta: "8.5% Up from last week" },
  { label: "Tenants", value: "7,000", delta: "8.5% Up from last week" },
  { label: "Landlords", value: "1,500", delta: "8.5% Up from last week" },
  {
    label: "Property Managers",
    value: "1,500",
    delta: "8.5% Up from last week",
  },
  {
    label: "Total Transactions Volume",
    value: "N 2,450,000",
    delta: "8.5% Up from last week",
  },
  {
    label: "Total Properties",
    value: "1,372",
    delta: "8.5% Up from last week",
  },
  {
    label: "Rented Properties",
    value: "7,000",
    delta: "8.5% Up from last week",
  },
  {
    label: "Pending Verification",
    value: "5,000",
    delta: "8.5% Up from last week",
  },
];

export type AdminPropertyRow = {
  id: string;
  name: string;
  type: string;
  address: string;
  units: number;
  monthlyRent: string;
  landlordName: string;
  listingDate: string;
  status: "Occupied" | "Vacant";
};

export const adminPropertyRows: AdminPropertyRow[] = Array.from(
  { length: 13 },
  (_, index) => ({
    id: String(index + 1),
    name: "Harmony Court...",
    type: "3 Bedroom",
    address: "12 Iroko Street,...",
    units: 11,
    monthlyRent: "NGN 439,000",
    landlordName: "Raman Ismail",
    listingDate: "7/7/2024",
    status: index % 4 === 0 ? "Occupied" : "Vacant",
  }),
);

export type AdminLandlordRow = {
  id: string;
  name: string;
  phone: string;
  properties: number;
  units: number;
  monthlyRevenue: string;
  totalRevenue: string;
  status: "Active" | "Pending" | "Suspended";
};

export const adminLandlords: AdminLandlordRow[] = Array.from(
  { length: 13 },
  (_, i) => ({
    id: String(i + 1),
    name: "Raman Ismail",
    phone: "+234 812 345 6789",
    properties: 8,
    units: 74,
    monthlyRevenue: "NGN 120,000",
    totalRevenue: "NGN 1,440,000",
    status: i % 7 === 0 ? "Pending" : "Active",
  }),
);

export type AdminPropertyManagerRow = {
  id: string;
  name: string;
  propertiesManaged: number;
  totalUnits: number;
  activeTenants: number;
  rentManaged: string;
  assignedLandlords: number;
  status: "Active" | "Suspended";
};

export const adminPropertyManagers: AdminPropertyManagerRow[] = Array.from(
  { length: 13 },
  (_, i) => ({
    id: String(i + 1),
    name: "Musa Ismail",
    propertiesManaged: 3,
    totalUnits: 18,
    activeTenants: 15,
    rentManaged: "NGN 420,000",
    assignedLandlords: 2,
    status: i % 8 === 0 ? "Suspended" : "Active",
  }),
);

export type AdminTenantRow = {
  id: string;
  name: string;
  phone: string;
  units: number;
  monthlyRent: string;
  leaseEnds: string;
  rentStatus: "Paid" | "Unpaid";
  dateJoined: string;
  accountStatus: "Active" | "Inactive";
};

export const adminTenantRows: AdminTenantRow[] = Array.from(
  { length: 14 },
  (_, i) => ({
    id: String(i + 1),
    name: "Ada Emmanuel",
    phone: "+234 812 345 6789",
    units: 11,
    monthlyRent: "NGN 439,000",
    leaseEnds: "7/7/2024",
    rentStatus: i === 2 ? "Unpaid" : "Paid",
    dateJoined: "7/7/2024",
    accountStatus: i === 0 || i === 1 || i === 13 ? "Inactive" : "Active",
  }),
);
