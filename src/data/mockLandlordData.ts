// Mock data for Landlord Dashboard

export type Property = {
  id: string;
  name: string;
  address: string;
  units: number;
  occupancy: number;
  monthlyRent: number;
  nextDue: string;
  status: "active" | "inactive" | "pending";
  image: string;
  amenities: string[];
};

export type Payment = {
  id: string;
  tenantName: string;
  propertyName: string;
  unit: string;
  amount: number;
  dueDate: string;
};

export type MaintenanceRequest = {
  id: string;
  type: string;
  description: string;
  propertyName: string;
  unit: string;
  status: "new" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  timeAgo: string;
};

// Extended types for property details
export type Unit = {
  id: string;
  propertyId: string;
  unitId: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  floor: string;
  monthlyRent: number;
  cautionFee: number;
  status: "occupied" | "vacant" | "maintenance";
  rentStatus: "paid" | "overdue";
  amenities: string[];
  image: string;
  tenantId?: string;
  nextDueDate: string;
};

export type Tenant = {
  id: string;
  propertyId: string;
  unitId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  idType?: string;
  idNumber?: string;
  employerName?: string;
  leaseStart: string;
  leaseEnd: string;
  nextPayment: string;
  status: "occupied";
  avatar?: string;
};

export type PaymentHistory = {
  id: string;
  transactionId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  date: string;
  method: string;
  status: "success" | "failed";
};

export type MaintenanceRequestDetail = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  tenantName: string;
  type: string;
  subType: string;
  priority: "low" | "medium" | "high";
  reportedDate: string;
  status: "new" | "in_progress" | "resolved";
  additionalDetail?: string;
  resolvedDate?: string;
  team?: string;
};

export type PropertyDocument = {
  id: string;
  propertyId: string;
  title: string;
  type: string;
  size: string;
  uploadedDate: string;
  fileUrl: string;
};

export type DashboardStats = {
  totalProperties: number;
  pendingVerification: number;
  totalUnits: number;
  unitsUnderMaintenance: number;
  rentCollected: number;
  rentCollectedPeriod: string;
  overdueAmount: number;
  overdueCount: number;
};

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalProperties: 6,
  pendingVerification: 1,
  totalUnits: 47,
  unitsUnderMaintenance: 2,
  rentCollected: 2580000,
  rentCollectedPeriod: "This month",
  overdueAmount: 250000,
  overdueCount: 1,
};

// Mock Recent Payments
export const mockRecentPayments: Payment[] = [
  {
    id: "1",
    tenantName: "Ada Emmanuel",
    propertyName: "Harmony Court",
    unit: "A101",
    amount: 120000,
    dueDate: "05 Dec 2025",
  },
  {
    id: "2",
    tenantName: "John Musa",
    propertyName: "Harmony Court",
    unit: "B208",
    amount: 90000,
    dueDate: "04 Dec 2025",
  },
  {
    id: "3",
    tenantName: "John Musa",
    propertyName: "Harmony Court",
    unit: "B205",
    amount: 90000,
    dueDate: "04 Dec 2025",
  },
  {
    id: "4",
    tenantName: "Abel Kundo",
    propertyName: "Harmony Court",
    unit: "A103",
    amount: 120000,
    dueDate: "05 Dec 2025",
  },
  {
    id: "5",
    tenantName: "Sarah Okon",
    propertyName: "Harmony Court",
    unit: "C305",
    amount: 150000,
    dueDate: "03 Dec 2025",
  },
  {
    id: "6",
    tenantName: "John Musa",
    propertyName: "Garden View",
    unit: "B202",
    amount: 90000,
    dueDate: "04 Dec 2025",
  },
  {
    id: "7",
    tenantName: "Sarah Okon",
    propertyName: "Palm Estate",
    unit: "C305",
    amount: 150000,
    dueDate: "03 Dec 2025",
  },
];

