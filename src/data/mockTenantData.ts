// Mock data for Tenant Dashboard and Rent Pages

export type TenantPayment = {
  id: string;
  type: string;
  date: string;
  method?: string;
  confirmationNumber: string;
  amount: number;
  status: "paid" | "pending";
};

export type TenantPaymentSummary = {
  totalPaid: number;
  totalPaidCount: number;
  averagePayment: number;
  outstandingAmount: number;
  outstandingCount: number;
};

// Mock tenant payment history
export const mockTenantPayments: TenantPayment[] = [
  {
    id: "1",
    type: "Rent Payment",
    date: "May 1, 2025",
    confirmationNumber: "PENDING-2025-05-001",
    amount: 1500,
    status: "pending",
  },
  {
    id: "2",
    type: "Rent Payment",
    date: "April 1, 2025",
    method: "Credit Card",
    confirmationNumber: "PAY-2025-04-001",
    amount: 1500,
    status: "paid",
  },
  {
    id: "3",
    type: "Rent Payment",
    date: "March 1, 2025",
    method: "Bank Transfer",
    confirmationNumber: "PAY-2025-03-001",
    amount: 1500,
    status: "paid",
  },
  {
    id: "4",
    type: "Rent Payment",
    date: "February 1, 2025",
    method: "Credit Card",
    confirmationNumber: "PAY-2025-02-001",
    amount: 1500,
    status: "paid",
  },
  {
    id: "5",
    type: "Rent Payment",
    date: "January 1, 2025",
    method: "Credit Card",
    confirmationNumber: "PAY-2025-01-001",
    amount: 1500,
    status: "paid",
  },
  {
    id: "6",
    type: "Rent Payment",
    date: "December 1, 2024",
    method: "Bank Transfer",
    confirmationNumber: "PAY-2024-12-001",
    amount: 1500,
    status: "paid",
  },
  {
    id: "7",
    type: "Rent Payment",
    date: "November 1, 2024",
    method: "Credit Card",
    confirmationNumber: "PAY-2024-11-001",
    amount: 1500,
    status: "paid",
  },
];

// Calculate payment summary
export const getTenantPaymentSummary = (
  payments: TenantPayment[]
): TenantPaymentSummary => {
  const paidPayments = payments.filter((p) => p.status === "paid");
  const pendingPayments = payments.filter((p) => p.status === "pending");

  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const averagePayment =
    paidPayments.length > 0 ? totalPaid / paidPayments.length : 0;
  const outstandingAmount = pendingPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  return {
    totalPaid,
    totalPaidCount: paidPayments.length,
    averagePayment,
    outstandingAmount,
    outstandingCount: pendingPayments.length,
  };
};

// Mock tenant rental info
export const mockTenantRentalInfo = {
  property: {
    name: "Harmony Court — 3BR Duplex",
    address: "12 Iroko Street, Uyo, Akwa Ibom",
  },
  unit: {
    number: "A101",
    type: "2BR Apartment",
  },
  landlord: {
    name: "Property Owner",
  },
  amountDue: 120000,
  dueDate: "05 Jan 2026",
};

// Tenant Maintenance Request Types
export type TenantMaintenanceRequest = {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  priority: "low" | "medium" | "high";
  description: string;
  reportedDate: string;
  assignedTeam?: string;
  status: "new" | "in_progress" | "resolved";
  images?: string[];
};

// Tenant Messages Types
export type TenantContact = {
  id: string;
  name: string;
  role: "landlord" | "manager";
  isOnline: boolean;
  avatarColor: string;
};

export type TenantMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
};

export type TenantConversation = {
  id: string;
  contactId: string;
  contactName: string;
  contactRole: "landlord" | "manager";
  isOnline: boolean;
  avatarColor: string;
  messages: TenantMessage[];
  lastMessageTime: string;
};

// Mock tenant contacts
export const mockTenantContacts: TenantContact[] = [
  {
    id: "landlord-1",
    name: "John Smith",
    role: "landlord",
    isOnline: true,
    avatarColor: "bg-blue-500",
  },
  {
    id: "manager-1",
    name: "Emily Davis",
    role: "manager",
    isOnline: false,
    avatarColor: "bg-purple-500",
  },
];

// Mock tenant conversations
export const mockTenantConversations: TenantConversation[] = [
  {
    id: "conv-1",
    contactId: "landlord-1",
    contactName: "John Smith",
    contactRole: "landlord",
    isOnline: true,
    avatarColor: "bg-blue-500",
    lastMessageTime: "9:22 AM",
    messages: [
      {
        id: "msg-1",
        senderId: "landlord-1",
        senderName: "John Smith",
        text: "Hello! I hope you're settling in well.",
        timestamp: "9:00 AM",
        isRead: true,
      },
      {
        id: "msg-2",
        senderId: "tenant",
        senderName: "You",
        text: "Hi John! Yes, everything is great. Just submitted a maintenance request for the AC.",
        timestamp: "9:15 AM",
        isRead: true,
      },
      {
        id: "msg-3",
        senderId: "landlord-1",
        senderName: "John Smith",
        text: "Got it! I'll have a technician come by tomorrow between 2-4 PM. Does that work?",
        timestamp: "9:20 AM",
        isRead: true,
      },
      {
        id: "msg-4",
        senderId: "tenant",
        senderName: "You",
        text: "That works perfectly. Thanks!",
        timestamp: "9:22 AM",
        isRead: true,
      },
    ],
  },
  {
    id: "conv-2",
    contactId: "manager-1",
    contactName: "Emily Davis",
    contactRole: "manager",
    isOnline: false,
    avatarColor: "bg-purple-500",
    lastMessageTime: "Yesterday",
    messages: [
      {
        id: "msg-5",
        senderId: "manager-1",
        senderName: "Emily Davis",
        text: "Hello! I hope you're settling in well.",
        timestamp: "9:00 AM",
        isRead: true,
      },
      {
        id: "msg-6",
        senderId: "tenant",
        senderName: "You",
        text: "Hi Emily! Yes, everything is great. Just submitted a maintenance request for the AC.",
        timestamp: "9:15 AM",
        isRead: true,
      },
      {
        id: "msg-7",
        senderId: "manager-1",
        senderName: "Emily Davis",
        text: "Got it! I'll have a technician come by tomorrow between 2-4 PM. Does that work?",
        timestamp: "9:20 AM",
        isRead: true,
      },
      {
        id: "msg-8",
        senderId: "tenant",
        senderName: "You",
        text: "That works perfectly. Thanks!",
        timestamp: "9:22 AM",
        isRead: true,
      },
    ],
  },
];

// Mock tenant maintenance requests
export const mockTenantMaintenanceRequests: TenantMaintenanceRequest[] = [
  {
    id: "1",
    title: "HVAC - AC not cooling",
    category: "HVAC",
    subCategory: "AC not cooling",
    priority: "low",
    description: "AC not cooling properly in bedroom",
    reportedDate: "05 Dec 2025",
    assignedTeam: "Tech Team B",
    status: "resolved",
    images: [
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
    ],
  },
  {
    id: "2",
    title: "Plumbing - Leaking sink",
    category: "Plumbing",
    subCategory: "Leaking sink",
    priority: "medium",
    description: "Kitchen sink dripping water",
    reportedDate: "15 Dec 2025",
    assignedTeam: "Tech Team A",
    status: "in_progress",
    images: [
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop",
    ],
  },
];

