// =============================================
// OMIx MARKETPLACE — Constants & Config
// =============================================

// =============================================
// CATEGORIES (11 total)
// =============================================
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 1, name: "Electronics", slug: "electronics", icon: "" },
  { id: 2, name: "Furniture", slug: "furniture", icon: "" },
  { id: 3, name: "Clothing", slug: "clothing", icon: "" },
  { id: 4, name: "Books", slug: "books", icon: "" },
  { id: 5, name: "Vehicles", slug: "vehicles", icon: "" },
  { id: 6, name: "Home & Garden", slug: "home-garden", icon: "" },
  { id: 7, name: "Sports", slug: "sports", icon: "" },
  { id: 8, name: "Toys & Games", slug: "toys-games", icon: "" },
  { id: 9, name: "Health & Beauty", slug: "health-beauty", icon: "" },
  { id: 10, name: "Business Services", slug: "business-services", icon: "" },
  { id: 11, name: "Others", slug: "others", icon: "" },
];

// =============================================
// CONDITIONS
// =============================================
export interface Condition {
  value: string;
  label: string;
}

export const CONDITIONS: Condition[] = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

// =============================================
// DELIVERY ZONES
// =============================================
export interface DeliveryZone {
  id: number;
  name: string;
  fee: number; // in cents
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 1, name: "CBD / Town Center", fee: 150 },
  { id: 2, name: "Nearby Estates", fee: 250 },
  { id: 3, name: "Outer Areas", fee: 400 },
];

// =============================================
// TILL / PAYMENT
// =============================================
export const TILL_NUMBER = "1919000";
export const TILL_NAME = "Omix Marketplace";
export const COMMISSION_RATE = 0.05; // 5%

// =============================================
// PRICE FORMATTING
// Price is stored in cents (e.g., 2500 = KES 2,500)
// =============================================
export function formatPrice(cents: number): string {
  return `KES ${(cents / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// =============================================
// ORDER STATUS
// =============================================
export const ORDER_STATUS_FLOW = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "completed",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_FLOW)[number] | "disputed" | "cancelled" | "refunded";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Payment",
  paid: "Payment Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  disputed: "Under Dispute",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

// =============================================
// LISTING STATUS
// =============================================
export type ListingStatus =
  | "active"
  | "pending_review"
  | "paused"
  | "sold"
  | "expired"
  | "rejected";

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Active",
  pending_review: "Pending Review",
  paused: "Paused",
  sold: "Sold",
  expired: "Expired",
  rejected: "Rejected",
};

export const LISTING_STATUS_COLORS: Record<ListingStatus, string> = {
  active: "green",
  pending_review: "yellow",
  paused: "gray",
  sold: "blue",
  expired: "orange",
  rejected: "red",
};

// =============================================
// MESSAGE TYPES (for conversation-based messaging)
// =============================================
export type MessageType =
  | "text"
  | "image"
  | "offer"
  | "system"
  | "file";

export const MESSAGE_TYPES: Record<MessageType, string> = {
  text: "Text",
  image: "Image",
  offer: "Offer",
  system: "System",
  file: "File",
};

// =============================================
// OFFER STATUSES
// =============================================
export type OfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "cancelled";

export const OFFER_STATUSES: Record<OfferStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  pending: "yellow",
  accepted: "green",
  rejected: "red",
  expired: "gray",
  cancelled: "orange",
};

// =============================================
// DELIVERY STATUSES
// =============================================
export type DeliveryStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned";

export const DELIVERY_STATUSES: Record<DeliveryStatus, string> = {
  pending: "Pending Pickup",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed: "Delivery Failed",
  returned: "Returned",
};

export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  pending: "yellow",
  picked_up: "blue",
  in_transit: "blue",
  out_for_delivery: "purple",
  delivered: "green",
  failed: "red",
  returned: "orange",
};

// =============================================
// VERIFICATION TYPES
// =============================================
export type VerificationType =
  | "phone"
  | "id"
  | "email"
  | "business_license"
  | "address";

export const VERIFICATION_TYPES: Record<VerificationType, string> = {
  phone: "Phone Verification",
  id: "ID Verification",
  email: "Email Verification",
  business_license: "Business License",
  address: "Address Verification",
};

export const VERIFICATION_ICONS: Record<VerificationType, string> = {
  phone: "📞",
  id: "🪪",
  email: "📧",
  business_license: "🏢",
  address: "📍",
};

// =============================================
// REPORT REASONS
// =============================================
export type ReportReason =
  | "spam"
  | "fraud"
  | "inappropriate_content"
  | "prohibited_item"
  | "misleading"
  | "harassment"
  | "fake_review"
  | "other";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or Scam" },
  { value: "fraud", label: "Fraudulent Activity" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "prohibited_item", label: "Prohibited Item" },
  { value: "misleading", label: "Misleading Description" },
  { value: "harassment", label: "Harassment or Abuse" },
  { value: "fake_review", label: "Fake Review" },
  { value: "other", label: "Other" },
];

// =============================================
// SERVICE PRICE TYPES (for Business Services module)
// =============================================
export type ServicePriceType =
  | "fixed"
  | "hourly"
  | "starting_from"
  | "negotiable"
  | "quote";

export const SERVICE_PRICE_TYPES: Record<ServicePriceType, string> = {
  fixed: "Fixed Price",
  hourly: "Per Hour",
  starting_from: "Starting From",
  negotiable: "Negotiable",
  quote: "Request Quote",
};

// =============================================
// MODULES METADATA
// =============================================
export interface ModuleMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
}

export const MODULES: ModuleMetadata[] = [
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Browse, search, and buy products from verified sellers",
    icon: "🏪",
    route: "/marketplace",
  },
  {
    id: "escrow",
    name: "Escrow Payments",
    description: "Secure payments held in escrow until delivery is confirmed",
    icon: "🔒",
    route: "/payments",
  },
  {
    id: "messaging",
    name: "Messaging",
    description: "Chat with buyers and sellers via conversation threads",
    icon: "💬",
    route: "/messages",
  },
  {
    id: "ai-assistant",
    name: "AI Assistant",
    description: "Get smart recommendations and pricing suggestions",
    icon: "🤖",
    route: "/ai",
  },
  {
    id: "seller-stores",
    name: "Seller Stores",
    description: "Set up and customize your own storefront",
    icon: "🏬",
    route: "/sellers",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Track sales, views, and store performance metrics",
    icon: "📊",
    route: "/analytics",
  },
  {
    id: "trust-verification",
    name: "Trust & Verification",
    description: "Verify your identity and build trust with the community",
    icon: "✅",
    route: "/trust",
  },
  {
    id: "logistics",
    name: "Logistics",
    description: "Manage deliveries, tracking, and shipping zones",
    icon: "🚚",
    route: "/logistics",
  },
  {
    id: "business-services",
    name: "Business Services",
    description: "Offer or find professional services in your area",
    icon: "💼",
    route: "/services",
  },
];

// =============================================
// HELPER: Get module by ID
// =============================================
export function getModuleById(id: string): ModuleMetadata | undefined {
  return MODULES.find((m) => m.id === id);
}

// =============================================
// HELPER: Get category by slug
// =============================================
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// =============================================
// HELPER: Get delivery zone name
// =============================================
export function getDeliveryZoneName(id: number): string {
  const zone = DELIVERY_ZONES.find((z) => z.id === id);
  return zone?.name ?? "Unknown Zone";
}