// Mock Maintenance Requests
export const mockMaintenanceRequests: MaintenanceRequest[] = [
  {
    id: "1",
    type: "Plumbing",
    description: "Kitchen sink leak",
    propertyName: "Harmony Court",
    unit: "A101",
    status: "in_progress",
    priority: "high",
    timeAgo: "2 hours ago",
  },
  {
    id: "2",
    type: "Electrical",
    description: "Light fixture",
    propertyName: "Harmony Court",
    unit: "C306",
    status: "new",
    priority: "medium",
    timeAgo: "5 hours ago",
  },
  {
    id: "3",
    type: "AC",
    description: "AC not cooling",
    propertyName: "Harmony Court",
    unit: "B208",
    status: "new",
    priority: "high",
    timeAgo: "1 day ago",
  },
  {
    id: "4",
    type: "Electrical",
    description: "Light fixture",
    propertyName: "Harmony Court",
    unit: "B208",
    status: "new",
    priority: "medium",
    timeAgo: "5 hours ago",
  },
  {
    id: "5",
    type: "Plumbing",
    description: "Kitchen sink leak",
    propertyName: "Garden View",
    unit: "A203",
    status: "in_progress",
    priority: "high",
    timeAgo: "2 hours ago",
  },
  {
    id: "6",
    type: "Electrical",
    description: "Light fixture",
    propertyName: "Garden View",
    unit: "B101",
    status: "new",
    priority: "medium",
    timeAgo: "5 hours ago",
  },
  {
    id: "7",
    type: "AC",
    description: "AC not cooling",
    propertyName: "Palm Estate",
    unit: "C202",
    status: "new",
    priority: "high",
    timeAgo: "1 day ago",
  },
];

// Mock Properties
export const mockProperties: Property[] = [
  {
    id: "1",
    name: "Harmony Court — 3BR Duplex",
    address: "12 Iroko Street, Uyo, Akwa Ibom",
    units: 20,
    occupancy: 86,
    monthlyRent: 450000,
    nextDue: "05 Jan 2026",
    status: "active",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    amenities: ["24/7 Power", "Security Gate", "Water Treatment", "Swimming Pool", "Gym"],
  },
  {
    id: "2",
    name: "Garden View Apartments",
    address: "45 Independence Avenue, Lagos",
    units: 8,
    occupancy: 87.5,
    monthlyRent: 680000,
    nextDue: "10 Jan 2026",
    status: "active",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    amenities: ["24/7 Power", "Security Gate", "Water Treatment", "Parking"],
  },
  {
    id: "3",
    name: "Palm Estate",
    address: "23 Palm Grove, Port Harcourt",
    units: 6,
    occupancy: 83,
    monthlyRent: 520000,
    nextDue: "15 Jan 2026",
    status: "active",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    amenities: ["24/7 Power", "Security Gate", "Water Treatment", "Swimming Pool"],
  },
  {
    id: "4",
    name: "Sunset Apartments",
    address: "78 Sunset Boulevard, Abuja",
    units: 4,
    occupancy: 100,
    monthlyRent: 380000,
    nextDue: "20 Jan 2026",
    status: "active",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    amenities: ["24/7 Power", "Security Gate", "Water Treatment"],
  },
  {
    id: "5",
    name: "Ocean View Residence",
    address: "56 Marina Road, Calabar",
    units: 3,
    occupancy: 67,
    monthlyRent: 280000,
    nextDue: "25 Jan 2026",
    status: "active",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    amenities: ["24/7 Power", "Security Gate", "Water Treatment", "Swimming Pool"],
  },
  {
    id: "6",
    name: "City Heights",
    address: "91 Allen Avenue, Ikeja, Lagos",
    units: 10,
    occupancy: 90,
    monthlyRent: 950000,
    nextDue: "30 Jan 2026",
    status: "active",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    amenities: ["24/7 Power", "Security Gate", "Water Treatment", "Fiber Internet", "Gym"],
  },
  {
    id: "7",
    name: "Meadow Park",
    address: "34 GRA Phase 2, Enugu",
    units: 7,
    occupancy: 86,
    monthlyRent: 620000,
    nextDue: "05 Feb 2026",
    status: "active",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    amenities: ["24/7 Power", "Security Gate", "Water Treatment", "Parking"],
  },
  {
    id: "8",
    name: "Riverdale Complex",
    address: "15 Trans Amadi, Port Harcourt",
    units: 6,
    occupancy: 67,
    monthlyRent: 480000,
    nextDue: "10 Feb 2026",
    status: "pending",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    amenities: ["24/7 Power", "Security Gate", "Water Treatment"],
  },
];

