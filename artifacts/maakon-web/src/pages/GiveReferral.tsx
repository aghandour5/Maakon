import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useTranslation } from "react-i18next";
import { Globe, Loader2, LocateFixed, MapPin, Phone } from "lucide-react";
import { getListNearbyNgosQueryKey, useGetMetadata, useListNearbyNgos, type ReferralPartner } from "@workspace/api-client-react";
import { findNearestDistrict, getDistrictsForGovernorate, GOVERNORATES, isValidGovernorate } from "@workspace/locations";
import Footer from "@/components/layout/Footer";
import { TopNav } from "@/components/layout/TopNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getContactHref } from "@/lib/contact-links";
import { getGiveHref } from "@/lib/give-referral";

const selectClass = "block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:bg-slate-100";
const linkClass = "font-semibold text-emerald-800 underline underline-offset-4";

export default function GiveReferral() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const requestedGovernorate = params.get("governorate");
  const governorate = isValidGovernorate(requestedGovernorate) ? requestedGovernorate : "";
  const requestedDistrict = params.get("district");
  const validDistricts = getDistrictsForGovernorate(governorate);
  const district = requestedDistrict && validDistricts.includes(requestedDistrict) ? requestedDistrict : "";
  const { data: metadata } = useGetMetadata();
  const districts = metadata?.districts[governorate] ?? validDistricts;
  const area = { governorate, district };
  const results = useListNearbyNgos(area, {
    query: {
      queryKey: getListNearbyNgosQueryKey(area),
      enabled: Boolean(governorate && district),
    },
  });

  const governorateSelect = useRef<HTMLSelectElement>(null);
  const pendingLocation = useRef<symbol | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showDraftNotice] = useState(() => window.history.state?.draftOfferRetired === true);

  useEffect(() => {
    if (window.history.state?.draftOfferRetired === true) window.history.replaceState(null, "");
    return () => { pendingLocation.current = null; };
  }, []);

  function selectArea(nextGovernorate?: string, nextDistrict?: string) {
    pendingLocation.current = null;
    setLocating(false);
    setLocationError(null);
    navigate(getGiveHref(nextGovernorate, nextDistrict), { replace: true });
  }

  function locate() {
    if (!window.isSecureContext) {
      setLocationError("locate_secure_context_required");
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("locate_not_supported");
      return;
    }

    const request = Symbol();
    pendingLocation.current = request;
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (pendingLocation.current !== request) return;
        const area = findNearestDistrict({ lat: coords.latitude, lng: coords.longitude });
        selectArea(area.governorate, area.district);
      },
      (error) => {
        if (pendingLocation.current !== request) return;
        pendingLocation.current = null;
        setLocating(false);
        const keys = ["locate_failed", "locate_permission_denied", "locate_unavailable", "locate_timeout"];
        setLocationError(keys[error.code] ?? "locate_failed");
      },
      { timeout: 10000 },
    );
  }

  const { data, isError, isLoading, refetch } = results;
  const hasResults = data && (data.distanceMatches.length > 0 || data.areaMatches.length > 0);
  const fallbackLinks = (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <Link href="/map" className={linkClass}>{t("give_browse_map")}</Link>
      <Link href="/contact" className={linkClass}>{t("give_contact")}</Link>
    </div>
  );

  return (
    <div dir={i18n.dir()} className="flex min-h-dvh flex-col bg-slate-50">
      <TopNav showBack title={t("i_want_to_help")} />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 pb-14 pt-10 sm:px-6 sm:pt-14">
        <header className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{t("give_title")}</h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600">{t("give_intro")}</p>
          {user?.accountType === "ngo" && (
            <Link href="/offer/new" className={`inline-block text-sm ${linkClass}`}>{t("give_post_org_offer")}</Link>
          )}
        </header>

        {showDraftNotice && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {t("give_retired_draft")}
          </p>
        )}

        <section aria-label={t("give_choose_area")} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
              <span>{t("governorate")}</span>
              <select ref={governorateSelect} className={selectClass} value={governorate}
                onChange={(event) => selectArea(event.target.value)}>
                <option value="">{t("give_select_governorate")}</option>
                {(metadata?.governorates ?? GOVERNORATES).map((name) => (
                  <option key={name} value={name}>{t(name, { fallbackLng: false })}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
              <span>{t("district")}</span>
              <select className={selectClass} disabled={!governorate} value={district}
                onChange={(event) => selectArea(governorate, event.target.value)}>
                <option value="">{t("give_select_district")}</option>
                {districts.map((name) => <option key={name} value={name}>{t(name, { fallbackLng: false })}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button type="button" variant="outline" className="min-h-11 rounded-xl" onClick={locate}
              disabled={locating} aria-describedby="give-location-privacy">
              {locating ? <Loader2 aria-hidden="true" className="animate-spin" /> : <LocateFixed aria-hidden="true" />}
              {t(locating ? "give_locating" : "give_use_location")}
            </Button>
            <p id="give-location-privacy" className="text-sm text-slate-600">{t("give_location_privacy")}</p>
          </div>
          {locationError && <p role="alert" className="text-sm text-red-700">{t(locationError)}</p>}
        </section>

        {isLoading && (
          <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" /> {t("give_loading")}
          </p>
        )}
        {isError && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <p role="alert" className="font-semibold text-slate-900">{t("give_error")}</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>{t("give_retry")}</Button>
            {fallbackLinks}
          </div>
        )}
        {data && !isError && !hasResults && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <p role="status" className="font-semibold text-slate-900">
              {t("give_no_results", { area: t(district, { fallbackLng: false }) })}
            </p>
            <Button type="button" variant="outline" onClick={() => {
              selectArea();
              governorateSelect.current?.focus();
            }}>
              {t("give_another_area")}
            </Button>
            {fallbackLinks}
          </div>
        )}
        {data && !isError && hasResults && (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-slate-600">{t("give_contribution_note")}</p>
            <ReferralSection title={t("give_nearest")} partners={data.distanceMatches} />
            <ReferralSection title={t("give_listed_in_area")} partners={data.areaMatches} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ReferralSection({ title, partners }: { title: string; partners: ReferralPartner[] }) {
  if (!partners.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {partners.map((partner) => <PartnerCard key={partner.id} partner={partner} />)}
      </ul>
    </section>
  );
}

function PartnerCard({ partner }: { partner: ReferralPartner }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const textAlignment = isRtl ? "text-right" : "text-left";
  const callHref = partner.phone ? getContactHref("phone", partner.phone) : null;
  const area = [partner.district, partner.governorate]
    .filter((name): name is string => Boolean(name))
    .map((name) => t(name, { fallbackLng: false }))
    .join(isRtl ? "، " : ", ");
  const { match } = partner;
  const distanceLabel = match.type === "area"
    ? t(match.level === "district" ? "give_district_match" : "give_governorate_match")
    : match.distanceKm < 1
      ? t("give_less_than_km")
      : t("give_distance_km", { km: new Intl.NumberFormat(i18n.language).format(Math.round(match.distanceKm)) });

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className={`wrap-break-word text-lg font-bold text-slate-900 ${textAlignment}`} dir="auto">{partner.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin aria-hidden="true" className="size-4 shrink-0" /> {area}
        </p>
        <p className="mt-1 text-sm font-medium text-emerald-800">{distanceLabel}</p>
      </div>
      {partner.description && (
        <p dir="auto" className={`wrap-break-word text-sm leading-relaxed text-slate-600 ${textAlignment}`}>
          {partner.description}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {callHref && (
          <Button asChild className="min-h-11 rounded-xl border-emerald-700 bg-emerald-700 text-white">
            <a href={callHref}>
              <Phone aria-hidden="true" /> {t("give_call")} <bdi>{partner.phone}</bdi>
            </a>
          </Button>
        )}
        {partner.website && (
          <Button asChild variant="outline" className="min-h-11 rounded-xl">
            <a href={partner.website} target="_blank" rel="noopener noreferrer">
              <Globe aria-hidden="true" /> {t("website")}
            </a>
          </Button>
        )}
      </div>
    </li>
  );
}
