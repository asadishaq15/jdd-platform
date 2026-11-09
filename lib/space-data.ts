export type AccountSummary = {
  id: string;
  fullName: string;
  email: string;
  pendingEmail?: string;
  avatarUrl: string | null;
  /** Google (or other OAuth) photo URL used when no custom upload is set. */
  providerAvatarUrl?: string | null;
};

export type ConnectedStay = {
  id: string;
  guestName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  activatedAt: string | null;
  property: {
    id: string;
    name: string;
    country: string | null;
    worldNumber: number;
  };
};

export type CommunityCircleEvent = {
  id: string;
  propertyId: string;
  category: "event" | "invite" | "news";
  title: string;
  timing: string;
  body: string;
  thumbnailUrl: string | null;
};

export type CardOrder = {
  id: string;
  stayId: string | null;
  propertyId: string;
  propertyName: string;
  recipientName: string;
  status: "requested" | "preparing" | "sent" | "delivered" | "received" | "cancelled";
  createdAt: string;
};

