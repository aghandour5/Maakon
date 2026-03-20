import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { useListPosts, useListNgos, useGetMetadata } from "@workspace/api-client-react";
import type { ListPostsParams, PostPublic, Ngo } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { PostDetailsModal } from "@/components/map/PostDetailsModal";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

// Custom icon generators
const createDivIcon = (className: string, innerHtml: string = '') => {
  return L.divIcon({
    className: `custom-marker ${className}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    html: innerHtml
  });
};

const icons = {
  need: createDivIcon('marker-need'),
  offer: createDivIcon('marker-offer'),
  ngo: createDivIcon('marker-ngo', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>')
};

const createClusterCustomIcon = (cluster: Parameters<NonNullable<Parameters<typeof MarkerClusterGroup>[0]['iconCreateFunction']>>[0]) => {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: 'marker-cluster',
    iconSize: L.point(40, 40, true),
  });
};

type SelectedItem =
  | { item: PostPublic; type: 'post' }
  | { item: Ngo; type: 'ngo' };

export default function MapPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const dateLocale = isRtl ? ar : enUS;

  const [filters, setFilters] = useState<ListPostsParams>({ activeOnly: true });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  const { data: posts, isLoading: isLoadingPosts } = useListPosts(filters);
  const { data: ngos, isLoading: isLoadingNgos } = useListNgos(
    filters.governorate ? { governorate: filters.governorate } : undefined
  );
  const { data: metadata } = useGetMetadata();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handlePostMarkerClick = (post: PostPublic) => {
    setSelectedItem({ item: post, type: 'post' });
  };

  const handleNgoMarkerClick = (ngo: Ngo) => {
    setSelectedItem({ item: ngo, type: 'ngo' });
  };

  const updateFilter = (key: keyof ListPostsParams, value: string | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ activeOnly: true });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'activeOnly' && v !== undefined && v !== false
  ).length;

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

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={50}
          >
            {posts?.map(post => {
              if (!post.publicLat || !post.publicLng) return null;
              return (
                <Marker
                  key={`post-${post.id}`}
                  position={[post.publicLat, post.publicLng]}
                  icon={post.postType === 'need' ? icons.need : icons.offer}
                  eventHandlers={{ click: () => handlePostMarkerClick(post) }}
                >
                  <Popup>
                    <div className={`p-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <span className="text-xs uppercase font-bold text-muted-foreground mb-1 block">
                        {t(post.postType)} • {t(post.category)}
                      </span>
                      <strong className="text-sm block mb-1 leading-tight">{post.title}</strong>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true, locale: dateLocale })}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {(!filters.postType || filters.verifiedNgoOnly) && ngos?.map(ngo => {
              if (!ngo.lat || !ngo.lng) return null;
              return (
                <Marker
                  key={`ngo-${ngo.id}`}
                  position={[ngo.lat, ngo.lng]}
                  icon={icons.ngo}
                  eventHandlers={{ click: () => handleNgoMarkerClick(ngo) }}
                >
                  <Popup>
                    <div className={`p-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <span className="text-xs uppercase font-bold text-blue-600 mb-1 block">
                        ✓ {t('verified')} NGO
                      </span>
                      <strong className="text-sm block mb-1 leading-tight">{ngo.name}</strong>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Loading Overlay */}
        {(isLoadingPosts || isLoadingNgos) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-4 py-2 rounded-full shadow-md z-[1000] border border-border text-sm font-medium">
            جاري التحميل... / Loading...
          </div>
        )}

        {/* Map Legend */}
        <div className={`absolute bottom-6 ${isRtl ? 'right-6' : 'left-6'} bg-card/95 backdrop-blur border border-border p-3 rounded-xl shadow-lg z-[400] flex flex-col gap-2 text-sm`}>
          <div className="font-semibold text-foreground mb-1">{t('map_legend')}</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border border-white shadow-sm" />
            <span>{t('needs')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border border-white shadow-sm" />
            <span>{t('offers')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border border-white shadow-sm" />
            <span>{t('ngos')}</span>
          </div>
        </div>

        {/* Filter Toggle Button */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-[400] rounded-full shadow-lg bg-card text-foreground border border-border hover:bg-secondary gap-2`}
          size="sm"
        >
          <Filter className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* Filter Panel — Bottom Sheet (mobile) / Side Panel (desktop) */}
        {showFilters && (
          <div
            className={`
              absolute z-[500] bg-card border-border shadow-2xl
              bottom-0 left-0 right-0 rounded-t-2xl border-t md:border
              md:bottom-auto md:top-16 md:rounded-2xl md:w-80
              ${isRtl ? 'md:left-4 md:right-auto' : 'md:right-4 md:left-auto'}
              flex flex-col max-h-[80vh] md:max-h-[calc(100vh-6rem)]
            `}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{t('filters')}</h3>
              <div className="flex gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {t('clear_filters')}
                  </button>
                )}
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShowFilters(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable filter body */}
            <div className="overflow-y-auto p-4 flex flex-col gap-4">

              {/* Post Type */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">{t('post_type')}</label>
                <div className="flex gap-2">
                  {(['need', 'offer'] as const).map(pt => (
                    <button
                      key={pt}
                      onClick={() => updateFilter('postType', filters.postType === pt ? undefined : pt)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        filters.postType === pt
                          ? pt === 'need' ? 'bg-red-500 text-white border-red-500' : 'bg-green-500 text-white border-green-500'
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
                  onChange={e => updateFilter('category', e.target.value || undefined)}
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
                  onChange={e => updateFilter('governorate', e.target.value || undefined)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t('all_governorates')}</option>
                  {metadata?.governorates.map(gov => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>

              {/* Urgency (only when postType is need or unset) */}
              {filters.postType !== 'offer' && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">{t('urgency')}</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['critical', 'high', 'medium', 'low'] as const).map(u => (
                      <button
                        key={u}
                        onClick={() => updateFilter('urgency', filters.urgency === u ? undefined : u)}
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
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => updateFilter('activeOnly', !filters.activeOnly)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center ${filters.activeOnly ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${filters.activeOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-foreground">{t('active_only')}</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => updateFilter('verifiedNgoOnly', !filters.verifiedNgoOnly)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center ${filters.verifiedNgoOnly ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${filters.verifiedNgoOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-foreground">{t('verified_ngo_only')}</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      <PostDetailsModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem?.item ?? null}
        type={selectedItem?.type ?? 'post'}
      />
    </div>
  );
}
