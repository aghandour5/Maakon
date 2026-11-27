export type PostStatus =
  | "active"
  | "hidden"
  | "resolved"
  | "expired"
  | "pending"
  | "frozen"
  | "removed";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export interface AdminPost {
  id: number;
  postType: "need" | "offer";
  title: string;
  category: string;
  governorate: string;
  status: PostStatus;
  updatedAt: string;
  district: string | null;
  providerType: string | null;
  publicContactMethod: string | null;
  publicContactInfo: string | null;
  urgency: string | null;
  durationDays: number;
  description: string;
  reportCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface AdminReport {
  id: number;
  postId: number;
  postTitle: string;
  postStatus: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reportedAt: string;
  resolvedAt: string | null;
}

export interface AdminUser {
  id: number;
  email: string | null;
  displayName: string | null;
  role: string;
  accountType: string;
  ngoVerificationStatus: string;
  createdAt: string;
}

export interface AdminNgo {
  id: number;
  name: string;
  description: string | null;
  governorate: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  verifiedAt: string | null;
  referralApprovedAt: string | null;
  status: string;
  createdAt: string;
}

export interface Stats {
  posts: {
    total: number;
    active: number;
    hidden: number;
    resolved: number;
    expired: number;
    pending: number;
    frozen: number;
    removed: number;
  };
  reports: {
    total: number;
    open: number;
    reviewed: number;
    dismissed: number;
    actioned: number;
  };
  ngos: { total: number; verified: number; unverified: number };
}

export type Resources = {
  stats: Stats;
  posts: AdminPost[];
  reports: AdminReport[];
  ngos: AdminNgo[];
  users: AdminUser[];
};
export type Tab = Exclude<keyof Resources, "stats">;
