import assert from "node:assert/strict";
import test from "node:test";
import { hasUsablePublicContact, rankReferralPartners } from "../src/lib/partner-referrals";

const area = { governorate: "Beirut", district: "Beirut City" };
const now = new Date();
const partner = {
  id: 1,
  name: "Partner",
  description: null,
  ...area,
  lat: 33.895,
  lng: 35.5,
  phone: "140",
  website: null,
  verifiedAt: now,
  referralApprovedAt: now,
  status: "active",
  userId: 43,
};

test("only active, verified, approved organizations with usable contact are returned", () => {
  assert.ok(hasUsablePublicContact(partner));
  assert.ok(hasUsablePublicContact({ phone: null, website: "partner.example.test" }));
  assert.ok(hasUsablePublicContact({ phone: null, website: "http://partner.example.test" }));
  assert.ok(hasUsablePublicContact({ phone: null, website: "partner.example.test?source=https://example.test" }));
  assert.equal(hasUsablePublicContact({ phone: "12", website: "https://localhost" }), false);
  assert.equal(hasUsablePublicContact({ phone: null, website: "javascript://partner.example.test" }), false);

  const { distanceMatches } = rankReferralPartners([
    { ...partner, id: 2, referralApprovedAt: null },
    { ...partner, id: 3, verifiedAt: null },
    { ...partner, id: 4, status: "hidden" },
    { ...partner, id: 5, phone: null },
    { ...partner, lat: 33.94 },
  ], area);
  assert.deepEqual(distanceMatches.map(({ id }) => id), [1]);
  assert.deepEqual(Object.keys(distanceMatches[0]).sort(), [
    "description", "district", "governorate", "id", "match", "name", "phone", "website",
  ]);
});

test("distance ties prefer the selected district, then name and ID", () => {
  const { distanceMatches } = rankReferralPartners([
    { ...partner, id: 2, name: "aLPHa" },
    { ...partner, id: 3, name: "ALPHA", district: null },
    { ...partner, id: 4, name: "alpha" },
    { ...partner, id: 5, name: "a", governorate: "Akkar", district: "Halba" },
    { ...partner, id: 6, lat: 33.8938, lng: 35.5018 },
    { ...partner, id: 7, lat: 34.5 },
  ], area);
  assert.deepEqual(distanceMatches.map(({ id }) => id), [6, 2, 4, 5, 3]);
  assert.deepEqual(distanceMatches[0].match, { type: "distance", distanceKm: 0 });
});

test("missing or invalid coordinates fall back to district and governorate matches", () => {
  const areaPartner = { ...partner, lat: null, lng: null, phone: null, website: "partner.example.test" };
  const { distanceMatches, areaMatches } = rankReferralPartners([
    { ...areaPartner, id: 2, district: null, name: "A" },
    { ...areaPartner, id: 3, governorate: "Akkar", district: "Halba" },
    { ...areaPartner, id: 4, lat: 0, lng: 0, name: "a" },
    ...[5, 6, 7, 8, 9].map((id) => ({ ...areaPartner, id, district: null })),
  ], area);
  assert.deepEqual(distanceMatches, []);
  assert.deepEqual(areaMatches.map(({ id }) => id), [4, 2, 5, 6, 7]);
  assert.deepEqual(areaMatches[0].match, { type: "area", level: "district" });
  assert.deepEqual(areaMatches[1].match, { type: "area", level: "governorate" });
  assert.equal(areaMatches[0].website, "https://partner.example.test/");
});
