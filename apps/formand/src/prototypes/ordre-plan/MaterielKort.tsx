/**
 * PROTOTYPE — Interaktivt Leaflet-kort til materiel-koordinat-markering.
 *
 * Formanden klikker på kortet for at sætte/flytte en pin. Koordinater (lat/lng)
 * gemmes på MaterielTransportPlan og flyder til chauffør-webappen som Google Maps-link.
 *
 * Kanonisk brug: Flow 2 Trin 1 (LÅST 2026-06-25) + Docs/Vognmand/Dataudveksling-vognmand.md
 *
 * TODO: Erstat med Supabase når klar — koordinater persisteres på materiel_transport_plan.
 */

import 'leaflet/dist/leaflet.css'

import { useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'

// ─── Leaflet marker-ikon fix ──────────────────────────────────────────────────
// Leaflet's default marker-ikoner bryder under Vite fordi bundleren ikke
// resolver de relativt-importerede PNG-filer i leaflet/dist/images/ korrekt.
// Fix: sæt ikonerne eksplicit via import-URL så Vite håndterer dem som assets.
import markerIconPng from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xPng from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIcon2xPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// ─── Koordinat-klik-lytter (intern) ──────────────────────────────────────────

interface KortKlikLytterProps {
  onChange: (k: { lat: number; lng: number }) => void
}

/** Lytter på klik i kortets map-container og kalder onChange med nye koordinater. */
function KortKlikLytter({ onChange }: KortKlikLytterProps) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// ─── Props-interface ──────────────────────────────────────────────────────────

export interface MaterielKortProps {
  /**
   * Menneskelæsbar label for lokationstypen, fx "afhentningssted" eller "aflæsningssted".
   * Bruges i hjælpeteksten og Google Maps-linket.
   */
  label: string
  /** Aktuel koordinat — undefined hvis endnu ikke markeret. */
  koordinat?: { lat: number; lng: number }
  /** Kaldes med nye koordinater ved klik eller drag-end på markøren. */
  onChange: (k: { lat: number; lng: number }) => void
}

// DK-center (Sjælland): fornuftigt default-udgangspunkt for danske anlæg
const DK_CENTER: [number, number] = [55.6, 11.6]
const DEFAULT_ZOOM = 13

// ─── Komponent ────────────────────────────────────────────────────────────────

/**
 * Interaktivt Leaflet-kort med klikbar og draggable markør.
 * Bruges i TransportForm til at sætte koordinater for afhentning og aflæsning.
 *
 * Kortet har en fast højde på 240px — bevidst fixed størrelse (jf. CLAUDE.md:
 * "w-[Npx]/h-[Npx] kun til bevidste fixed komponenter"). Al anden styling bruger tokens.
 */
export function MaterielKort({ label, koordinat, onChange }: MaterielKortProps) {
  const markerRef = useRef<L.Marker | null>(null)

  const center: [number, number] = koordinat
    ? [koordinat.lat, koordinat.lng]
    : DK_CENTER

  // Afrundede koordinater til visning (5 decimaler ≈ 1m præcision)
  const latVis = koordinat ? koordinat.lat.toFixed(5) : null
  const lngVis = koordinat ? koordinat.lng.toFixed(5) : null

  const mapsUrl = koordinat
    ? `https://www.google.com/maps/search/?api=1&query=${koordinat.lat},${koordinat.lng}`
    : null

  return (
    <div className="flex flex-col gap-xxxs">
      {/* Kortet — h-[240px] er bevidst fixed (kortcontainer, ikke layout-wrapper) */}
      <div className="rounded-lg overflow-hidden border border-hairline h-[240px]">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          // Når koordinat opdateres udefra gentegnes kortet ikke automatisk.
          // key-prop tvinger remount ved skift af koordinat-tilstand (sat/usat).
          key={koordinat ? 'has-koordinat' : 'no-koordinat'}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="grayscale"
          />
          <KortKlikLytter onChange={onChange} />
          {koordinat && (
            <Marker
              position={[koordinat.lat, koordinat.lng]}
              icon={defaultIcon}
              draggable
              ref={markerRef}
              eventHandlers={{
                dragend() {
                  const m = markerRef.current
                  if (m) {
                    const pos = m.getLatLng()
                    onChange({ lat: pos.lat, lng: pos.lng })
                  }
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Under-kortet: koordinat-info eller hjælpetekst */}
      {koordinat ? (
        <div className="flex items-center justify-between gap-xs">
          <span className="font-inter text-xxs text-text-muted tabular-nums">
            {latVis}, {lngVis}
          </span>
          <a
            href={mapsUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="font-inter text-xxs font-semibold text-dark-teal underline underline-offset-2 hover:opacity-75 transition-opacity"
          >
            Åbn i Google Maps
          </a>
        </div>
      ) : (
        <p className="font-inter text-xxs text-text-muted">
          Klik på kortet for at markere {label}
        </p>
      )}
    </div>
  )
}

export default MaterielKort
