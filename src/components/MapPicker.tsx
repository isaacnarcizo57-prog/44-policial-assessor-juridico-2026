import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, X, Check } from 'lucide-react';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  onSelect: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
  initialAddress?: string;
}

const MapPicker: React.FC<MapPickerProps> = ({ onSelect, onClose, initialAddress }) => {
  const [position, setPosition] = useState<[number, number]>([-23.5505, -46.6333]); // São Paulo default
  const [address, setAddress] = useState(initialAddress || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Component to update map center
  const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
  };

  // Component to handle map clicks
  const MapEvents = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        await reverseGeocode(lat, lng);
      },
    });
    return null;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        setAddress(display_name);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <MapPin size={18} />
            </div>
            <h2 className="font-bold text-slate-900">Selecionar Localização</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar rua, bairro ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 shadow-sm"
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {isSearching ? '...' : 'BUSCAR'}
            </button>
          </form>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative min-h-[300px]">
          <MapContainer center={position} zoom={13} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} />
            <ChangeView center={position} />
            <MapEvents />
          </MapContainer>
          
          {/* Address Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white shadow-lg z-[1000]">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Endereço Selecionado</p>
            <p className="text-sm text-slate-900 font-medium line-clamp-2">{address || 'Clique no mapa para selecionar'}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm"
          >
            CANCELAR
          </button>
          <button 
            onClick={() => onSelect(address, position[0], position[1])}
            disabled={!address}
            className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check size={18} /> CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
