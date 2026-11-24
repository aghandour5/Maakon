export function canPublishOffer(user: { accountType: string } | null | undefined): boolean {
  return user?.accountType === "ngo";
}

export const OFFER_REFERRAL_REQUIRED = {
  code: "offer_referral_required",
  error: "To offer help, find a nearby organization at /give. / لعرض المساعدة، ابحث عن منظمة قريبة عبر صفحة /give.",
};
