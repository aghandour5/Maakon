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
import { Filter, X, MapPin, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const createDivIcon = (className: string, innerHtml: string = '') =>
  L.divIcon({ className: `custom-marker ${className}`, iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12], html: innerHtml });

const icons = {
  need: createDivIcon('marker-need'),
  offer: createDivIcon('marker-offer'),
  ngo: createDivIcon('marker-ngo', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>')
};

const createClusterCustomIcon = (cluster: Parameters<NonNullable<Parameters<typeof MarkerClusterGroup>[0]['iconCreateFunction']>>[0]) =>
  L.divIcon({ html: `<span>${cluster.getChildCount()}</span>`, className: 'marker-cluster', iconSize: L.point(40, 40, true) });

type SelectedItem = { item: PostPublic; type: 'post' } | { item: Ngo; type: 'ngo' };

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
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    return () => clearTimeout(timer);
  }, []);

  const updateFilter = (key: keyof ListPostsParams, value: string | boolean | undefined) => {
    if (key === 'governorate') {
      setFilters(prev => ({ ...prev, [key]: value, district: undefined }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const clearFilters = () => setFilters({ activeOnly: true });

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'activeOnly' && v !== undefined && v !== false
  ).length;

  const toggleSwitch = (
    className: string,
    active: boolean,
    onClick: () => void,
    label: string
  ) => (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <div onClick={onClick} className={`w-11 h-6 rounded-full transition-colors flex items-center ${active ? 'bg-primary' : 'bg-muted'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-0.5 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );

  const availableDistricts = filters.governorate ? (metadata?.districts?.[filters.governorate] ?? []) : [];

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
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" maxZoom={19} />
          <ZoomControl position={isRtl ? "bottomleft" : "bottomright"} />

          <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon} maxClusterRadius={50}>
            {posts?.map(post => {
              if (!post.publicLat || !post.publicLng) return null;
              return (
                <Marker
                  key={`post-${post.id}`}
                  position={[post.publicLat, post.publicLng]}
                  icon={post.postType === 'need' ? icons.need : icons.offer}
                  eventHandlers={{ click: () => setSelectedItem({ item: post, type: 'post' }) }}
                >
                  <Popup className="leaflet-popup-custom">
                    <div className={`p-2 min-w-[180px] ${isRtl ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${post.postType === 'need' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {t(post.postType)}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{t(post.category)}</span>
                        {post.urgency && post.postType === 'need' && (
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${post.urgency === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                            {t(post.urgency)}
                          </span>
                        )}
                      </div>
                      <strong className="text-sm block mb-1 leading-tight text-foreground">{post.title}</strong>
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
                        onClick={() => setSelectedItem({ item: post, type: 'post' })}
                        className="w-full text-center py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                      >
                        {t('view_details')}
                      </button>
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
                  eventHandlers={{ click: () => setSelectedItem({ item: ngo, type: 'ngo' }) }}
                >
                  <Popup className="leaflet-popup-custom">
                    <div className={`p-2 min-w-[160px] ${isRtl ? 'text-right' : 'text-left'}`}>
                      <span className="text-[10px] uppercase font-bold text-blue-600 mb-1 block">
                        ✓ {t('verified')} NGO
                      </span>
                      <strong className="text-sm block mb-1 leading-tight text-foreground">{ngo.name}</strong>
                      {ngo.governorate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3" />
                          <span>{ngo.governorate}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedItem({ item: ngo, type: 'ngo' })}
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

        {/* Loading Overlay */}
        {(isLoadingPosts || isLoadingNgos) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-4 py-2 rounded-full shadow-md z-[1000] border border-border text-sm font-medium">
            {t('loading')}
          </div>
        )}

        {/* Map Legend */}
        <div className={`absolute bottom-6 ${isRtl ? 'right-6' : 'left-6'} bg-card/95 backdrop-blur border border-border p-3 rounded-xl shadow-lg z-[400] flex flex-col gap-2 text-sm`}>
          <div className="font-semibold text-foreground mb-1">{t('map_legend')}</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500 border border-white shadow-sm" /><span>{t('needs')}</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 border border-white shadow-sm" /><span>{t('offers')}</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500 border border-white shadow-sm" /><span>{t('ngos')}</span></div>
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
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
                    {t('clear_filters')}
                  </button>
                )}
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShowFilters(false)}>
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
                    {metadata?.categories.map(cat => <option key={cat} value={cat}>{t(cat)}</option>)}
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
                    {metadata?.governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                  </select>
                </div>

                {/* District — only when a governorate is selected and has districts */}
                {filters.governorate && availableDistricts.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">{t('district')}</label>
                    <select
                      value={filters.district ?? ''}
                      onChange={e => updateFilter('district', e.target.value || undefined)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('all_districts')}</option>
                      {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}

                {/* Urgency — only for needs */}
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
                  {toggleSwitch('', !!filters.activeOnly, () => updateFilter('activeOnly', !filters.activeOnly), t('active_only'))}
                  {toggleSwitch('', !!filters.verifiedNgoOnly, () => updateFilter('verifiedNgoOnly', !filters.verifiedNgoOnly), t('verified_ngo_only'))}
                </div>
              </div>

              {/* Results list */}
              {(posts && posts.length > 0) && (
                <div className="border-t border-border">
                  <div className="px-4 py-2 bg-secondary/30 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('results_count', { count: posts.length })}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-border max-h-52 overflow-y-auto">
                    {posts.map(post => (
                      <button
                        key={post.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 text-start transition-colors"
                        onClick={() => {
                          setSelectedItem({ item: post, type: 'post' });
                          setShowFilters(false);
                        }}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${post.postType === 'need' ? 'bg-red-500' : 'bg-green-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                          <p className="text-xs text-muted-foreground">{post.governorate}{post.district ? ` • ${post.district}` : ''}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
