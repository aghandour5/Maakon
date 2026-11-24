import type { Post } from "@workspace/db/schema";
import { clampLocationCoordinates } from "@workspace/locations";

export function isVulnerableNeedPost(
  postType: Post["postType"],
  providerType?: string | null,
): boolean {
  return postType === "need" && providerType !== "ngo";
}

export function toPublicPost(post: Post, viewerUserId?: number | null) {
  const { lat: publicLat, lng: publicLng } =
    post.publicLat != null && post.publicLng != null
      ? clampLocationCoordinates(
          post.publicLat,
          post.publicLng,
          post.governorate,
          post.district,
        )
      : { lat: null, lng: null };
  const privateContact = isVulnerableNeedPost(post.postType, post.providerType);

  return {
    id: post.id,
    isOwnPost: viewerUserId != null && post.userId === viewerUserId,
    postType: post.postType,
    title: post.title,
    category: post.category,
    description: post.description,
    urgency: post.urgency ?? null,
    governorate: post.governorate,
    district: post.district ?? null,
    publicLat: publicLat ?? null,
    publicLng: publicLng ?? null,
    providerType: post.providerType ?? null,
    verifiedBadgeType: post.verifiedBadgeType ?? null,
    contactMethod: privateContact ? null : post.contactMethod ?? null,
    contactInfo: privateContact ? null : post.contactInfo ?? null,
    status: post.status,
    reportCount: post.reportCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    expiresAt: post.expiresAt ?? null,
    lastConfirmedAt: post.lastConfirmedAt ?? null,
  };
}

export function toPrivatePost(post: Post, viewerUserId?: number | null) {
  return {
    ...toPublicPost(post, viewerUserId),
    contactMethod: post.contactMethod ?? null,
    contactInfo: post.contactInfo ?? null,
    userId: post.userId,
    privateLat: post.privateLat ?? null,
    privateLng: post.privateLng ?? null,
    exactAddressPrivate: post.exactAddressPrivate ?? null,
  };
}
