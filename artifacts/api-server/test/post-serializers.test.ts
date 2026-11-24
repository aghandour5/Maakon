import assert from "node:assert/strict";
import test from "node:test";
import type { Post } from "@workspace/db/schema";
import { toPrivatePost, toPublicPost } from "../src/lib/post-serializers";

const request: Post = {
  id: 1,
  userId: 2,
  postType: "need",
  title: "Synthetic request",
  category: "food",
  description: "Example for contact privacy tests.",
  governorate: "Beirut",
  district: "Beirut City",
  providerType: null,
  verifiedBadgeType: null,
  urgency: null,
  contactMethod: "email",
  contactInfo: "requester@example.test",
  exactAddressPrivate: "Private location fixture",
  publicLat: 33.89,
  publicLng: 35.5,
  privateLat: null,
  privateLng: null,
  status: "active",
  reportCount: 0,
  draftToken: null,
  lastConfirmedAt: null,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("the public serializer redacts individual contact and private location even for the owner", () => {
  const publicPost = toPublicPost(request, request.userId);
  assert.equal(publicPost.isOwnPost, true);
  assert.equal(publicPost.contactMethod, null);
  assert.equal(publicPost.contactInfo, null);
  assert.equal("exactAddressPrivate" in publicPost, false);
  assert.equal("draftToken" in publicPost, false);

  const privatePost = toPrivatePost(request, request.userId);
  assert.equal(privatePost.contactInfo, request.contactInfo);
  assert.equal(privatePost.contactMethod, request.contactMethod);
  assert.equal(privatePost.exactAddressPrivate, request.exactAddressPrivate);
});

test("NGO volunteer requests and offers keep their public contact", () => {
  for (const publicPost of [
    toPublicPost({ ...request, providerType: "ngo" }),
    toPublicPost({ ...request, postType: "offer" }),
  ]) {
    assert.equal(publicPost.contactInfo, request.contactInfo);
    assert.equal(publicPost.contactMethod, request.contactMethod);
  }
});
