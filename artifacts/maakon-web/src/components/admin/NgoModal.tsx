import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGetMetadata } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import type { AdminNgo } from "@/pages/AdminPage";
import { Loader2, LocateFixed } from "lucide-react";

const SHIELD_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
const ngoIcon = L.divIcon({
  className: "custom-marker marker-ngo",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
  html: SHIELD_SVG,
});

function LocationPicker({ position, setPosition }: { position: [number, number] | null; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} icon={ngoIcon} /> : null;
}

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 0.8 });
  }, [center, map]);
  return null;
}

export function NgoModal({
  open,
  onOpenChange,
  ngo,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ngo?: AdminNgo | null;
  onSave: (data: any) => Promise<void>;
}) {
  const { data: meta } = useGetMetadata();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("active");
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (open) {
      setName(ngo?.name || "");
      setDescription(ngo?.description || "");
      setGovernorate(ngo?.governorate || "");
      setDistrict(ngo?.district || "");
      setPhone(ngo?.phone || "");
      setWebsite(ngo?.website || "");
      setStatus(ngo?.status || "active");
      setPosition(ngo?.lat && ngo?.lng ? [ngo.lat, ngo.lng] : null);
    }
  }, [open, ngo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        name,
        description: description || null,
        governorate,
        district: district || null,
        phone: phone || null,
        website: website || null,
        status,
        ...(position ? { lat: position[0], lng: position[1] } : { lat: null, lng: null }),
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const governorateOpts = meta?.governorates ?? [];
  const districtOpts = governorate && meta?.districts ? (meta.districts[governorate] ?? []) : [];
  const lebanonCenter: [number, number] = [33.8547, 35.8623];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ngo ? "Edit NGO" : "Create NGO"}</DialogTitle>
          <DialogDescription>
            {ngo ? "Update the organization's details and map pin." : "Manually register a verified organization."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="ngo-name" className="text-sm font-medium">Name *</label>
              <input id="ngo-name" required value={name} onChange={e => setName(e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm" placeholder="NGO Name" />
            </div>

            <div className="space-y-2">
              <label htmlFor="ngo-status" className="text-sm font-medium">Status</label>
              <select id="ngo-status" value={status} onChange={e => setStatus(e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white">
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="ngo-desc" className="text-sm font-medium">Description *</label>
              <textarea id="ngo-desc" required minLength={10} value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-3 rounded-md border border-slate-200 text-sm" placeholder="Brief about the NGO... (min 10 characters)" />
            </div>

            <div className="space-y-2">
              <label htmlFor="ngo-gov" className="text-sm font-medium">Governorate *</label>
              <select id="ngo-gov" required value={governorate} onChange={e => { setGovernorate(e.target.value); setDistrict(""); }} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white">
                <option value="" disabled>Select Governorate...</option>
                {governorateOpts.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="ngo-district" className="text-sm font-medium">District</label>
              <select id="ngo-district" value={district} onChange={e => setDistrict(e.target.value)} disabled={!governorate} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white disabled:bg-slate-50">
                <option value="">Select District (Optional)...</option>
                {districtOpts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="ngo-phone" className="text-sm font-medium">Phone</label>
              <input id="ngo-phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm" placeholder="+961..." />
            </div>

            <div className="space-y-2">
              <label htmlFor="ngo-website" className="text-sm font-medium">Website</label>
              <input id="ngo-website" type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm" placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium">Exact Location (Map Pin)</label>
              <Button type="button" variant="outline" size="sm" onClick={handleLocate} disabled={locating} className="h-8 text-xs">
                {locating ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <LocateFixed className="w-3 h-3 mr-1.5" />}
                Use Current Location
              </Button>
            </div>
            <div className="h-[250px] rounded-lg border border-slate-200 overflow-hidden relative z-0">
              <MapContainer center={position || lebanonCenter} zoom={position ? 14 : 8} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationPicker position={position} setPosition={setPosition} />
                <MapController center={position} />
              </MapContainer>
            </div>
            <p className="text-xs text-slate-500">Click on the map to set or move the organization's location pin.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {ngo ? "Save Changes" : "Create NGO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
