import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { useListPosts, useListNgos, useGetMetadata } from "@workspace/api-client-react";
import type { ListPostsParams, PostPublic, Ngo } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { PostDetailsModal } from "@/components/map/PostDetailsModal";
import { Filter, X, MapPin, ChevronRight, SearchX, Plus, Minus, Maximize, AlertTriangle, LocateFixed } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLocation } from "wouter";
import { useAuthGate } from "@/hooks/useAuthGate";

// ─── Icons ──────────────────────────────────────────────────────────────────

const makeIcon = (className: string, innerHtml = '', size = 24) =>
  L.divIcon({
    className: `custom-marker ${className}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
    html: innerHtml,
  });

const SHIELD_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

const icons = {
  need: makeIcon('marker-need'),
  offer: makeIcon('marker-offer'),
  offerVerified: makeIcon('marker-offer', SHIELD_SVG),
  offerUnverified: makeIcon('marker-offer bg-green-600', '<div style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background-color:#f97316;border-radius:50%;border:2px solid white;z-index:10"></div>'),
  ngo: makeIcon('marker-ngo', SHIELD_SVG),
  ngoUnverified: makeIcon('marker-ngo-unverified'),
  selectedNeed: makeIcon('marker-need marker-selected', '', 32),
  selectedOffer: makeIcon('marker-offer marker-selected', '', 32),
  selectedOfferVerified: makeIcon('marker-offer marker-selected', SHIELD_SVG, 32),
  selectedOfferUnverified: makeIcon('marker-offer marker-selected bg-green-600', '<div style="position:absolute;top:-1px;right:-1px;width:12px;height:12px;background-color:#f97316;border-radius:50%;border:2px solid white;z-index:10"></div>', 32),
};

const createClusterCustomIcon = (
  cluster: Parameters<NonNullable<Parameters<typeof MarkerClusterGroup>[0]['iconCreateFunction']>>[0]
) =>
  L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: 'marker-cluster',
    iconSize: L.point(40, 40, true),
  });

// ─── Map controller — flies to a given center ────────────────────────────────

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    const zoom = Math.max(map.getZoom(), 13);
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, map]);
  return null;
}

// ─── Modern Custom Leaflet Controls ─────────────────────────────────────────

function ModernMapControls() {
  const map = useMap();
  const { i18n, t } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const ref = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(false);

  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocateError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1 });
      },
      () => {
        setLocating(false);
        setLocateError(true);
        setTimeout(() => setLocateError(false), 3000);
      },
      { timeout: 8000 },
    );
  };

  return (
    <div ref={ref} className={`absolute top-4 sm:top-6 ${isRtl ? 'right-4 sm:right-6' : 'left-4 sm:left-6'} z-[1000] flex flex-col gap-2`}>
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200/50 flex flex-col items-center justify-center text-slate-700 hover:bg-white hover:text-emerald-600 transition-all hover:scale-105 active:scale-95"
        aria-label={t("zoom_in", "Zoom in")}
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200/50 flex flex-col items-center justify-center text-slate-700 hover:bg-white hover:text-emerald-600 transition-all hover:scale-105 active:scale-95"
        aria-label={t("zoom_out", "Zoom out")}
      >
        <Minus className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        onClick={() => map.flyToBounds([[33.05, 35.1], [34.70, 36.65]], { duration: 1.2 })}
        className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-slate-200/50 flex items-center justify-center text-slate-700 hover:bg-white hover:text-emerald-600 transition-all hover:scale-105 active:scale-95 mt-1 sm:mt-2"
        title={t('fit_to_screen') || "Fit to Screen"}
        aria-label={t("fit_to_screen", "Fit to Screen")}
      >
        <Maximize className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
      </button>
      <button
        onClick={handleLocate}
        disabled={locating}
        title={t('locate_me') || "My Location"}
        aria-label={t("locate_me", "My Location")}
        className={`w-10 h-10 backdrop-blur-md rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] border flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${locateError
          ? 'bg-red-50 border-red-200 text-red-500'
          : 'bg-white/90 border-slate-200/50 text-slate-700 hover:bg-white hover:text-blue-600'
          } ${locating ? 'opacity-60 cursor-wait' : ''}`}
      >
        <LocateFixed className={`w-4 h-4 sm:w-5 sm:h-5 ${locating ? 'animate-pulse text-blue-500' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

type SelectedItem = { item: PostPublic; type: 'post' } | { item: Ngo; type: 'ngo' };

// ─── Page ───────────────────────────────────────────────────────────────────

const LEBANON_BOUNDS: L.LatLngBoundsExpression = [
  [33.05, 35.1], // South-West (approx)
  [34.70, 36.65] // North-East (approx)
];

export default function MapPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const dateLocale = isRtl ? ar : enUS;

  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<ListPostsParams>({ activeOnly: true });
  const [showFilters, setShowFilters] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [legendMinimized, setLegendMinimized] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const { data: posts, isLoading: isLoadingPosts, isError: isErrorPosts } = useListPosts(filters);
  const { data: ngos, isLoading: isLoadingNgos, isError: isErrorNgos } = useListNgos(
    filters.governorate ? { governorate: filters.governorate } : undefined
  );
  const { data: metadata } = useGetMetadata();
  const { requireAuth } = useAuthGate();

  // Trigger Leaflet resize after mount
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(timer);
  }, []);

  // ── Filter helpers ──────────────────────────────────────────────────────

  type StringFilterKey = 'postType' | 'category' | 'governorate' | 'district' | 'urgency';
  type BoolFilterKey = 'activeOnly' | 'verifiedNgoOnly';

  const updateStringFilter = (key: StringFilterKey, value: string | undefined) => {
    if (key === 'governorate') {
      setFilters(prev => ({ ...prev, [key]: value, district: undefined }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const updateBoolFilter = (key: BoolFilterKey, value: boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({ activeOnly: true });

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'activeOnly' && v !== undefined && v !== false
  ).length;

  const availableDistricts = filters.governorate
    ? (metadata?.districts?.[filters.governorate] ?? [])
    : [];

  // ── Selection helpers ───────────────────────────────────────────────────

  const openPost = (post: PostPublic, fly = false) => {
    setSelectedItem({ item: post, type: 'post' });
    setSelectedPostId(post.id);
    if (fly && post.publicLat && post.publicLng) {
      setMapCenter([post.publicLat, post.publicLng]);
    }
  };

  const openNgo = (ngo: Ngo) => {
    setSelectedItem({ item: ngo, type: 'ngo' });
    setSelectedPostId(null);
    if (ngo.lat && ngo.lng) {
      setMapCenter([ngo.lat, ngo.lng]);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setSelectedPostId(null);
  };

  // ── Toggle switch ───────────────────────────────────────────────────────

  const toggleSwitch = (active: boolean, onClick: () => void, label: string) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={onClick}
        className={`w-11 h-6 rounded-full transition-colors flex items-center ${active ? 'bg-primary' : 'bg-muted'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${active ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );

  // ── Loading / empty states ──────────────────────────────────────────────

  const isLoading = isLoadingPosts || isLoadingNgos;
  const isError = isErrorPosts || isErrorNgos;
  const visibleNgos = (!filters.postType || filters.verifiedNgoOnly) 
    ? (ngos ?? []).filter(ngo => !filters.verifiedNgoOnly || !!ngo.verifiedAt) 
    : [];
  const totalResults = (posts?.length ?? 0) + visibleNgos.length;
  const hasResults = totalResults > 0;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-background overflow-hidden relative">
      <TopNav title={t('view_map')} showBack />

      <main className="flex-1 relative z-0">
        <MapContainer
          bounds={LEBANON_BOUNDS}
          minZoom={8}
          maxBounds={LEBANON_BOUNDS}
          maxBoundsViscosity={1.0}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          <ModernMapControls />
          <MapController center={mapCenter} />

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={50}
          >
            {/* Post markers */}
            {posts?.map(post => {
              if (!post.publicLat || !post.publicLng) return null;
              const isSelected = post.id === selectedPostId;
              
              let icon = isSelected
                ? (post.postType === 'need' ? icons.selectedNeed : icons.selectedOffer)
                : (post.postType === 'need' ? icons.need : icons.offer);

              if (post.postType === 'offer' && post.providerType === 'ngo') {
                if (isSelected) {
                  icon = post.verifiedBadgeType === 'ngo' ? icons.selectedOfferVerified : icons.selectedOfferUnverified;
                } else {
                  icon = post.verifiedBadgeType === 'ngo' ? icons.offerVerified : icons.offerUnverified;
                }
              }

              return (
                <Marker
                  key={`post-${post.id}`}
                  position={[post.publicLat, post.publicLng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedPostId(post.id);
                      setSelectedItem({ item: post, type: 'post' });
                    }
                  }}
                >
                  <Popup className="leaflet-popup-custom">
                    <div className={`p-2 min-w-[180px] ${isRtl ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${post.postType === 'need' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {t(post.postType)}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          {t(post.category)}
                        </span>
                        {post.urgency && post.postType === 'need' && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${post.urgency === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                            {t(post.urgency)}
                          </span>
                        )}
                        {post.providerType === 'ngo' && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${post.verifiedBadgeType === 'ngo' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {post.verifiedBadgeType === 'ngo' ? `✓ ${t('verified_ngo')}` : `● ${t('unverified_ngo', 'Unverified')}`}
                          </span>
                        )}
                      </div>
                      <strong className="text-sm block mb-1 leading-tight text-foreground">
                        {post.title}
                      </strong>
                      {post.district && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>{post.district ? t(post.district) + "، " : ""}{t(post.governorate)}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mb-2">
                        {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true, locale: dateLocale })}
                      </div>
                      <button
                        onClick={() => openPost(post)}
                        className="w-full text-center py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                      >
                        {t('view_details')}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* NGO markers */}
            {visibleNgos.map(ngo => {
              if (!ngo.lat || !ngo.lng) return null;
              const isVerified = !!ngo.verifiedAt;
              return (
                <Marker
                  key={`ngo-${ngo.id}`}
                  position={[ngo.lat, ngo.lng]}
                  icon={isVerified ? icons.ngo : icons.ngoUnverified}
                  eventHandlers={{ click: () => openNgo(ngo) }}
                >
                  <Popup className="leaflet-popup-custom">
                    <div className={`p-2 min-w-[160px] ${isRtl ? 'text-right' : 'text-left'}`}>
                      <span className={`text-[10px] uppercase font-bold mb-1 block ${
                        isVerified ? 'text-blue-600' : 'text-orange-500'
                      }`}>
                        {isVerified ? `✓ ${t('verified_ngo')}` : `● ${t('unverified_ngo', 'Unverified NGO')}`}
                      </span>
                      <strong className="text-sm block mb-1 leading-tight text-foreground">
                        {ngo.name}
                      </strong>
                      {ngo.governorate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{t(ngo.governorate)}</span>
                        </div>
                      )}
                      <button
                        onClick={() => openNgo(ngo)}
                        className={`w-full text-center py-1.5 rounded-lg text-white text-xs font-semibold ${
                          isVerified ? 'bg-blue-600' : 'bg-orange-500'
                        }`}
                      >
                        {t('view_details')}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-4 py-2 rounded-full shadow-md z-[1000] border border-border text-sm font-medium flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            {t('loading')}
          </div>
        )}

        {/* Map Legend */}
        <div
          className={`absolute bottom-4 sm:bottom-6 ${isRtl ? 'right-4 sm:right-6' : 'left-4 sm:left-6'} z-[400] rounded-xl sm:rounded-2xl transition-all ${legendMinimized ? 'w-10 h-10 flex items-center justify-center p-0 cursor-pointer shadow-md' : 'px-2.5 py-2 sm:px-3.5 sm:py-3 flex flex-col gap-1.5 sm:gap-2'} overflow-hidden cursor-pointer sm:cursor-auto`}
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,255,0.7)',
          }}
          onClick={() => legendMinimized && setLegendMinimized(false)}
        >
          {legendMinimized ? (
            <div className="flex items-center justify-center w-full h-full bg-slate-50 hover:bg-slate-100 transition-colors">
              <MapPin className="w-5 h-5 text-slate-700" aria-hidden="true" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center w-full mb-0.5">
                <span className="font-black text-gray-600 text-[10px] uppercase tracking-widest">{t('map_legend')}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setLegendMinimized(true); }}
                  className="sm:hidden p-1 hover:bg-slate-200/50 rounded-md text-slate-500 transition-colors"
                  aria-label={t("close", "Close")}
                >
                  <Minus className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
              {[
                { color: '#ef4444', label: t('needs') },
                { color: '#10b981', label: t('offers') },
                { color: '#3b82f6', label: t('ngos') },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: color, boxShadow: `0 1px 4px ${color}88` }} />
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-600 leading-none">{label}</span>
                </div>
              ))}
              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60">
                <p className="text-[9px] font-semibold text-slate-500 leading-tight">
                  {t('location_privacy_note')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Speed-dial FAB — bottom corner opposite the legend, higher up to avoid zoom controls */}
        <div className={`absolute bottom-20 sm:bottom-15 ${isRtl ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} z-[400] flex flex-col-reverse items-end gap-2.5`}>
          <button
            onClick={() => setShowFab(prev => !prev)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: showFab
                ? '#1e293b'
                : 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 8px 24px rgba(5,150,105,0.45), 0 2px 8px rgba(0,0,0,0.2)',
              transform: showFab ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
            aria-expanded={showFab}
            aria-label={showFab ? t("close_menu", "Close menu") : t("create_action", "Create action")}
          >
            <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
          </button>

          {/* Expanded options */}
          {showFab && (
            <>
              <button
                onClick={requireAuth(() => setLocation('/offer/new'))}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-all duration-150 whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  boxShadow: '0 6px 16px rgba(5,150,105,0.45)',
                }}
              >
                <HeartHandshake className="w-5 h-5" />
                {t('create_offer', 'Create Offer')}
              </button>
              <button
                onClick={requireAuth(() => setLocation('/need/new'))}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-all duration-150 whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  boxShadow: '0 6px 16px rgba(220,38,38,0.45)',
                }}
              >
                <AlertTriangle className="w-4 h-4" />
                {t('create_need')}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute top-4 sm:top-6 ${isRtl ? 'left-4' : 'right-4'} z-[400] flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-9 sm:h-10 rounded-full font-semibold text-[13px] sm:text-sm transition-all active:scale-95`}
          style={{
            background: showFilters
              ? 'linear-gradient(135deg, #059669, #10b981)'
              : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.08)',
            border: showFilters ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.8)',
            color: showFilters ? 'white' : '#1e293b',
          }}
          aria-expanded={showFilters}
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          {t('filters')}
          {activeFilterCount > 0 && (
            <span className="text-xs rounded-full w-5 h-5 flex items-center justify-center font-black"
              style={{ background: showFilters ? 'rgba(255,255,255,0.25)' : '#059669', color: 'white' }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter & Results Bottom Sheet / Side Panel */}
        {showFilters && (
          <div
            className={`
              absolute z-[500] bg-card border-border shadow-2xl
              bottom-0 left-0 right-0 rounded-t-2xl border-t md:border
              md:bottom-auto md:top-22 md:rounded-2xl md:w-80
              ${isRtl ? 'md:left-4 md:right-auto' : 'md:right-4 md:left-auto'}
              flex flex-col max-h-[85vh] md:max-h-[calc(100vh-6rem)]
            `}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="font-semibold text-foreground">{t('filters')}</h3>
              <div className="flex gap-2 items-center">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {t('clear_filters')}
                  </button>
                )}
                <button
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-black/5 transition-all"
                  onClick={() => setShowFilters(false)}
                  aria-label={t("close", "Close")}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex flex-col">

              {/* Filters section */}
              <div className="p-4 flex flex-col gap-4">

                {/* Post Type */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">{t('post_type')}</label>
                  <div className="flex gap-2">
                    {(['need', 'offer'] as const).map(pt => (
                      <button
                        key={pt}
                        onClick={() => updateStringFilter('postType', filters.postType === pt ? undefined : pt)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${filters.postType === pt
                          ? pt === 'need'
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-green-500 text-white border-green-500'
                          : 'bg-background text-foreground border-border hover:bg-secondary'
                          }`}
                      >
                        {t(pt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">{t('category')}</label>
                  <select
                    value={filters.category ?? ''}
                    onChange={e => updateStringFilter('category', e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('all_categories')}</option>
                    {metadata?.categories.map(cat => (
                      <option key={cat} value={cat}>{t(cat)}</option>
                    ))}
                  </select>
                </div>

                {/* Governorate */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">{t('governorate')}</label>
                  <select
                    value={filters.governorate ?? ''}
                    onChange={e => updateStringFilter('governorate', e.target.value || undefined)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('all_governorates')}</option>
                    {metadata?.governorates.map(gov => (
                      <option key={gov} value={gov}>{t(gov)}</option>
                    ))}
                  </select>
                </div>

                {/* District — only when a governorate with districts is selected */}
                {filters.governorate && availableDistricts.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">{t('district')}</label>
                    <select
                      value={filters.district ?? ''}
                      onChange={e => updateStringFilter('district', e.target.value || undefined)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('all_districts')}</option>
                      {availableDistricts.map(d => (
                        <option key={d} value={d}>{t(d)}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Urgency — hide for offer-only view */}
                {filters.postType !== 'offer' && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">{t('urgency')}</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['critical', 'high', 'medium', 'low'] as const).map(u => (
                        <button
                          key={u}
                          onClick={() => updateStringFilter('urgency', filters.urgency === u ? undefined : u)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${filters.urgency === u
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-secondary'
                            }`}
                        >
                          {t(u)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toggles */}
                <div className="flex flex-col gap-3 pt-2 border-t border-border">
                  {toggleSwitch(!!filters.activeOnly, () => updateBoolFilter('activeOnly', !filters.activeOnly), t('active_only'))}
                  {toggleSwitch(!!filters.verifiedNgoOnly, () => updateBoolFilter('verifiedNgoOnly', !filters.verifiedNgoOnly), t('verified_ngo_only'))}
                </div>
              </div>

              {/* Results list */}
              <div className="border-t border-border">

                {/* Results header */}
                <div className="px-4 py-2 bg-secondary/30 flex items-center justify-between shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {isLoading
                      ? t('loading')
                      : isError
                        ? t('error') || "Error loading results"
                        : t('results_count', { count: totalResults })
                    }
                  </span>
                </div>

                {/* Loading skeleton */}
                {isLoading && (
                  <div className="flex flex-col divide-y divide-border">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-muted animate-pulse mt-1.5 shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5">
                          <div className="h-3.5 bg-muted animate-pulse rounded w-3/4" />
                          <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error state */}
                {!isLoading && isError && (
                  <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-500/50" />
                    <p className="text-sm font-medium text-red-600">Failed to load data</p>
                    <p className="text-xs text-red-600/70">Please check your connection and try again.</p>
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && !isError && !hasResults && (
                  <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                    <SearchX className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">{t('no_results')}</p>
                    <p className="text-xs text-muted-foreground/70">{t('no_results_hint')}</p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-xs text-primary font-medium underline"
                      >
                        {t('clear_filters')}
                      </button>
                    )}
                  </div>
                )}

                {/* Results */}
                {!isLoading && !isError && hasResults && (
                  <div className="flex flex-col divide-y divide-border max-h-52 overflow-y-auto">
                    {visibleNgos.map(ngo => {
                      const isVerified = !!ngo.verifiedAt;
                      return (
                      <button
                        key={`list-ngo-${ngo.id}`}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 text-start transition-colors ${(selectedItem?.type === 'ngo' && selectedItem.item.id === ngo.id) ? 'bg-secondary/60' : ''
                          }`}
                        onClick={() => {
                          openNgo(ngo);
                          setShowFilters(false);
                        }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${isVerified ? 'bg-blue-600' : 'bg-orange-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ngo.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t(ngo.governorate)}{ngo.district ? ` • ${t(ngo.district)}` : ''}
                            {" • "}{isVerified ? t('verified_ngo') : t('unverified_ngo', 'Unverified')}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                      );
                    })}
                    {posts?.map(post => (
                      <button
                        key={post.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 text-start transition-colors ${post.id === selectedPostId ? 'bg-secondary/60' : ''
                          }`}
                        onClick={() => {
                          openPost(post, true);
                          setShowFilters(false);
                        }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${post.postType === 'need' ? 'bg-red-500' : 'bg-green-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t(post.governorate)}{post.district ? ` • ${t(post.district)}` : ''}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <PostDetailsModal
        isOpen={!!selectedItem}
        onClose={closeModal}
        item={selectedItem?.item ?? null}
        type={selectedItem?.type ?? 'post'}
        onViewNgo={(ngoId) => {
          const ngo = ngos?.find(n => n.id === ngoId);
          if (ngo) {
            openNgo(ngo);
          }
        }}
      />
    </div>
  );
}