// Types for Rent Page
export type RentPayment = {
  id: string;
  tenantName: string;
  propertyName: string;
  unit: string;
  rentAmount: number;
  dueDate: string;
  lastPayment?: string;
  status: "paid" | "overdue" | "due";
  balance?: number;
};

// Types for Maintenance Page
export type MaintenanceRequestWithDetails = {
  id: string;
  requestId: string;
  propertyName: string;
  unit: string;
  tenantName: string;
  type: string;
  subType: string;
  priority: "low" | "medium" | "high";
  status: "new" | "in_progress" | "resolved";
  reportedTime: string;
  description: string;
};

// Types for Messages Page
export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
};

export type Conversation = {
  id: string;
  userId: string;
  userName: string;
  userType: "tenant" | "manager";
  propertyName?: string;
  unit?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
};

// Mock Rent Payments
export const mockRentPayments: RentPayment[] = [
  {
    id: "1",
    tenantName: "Ada Emmanuel",
    propertyName: "Harmony Court",
    unit: "A101",
    rentAmount: 120000,
    dueDate: "05 Jan 2026",
    lastPayment: "05 Dec 2025",
    status: "paid",
  },
  {
    id: "2",
    tenantName: "John Musa",
    propertyName: "Garden View",
    unit: "B202",
    rentAmount: 90000,
    dueDate: "05 Jan 2026",
    lastPayment: "03 Nov 2025",
    status: "overdue",
    balance: 180000,
  },
  {
    id: "3",
    tenantName: "Sarah Okon",
    propertyName: "Palm Estate",
    unit: "C305",
    rentAmount: 150000,
    dueDate: "03 Jan 2026",
    lastPayment: "03 Dec 2025",
    status: "paid",
  },
  {
    id: "4",
    tenantName: "Michael Chen",
    propertyName: "Sunset Apartments",
    unit: "D101",
    rentAmount: 95000,
    dueDate: "02 Jan 2026",
    lastPayment: "02 Dec 2025",
    status: "paid",
  },
  {
    id: "5",
    tenantName: "Fatima Ahmed",
    propertyName: "Ocean View",
    unit: "E203",
    rentAmount: 85000,
    dueDate: "01 Jan 2026",
    status: "due",
    balance: 85000,
  },
];

