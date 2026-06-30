import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { LatLngLiteral } from 'leaflet';

interface DestinationMapPickerProps {
  value: LatLngLiteral | null;
  onChange: (value: LatLngLiteral | null) => void;
}

const UTEC: LatLngLiteral = { lat: -12.1516, lng: -77.0223 };

const MapClickHandler = ({ onChange }: { onChange: (value: LatLngLiteral) => void }) => {
  useMapEvents({
    click: (event) => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
};

export const DestinationMapPicker = ({ value, onChange }: DestinationMapPickerProps) => (
  <div className="destination-picker">
    <div className="destination-map">
      <MapContainer center={value ?? UTEC} zoom={13} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onChange={onChange} />
        <CircleMarker center={UTEC} radius={7} pathOptions={{ color: '#0B1F3A', fillOpacity: 1 }} />
        {value ? <CircleMarker center={value} radius={9} pathOptions={{ color: '#18A8E0', fillOpacity: 0.85 }} /> : null}
      </MapContainer>
    </div>
    <div className="destination-map-footer">
      <span>
        {value
          ? `Destino marcado: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
          : 'Haz clic en el mapa para marcar el punto de destino.'}
      </span>
      {value ? <button type="button" className="btn-link" onClick={() => onChange(null)}>Quitar punto</button> : null}
    </div>
  </div>
);
