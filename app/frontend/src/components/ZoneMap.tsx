import L from 'leaflet'
import { useEffect, useMemo, type ReactNode } from 'react'
import { CircleMarker, GeoJSON, LayersControl, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Sensor, Zone } from '../api'
import { fmt, useApp } from '../state'

export interface Marker { key: string; lat: number; lon: number; color: string; r?: number; label?: string; popup?: ReactNode; onClick?: () => void; ring?: boolean }

function Fit({ zone }: { zone: Zone | null }) {
  const map = useMap()
  useEffect(() => {
    if (!zone) return
    const b = L.geoJSON(zone.boundary as GeoJSON.Feature).getBounds()
    if (b.isValid()) map.fitBounds(b, { padding: [16, 16] })
  }, [zone, map])
  return null
}

export function FlyTo({ lat, lon, zoom = 17 }: { lat: number | null; lon: number | null; zoom?: number }) {
  const map = useMap()
  useEffect(() => { if (lat !== null && lon !== null) map.flyTo([lat, lon], zoom, { duration: 0.6 }) }, [lat, lon, zoom, map])
  return null
}

const POI_ICON: Record<string, string> = { school: '#5B2AA6', hospital: '#B42318', place_of_worship: '#1E7F4F', fuel: '#9A6200', pharmacy: '#B42318' }

export default function ZoneMap({ markers = [], size = '', showSensors = true, showPois = true, sensors = [], selected = null, fit = true, children }:
  { fit?: boolean; markers?: Marker[]; size?: '' | 'tall' | 'short'; showSensors?: boolean; showPois?: boolean; sensors?: Sensor[]
    selected?: { lat: number; lon: number } | null; children?: ReactNode }) {
  const { zone, t, live } = useApp()
  // a wider click radius on the canvas renderer, so small building dots can be tapped on a phone
  const renderer = useMemo(() => L.canvas({ tolerance: 7 }), [])
  return (
    <div className={'map ' + size}>
      <MapContainer center={[42.862, 20.925]} zoom={14} renderer={renderer} style={{ height: '100%' }} scrollWheelZoom>
        {fit && <Fit zone={zone} />}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name={t('Harta (OSM)', 'Map (OSM)')}>
            <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={t('Satelit (Esri)', 'Satellite (Esri)')}>
            <TileLayer attribution="Esri, Maxar" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name={t('Topografi (OpenTopoMap)', 'Topography (OpenTopoMap)')}>
            <TileLayer attribution="© OpenTopoMap" url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" maxZoom={17} />
          </LayersControl.BaseLayer>
        </LayersControl>
        {zone && zone.neighbours.map((f, k) => (
          <GeoJSON key={'n' + k} data={f} style={{ color: '#6B7F8C', weight: 1, dashArray: '4 4', fillOpacity: 0 }}>
            <Tooltip sticky>{String((f.properties as { name?: string })?.name ?? '')}</Tooltip>
          </GeoJSON>
        ))}
        {zone && <GeoJSON key="zone" data={zone.boundary} style={{ color: '#102A3A', weight: 2.5, fillColor: '#1D6FA5', fillOpacity: 0.04 }} />}
        {markers.map(m => (
          <CircleMarker key={m.key} center={[m.lat, m.lon]} radius={m.r ?? 3.5}
            pathOptions={{ color: m.ring ? '#102A3A' : m.color, weight: m.ring ? 2 : 0.6, fillColor: m.color, fillOpacity: 0.85 }}
            eventHandlers={m.onClick ? { click: m.onClick } : undefined}>
            {m.label && <Tooltip>{m.label}</Tooltip>}
            {m.popup && <Popup>{m.popup}</Popup>}
          </CircleMarker>
        ))}
        {showPois && zone?.pois.map(p => (
          <CircleMarker key={p.name} center={[p.lat, p.lon]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: POI_ICON[p.kind] ?? '#3D5566', fillOpacity: 1 }}>
            <Tooltip>{p.name}</Tooltip>
          </CircleMarker>
        ))}
        {showSensors && sensors.filter(s => s.lat !== null).map(s => (
          <CircleMarker key={s.id} center={[s.lat!, s.lon!]} radius={9} pathOptions={{ color: '#102A3A', weight: 3, fillColor: '#FFFFFF', fillOpacity: 1 }}>
            <Tooltip permanent direction="right" offset={[10, 0]}>{s.id.replace('DMA01-', '')}</Tooltip>
            <Popup><b>{s.id}</b><br />{t(s.sq, s.en)}<br />{t('Kuota', 'Elevation')} {s.elev} m
              {live?.values[s.id] !== undefined && <><br />{t('Tani', 'Now')}: <b>{fmt(live.values[s.id], 2)} {s.unit}</b> ({live.ts.slice(11)})</>}</Popup>
          </CircleMarker>
        ))}
        {selected && <CircleMarker center={[selected.lat, selected.lon]} radius={13} interactive={false}
          pathOptions={{ color: '#102A3A', weight: 3, fillOpacity: 0, dashArray: '3 3' }} />}
        {children}
      </MapContainer>
    </div>
  )
}
