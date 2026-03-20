import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { useListPosts, useListNgos, useGetMetadata } from "@workspace/api-client-react";
import type { ListPostsParams, PostPublic, Ngo } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { PostDetailsModal } from "@/components/map/PostDetailsModal";
import { Button } from "@/components/ui/button";
import { Filter, X, MapPin, ChevronRight, SearchX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

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
  ngo: makeIcon('marker-ngo', SHIELD_SVG),
  selectedNeed: makeIcon('marker-need marker-selected', '', 32),
  selectedOffer: makeIcon('marker-offer marker-selected', '', 32),
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

// ─── Types ──────────────────────────────────────────────────────────────────

type SelectedItem = { item: PostPublic; type: 'post' } | { item: Ngo; type: 'ngo' };

// ─── Page ───────────────────────────────────────────────────────────────────

export default function MapPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const dateLocale = isRtl ? ar : enUS;

  const [filters, setFilters] = useState<ListPostsParams>({ activeOnly: true });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const { data: posts, isLoading: isLoadingPosts } = useListPosts(filters);
  const { data: ngos, isLoading: isLoadingNgos } = useListNgos(
    filters.governorate ? { governorate: filters.governorate } : undefined
  );
  const { data: metadata } = useGetMetadata();

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
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );

  // ── Loading / empty states ──────────────────────────────────────────────

  const isLoading = isLoadingPosts || isLoadingNgos;
  const hasResults = (posts?.length ?? 0) > 0;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
      <TopNav title={t('view_map')} showBack />

      <main className="flex-1 relative z-0 mt-16">
        <MapContainer
          center={[33.8547, 35.8623]}
          zoom={8}
          className="w-full h-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          <ZoomControl position={isRtl ? "bottomleft" : "bottomright"} />
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
              const icon = isSelected
                ? (post.postType === 'need' ? icons.selectedNeed : icons.selectedOffer)
                : (post.postType === 'need' ? icons.need : icons.offer);

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
                      </div>
                      <strong className="text-sm block mb-1 leading-tight text-foreground">
                        {post.title}
                      </strong>
                      {post.district && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>{post.district}، {post.governorate}</span>
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
            {(!filters.postType || filters.verifiedNgoOnly) && ngos?.map(ngo => {
              if (!ngo.lat || !ngo.lng) return null;
              return (
                <Marker
                  key={`ngo-${ngo.id}`}
                  position={[ngo.lat, ngo.lng]}
                  icon={icons.ngo}
                  eventHandlers={{ click: () => openNgo(ngo) }}
                >
                  <Popup className="leaflet-popup-custom">
                    <div className={`p-2 min-w-[160px] ${isRtl ? 'text-right' : 'text-left'}`}>
                      <span className="text-[10px] uppercase font-bold text-blue-600 mb-1 block">
                        ✓ {t('verified_ngo')}
                      </span>
                      <strong className="text-sm block mb-1 leading-tight text-foreground">
                        {ngo.name}
                      </strong>
                      {ngo.governorate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{ngo.governorate}</span>
                        </div>
                      )}
                      <button
                        onClick={() => openNgo(ngo)}
                        className="w-full text-center py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
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
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-4 py-2 rounded-full shadow-md z-[1000] border border-border text-sm font-medium flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            {t('loading')}
          </div>
        )}

        {/* Map Legend */}
        <div className={`absolute bottom-6 ${isRtl ? 'right-6' : 'left-6'} bg-card/95 backdrop-blur border border-border p-3 rounded-xl shadow-lg z-[400] flex flex-col gap-2 text-sm`}>
          <div className="font-semibold text-foreground mb-1 text-xs uppercase tracking-wide">{t('map_legend')}</div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white shadow-sm" /><span className="text-xs">{t('needs')}</span></div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-green-500 border border-white shadow-sm" /><span className="text-xs">{t('offers')}</span></div>
          <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white shadow-sm" /><span className="text-xs">{t('ngos')}</span></div>
        </div>

        {/* Filter Toggle Button */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-[400] rounded-full shadow-lg bg-card text-foreground border border-border hover:bg-secondary gap-2`}
          size="sm"
        >
          <Filter className="w-4 h-4" />
          {t('filters')}
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Filter & Results Bottom Sheet / Side Panel */}
        {showFilters && (
          <div
            className={`
              absolute z-[500] bg-card border-border shadow-2xl
              bottom-0 left-0 right-0 rounded-t-2xl border-t md:border
              md:bottom-auto md:top-16 md:rounded-2xl md:w-80
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
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
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                          filters.postType === pt
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
                      <option key={gov} value={gov}>{gov}</option>
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
                        <option key={d} value={d}>{d}</option>
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
                          className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                            filters.urgency === u
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
                      : t('results_count', { count: posts?.length ?? 0 })
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

                {/* Empty state */}
                {!isLoading && !hasResults && (
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
                {!isLoading && hasResults && (
                  <div className="flex flex-col divide-y divide-border max-h-52 overflow-y-auto">
                    {posts!.map(post => (
                      <button
                        key={post.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 text-start transition-colors ${
                          post.id === selectedPostId ? 'bg-secondary/60' : ''
                        }`}
                        onClick={() => {
                          openPost(post, true);
                          setShowFilters(false);
                        }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${post.postType === 'need' ? 'bg-red-500' : 'bg-green-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.governorate}{post.district ? ` • ${post.district}` : ''}
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
      />
    </div>
  );
}