// Mock Maintenance Requests with Details
export const mockMaintenanceRequestsWithDetails: MaintenanceRequestWithDetails[] = [
  {
    id: "1",
    requestId: "MNT-045",
    propertyName: "Harmony Court",
    unit: "A203",
    tenantName: "Ada Emmanuel",
    type: "Plumbing",
    subType: "Sink Not Working",
    priority: "high",
    status: "in_progress",
    reportedTime: "2 hours ago",
    description: "Kitchen sink has a persistent leak under the cabinet. Water is dripping onto the floor.",
  },
  {
    id: "2",
    requestId: "MNT-044",
    propertyName: "Garden View",
    unit: "B101",
    tenantName: "John Musa",
    type: "Electrical",
    subType: "Light Fixture",
    priority: "medium",
    status: "resolved",
    reportedTime: "1 day ago",
    description: "Bedroom light fixture is not working properly.",
  },
  {
    id: "3",
    requestId: "MNT-043",
    propertyName: "Harmony Court",
    unit: "C305",
    tenantName: "Sarah Okon",
    type: "AC",
    subType: "AC Not Cooling",
    priority: "high",
    status: "new",
    reportedTime: "3 hours ago",
    description: "AC unit in the living room is not cooling properly.",
  },
  {
    id: "4",
    requestId: "MNT-042",
    propertyName: "Palm Estate",
    unit: "A102",
    tenantName: "Michael Chen",
    type: "Plumbing",
    subType: "Toilet Issues",
    priority: "low",
    status: "new",
    reportedTime: "5 hours ago",
    description: "Toilet is constantly running and needs repair.",
  },
  {
    id: "5",
    requestId: "MNT-041",
    propertyName: "Sunset Apartments",
    unit: "D201",
    tenantName: "Fatima Ahmed",
    type: "Electrical",
    subType: "Power Outlet",
    priority: "medium",
    status: "in_progress",
    reportedTime: "1 day ago",
    description: "Power outlet in the kitchen is not working.",
  },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: "1",
    userId: "tenant-1",
    userName: "Ada Emmanuel",
    userType: "tenant",
    propertyName: "Harmony Court",
    unit: "A101",
    lastMessage: "Thank you for the quick response!",
    lastMessageTime: "10 min ago",
    unreadCount: 0,
    messages: [
      {
        id: "msg-1",
        senderId: "landlord",
        senderName: "You",
        text: "Hello Ada! Your payment is due on January 5th. You can pay through the payment link I sent you.",
        timestamp: "9:32 AM",
        isRead: true,
      },
      {
        id: "msg-2",
        senderId: "tenant-1",
        senderName: "Ada Emmanuel",
        text: "Hi! I wanted to ask about the payment due date.",
        timestamp: "9:30 AM",
        isRead: true,
      },
      {
        id: "msg-3",
        senderId: "tenant-1",
        senderName: "Ada Emmanuel",
        text: "Thank you for the quick response!",
        timestamp: "9:35 AM",
        isRead: true,
      },
    ],
  },
  {
    id: "2",
    userId: "tenant-2",
    userName: "John Musa",
    userType: "tenant",
    propertyName: "Garden View",
    unit: "B202",
    lastMessage: "When can we schedule the maintenance?",
    lastMessageTime: "2 hours ago",
    unreadCount: 2,
    messages: [
      {
        id: "msg-4",
        senderId: "tenant-2",
        senderName: "John Musa",
        text: "The AC in my unit is not working properly.",
        timestamp: "8:00 AM",
        isRead: true,
      },
      {
        id: "msg-5",
        senderId: "landlord",
        senderName: "You",
        text: "I'll send a maintenance team tomorrow morning.",
        timestamp: "8:15 AM",
        isRead: true,
      },
      {
        id: "msg-6",
        senderId: "tenant-2",
        senderName: "John Musa",
        text: "When can we schedule the maintenance?",
        timestamp: "10:00 AM",
        isRead: false,
      },
    ],
  },
  {
    id: "3",
    userId: "tenant-3",
    userName: "Sarah Okon",
    userType: "tenant",
    propertyName: "Palm Estate",
    unit: "C305",
    lastMessage: "Payment sent!",
    lastMessageTime: "1 day ago",
    unreadCount: 0,
    messages: [
      {
        id: "msg-7",
        senderId: "tenant-3",
        senderName: "Sarah Okon",
        text: "Payment sent!",
        timestamp: "Yesterday",
        isRead: true,
      },
    ],
  },
  {
    id: "4",
    userId: "manager-1",
    userName: "Musa Ahmed",
    userType: "manager",
    lastMessage: "All maintenance completed for this week",
    lastMessageTime: "2 days ago",
    unreadCount: 1,
    messages: [
      {
        id: "msg-8",
        senderId: "manager-1",
        senderName: "Musa Ahmed",
        text: "All maintenance completed for this week",
        timestamp: "2 days ago",
        isRead: false,
      },
    ],
  },
];

// Manager Types
export type Manager = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  assignedProperties: string[]; // Property IDs
  permissions: string[]; // Permission IDs
  lastActive: string; // e.g., "2 hours ago"
};

// Mock Managers
export const mockManagers: Manager[] = [
  {
    id: "1",
    name: "Musa Ahmed",
    email: "musa@example.com",
    phone: "+234 811 222 3333",
    status: "active",
    assignedProperties: ["1", "2"], // Harmony Court, Garden View
    permissions: ["maintenance", "chat", "payments"],
    lastActive: "2 hours ago",
  },
  {
    id: "2",
    name: "Ibrahim Sani",
    email: "ibrahim@example.com",
    phone: "+234 812 333 4444",
    status: "active",
    assignedProperties: ["3", "4"], // Palm Estate, Ocean View
    permissions: ["maintenance", "chat"],
    lastActive: "1 day ago",
  },
  {
    id: "3",
    name: "Amina Yusuf",
    email: "amina@example.com",
    phone: "+234 813 444 5555",
    status: "inactive",
    assignedProperties: ["5"], // Sunset Apartments
    permissions: ["maintenance"],
    lastActive: "5 days ago",
  },
];

