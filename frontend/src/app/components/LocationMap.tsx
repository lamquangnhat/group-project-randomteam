import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapLocation {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
}

function buildIcon(label: string | number) {
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;
      background:#10b981;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.28);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:11px;font-weight:700;
      font-family:system-ui,sans-serif;
      user-select:none;
    ">${label}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
  });
}

function FitBounds({ locations }: { locations: MapLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (!locations.length) return;
    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 14);
    } else {
      const bounds = L.latLngBounds(
        locations.map((l) => [l.latitude, l.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    }
  }, [locations, map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function LocationMap({
  locations,
  className = "",
  style,
}: {
  locations: MapLocation[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const valid = locations.filter((l) => l.latitude && l.longitude);

  if (!valid.length) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400 ${className}`}
        style={style}
      >
        No location data available
      </div>
    );
  }

  const center: [number, number] = [valid[0].latitude, valid[0].longitude];
  const numbered = valid.length > 1;

  return (
    <div className={`overflow-hidden ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
        />
        <FitBounds locations={valid} />
        {valid.map((loc, i) => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={buildIcon(numbered ? i + 1 : "●")}
          >
            <Popup>
              <strong>{loc.name}</strong>
              {loc.category && (
                <>
                  <br />
                  <span style={{ color: "#6b7280", fontSize: "12px" }}>{loc.category}</span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
