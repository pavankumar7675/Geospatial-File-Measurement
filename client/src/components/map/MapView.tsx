import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { FeatureMeasurement } from '../../api/types';
import L from 'leaflet';

interface MapViewProps {
  features: FeatureMeasurement[];
  selectedFeatureId?: string | number | null;
  onSelectFeature?: (id: string | number) => void;
}

function FitToFeatures({ geojson }: { geojson: object }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.geoJSON(geojson as any).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16 });
  }, [geojson, map]);

  return null;
}

export function MapView({ features, selectedFeatureId, onSelectFeature }: MapViewProps) {
  const geojson = {
    type: 'FeatureCollection',
    features: features
      .filter((f) => f.geometry != null)
      .map((f) => ({
        type: 'Feature',
        geometry: f.geometry,
        properties: { ...f.properties, id: f.feature_id, measurement: f.measurement },
      })),
  };

  return (
    <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToFeatures geojson={geojson} />
      {geojson.features.length > 0 && (
        <GeoJSON
          key={String(selectedFeatureId)}
          data={geojson as any} 
          style={(feature) => ({
            color: feature?.properties?.id === selectedFeatureId ? '#bf5d32' : '#405942',
            weight: feature?.properties?.id === selectedFeatureId ? 4 : 2,
            fillColor: feature?.properties?.id === selectedFeatureId ? '#e17c4d' : '#8da68b',
            fillOpacity: feature?.properties?.id === selectedFeatureId ? 0.55 : 0.32,
          })}
          onEachFeature={(feature, layer) => {
            const id = feature.properties.id as string | number;
            let popupContent = `<b>ID:</b> ${id}<br/>`;
            const m = feature.properties.measurement;
            if (m.kind !== 'none' && m.kind !== 'unsupported') {
              popupContent += `<b>${m.kind}:</b> ${m.value?.toFixed(2)} ${m.unit}`;
            }
            layer.bindPopup(popupContent);
            layer.on('click', () => onSelectFeature?.(id));
          }}
        />
      )}
    </MapContainer>
  );
}
