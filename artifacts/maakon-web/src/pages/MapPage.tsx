import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TopNav } from "@/components/layout/TopNav";
import { useListPosts, useListNgos, useGetMetadata } from "@workspace/api-client-react";
import type { ListPostsParams } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { PostDetailsModal } from "@/components/map/PostDetailsModal";
import { Button } from "@/components/ui/button";
import { Filter, Layers, List } from "lucide-react";
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

const createClusterCustomIcon = function (cluster: any) {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: 'marker-cluster',
    iconSize: L.point(40, 40, true),
  });
};

export default function MapPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const dateLocale = isRtl ? ar : enUS;

  // Filters state
  const [filters, setFilters] = useState<ListPostsParams>({
    activeOnly: true
  });
  const [showFilters, setShowFilters] = useState(false);

  // Data fetching
  const { data: posts, isLoading: isLoadingPosts } = useListPosts(filters);
  const { data: ngos, isLoading: isLoadingNgos } = useListNgos(filters.governorate ? { governorate: filters.governorate } : undefined);
  const { data: metadata } = useGetMetadata();

  // Selection state
  const [selectedItem, setSelectedItem] = useState<{item: any, type: 'post'|'ngo'} | null>(null);

  // Fix leaflet map missing tiles issue on mount
  useEffect(() => {
    // Trigger window resize event after 100ms to force leaflet to recalculate size
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkerClick = (item: any, type: 'post'|'ngo') => {
    setSelectedItem({ item, type });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
      <TopNav title={t('view_map')} showBack />

      {/* Main Map Area */}
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
            {/* Render Posts */}
            {posts?.map(post => {
              if (!post.publicLat || !post.publicLng) return null;
              return (
                <Marker 
                  key={`post-${post.id}`}
                  position={[post.publicLat, post.publicLng]}
                  icon={post.postType === 'need' ? icons.need : icons.offer}
                  eventHandlers={{ click: () => handleMarkerClick(post, 'post') }}
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

            {/* Render NGOs */}
            {(!filters.postType || filters.verifiedNgoOnly) && ngos?.map(ngo => {
              if (!ngo.lat || !ngo.lng) return null;
              return (
                <Marker 
                  key={`ngo-${ngo.id}`}
                  position={[ngo.lat, ngo.lng]}
                  icon={icons.ngo}
                  eventHandlers={{ click: () => handleMarkerClick(ngo, 'ngo') }}
                >
                  <Popup>
                    <div className={`p-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      <span className="text-xs uppercase font-bold text-info mb-1 block">
                        {t('verified')} NGO
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

        {/* Legend */}
        <div className={`absolute bottom-6 ${isRtl ? 'right-6' : 'left-6'} bg-card/95 backdrop-blur border border-border p-3 rounded-xl shadow-lg z-[400] flex flex-col gap-2 text-sm`}>
          <div className="font-semibold text-foreground mb-1">{t('map_legend')}</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-destructive border border-white shadow-sm" />
            <span>{t('needs')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success border border-white shadow-sm" />
            <span>{t('offers')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-info border border-white shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-sm" />
            </div>
            <span>{t('ngos')}</span>
          </div>
        </div>

        {/* Filter Toggle Button (Mobile) */}
        <Button 
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-[400] rounded-full shadow-lg hover-elevate bg-card text-foreground border-2 border-border hover:bg-secondary`}
          size="icon"
        >
          <Filter className="w-5 h-5" />
        </Button>
      </main>

      {/* Item Details Modal */}
      <PostDetailsModal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        item={selectedItem?.item} 
        type={selectedItem?.type || 'post'} 
      />

    </div>
  );
}
