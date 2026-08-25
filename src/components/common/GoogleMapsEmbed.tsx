import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface GoogleMapsEmbedProps {
  address?: string;
  city?: string;
  country?: string;
  zoom?: number;
  height?: string;
  className?: string;
}

export const GoogleMapsEmbed: React.FC<GoogleMapsEmbedProps> = ({
  address = '',
  city = 'Paris',
  country = 'France',
  zoom = 14,
  height = '240px',
  className = '',
}) => {
  const fullAddress = [address, city, country].filter(Boolean).join(', ');
  const query = encodeURIComponent(fullAddress || 'Paris, France');
  const embedUrl = `https://maps.google.com/maps?q=${query}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-xs group ${className}`}>
      <iframe
        title={`Google Map - ${fullAddress}`}
        src={embedUrl}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        className="w-full h-full grayscale-[15%] group-hover:grayscale-0 transition-all duration-300"
      />

      {/* Location overlay badge */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-800 truncate">
            {fullAddress || 'Emplacement entreprise'}
          </span>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
        >
          <Navigation className="w-3 h-3" />
          <span>Itinéraire</span>
        </a>
      </div>
    </div>
  );
};
