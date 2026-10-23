export type AccountSummary = {
  id: string;
  fullName: string;
  email: string;
  pendingEmail?: string;
  avatarUrl: string | null;
};

export type ConnectedStay = {
  id: string;
  guestName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  activatedAt: string | null;
  property: {
    name: string;
    country: string | null;
    worldNumber: number;
  };
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

