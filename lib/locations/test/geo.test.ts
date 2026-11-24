import assert from "node:assert/strict";
import test from "node:test";
import { DISTRICT_CENTERS, findNearestDistrict, haversineKm, isValidLocation } from "../src/index";

test("haversineKm returns the same distance in either direction", () => {
  const beirut = DISTRICT_CENTERS["Beirut City"];
  const tripoli = DISTRICT_CENTERS.Tripoli;
  assert.equal(haversineKm(beirut, beirut), 0);
  const distance = haversineKm(beirut, tripoli);
  assert.ok(distance > 65 && distance < 70);
  assert.equal(distance, haversineKm(tripoli, beirut));
});

test("findNearestDistrict keeps a valid pair and breaks ties in listed order", () => {
  for (const [center, expected] of [
    [DISTRICT_CENTERS.Halba, { governorate: "Akkar", district: "Halba" }],
    [DISTRICT_CENTERS.Baalbek, { governorate: "Bekaa", district: "Baalbek" }],
    [DISTRICT_CENTERS.Metn, { governorate: "Mount Lebanon", district: "Matn" }],
  ] as const) {
    const area = findNearestDistrict(center);
    assert.deepEqual(area, expected);
    assert.ok(isValidLocation(area.governorate, area.district));
  }
});
