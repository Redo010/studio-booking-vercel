import { useRouter } from 'next/router';

const AMENITY_LABELS = {
  daylight: 'Daylight',
  cyc_wall: 'Cyc Wall',
  kitchen_set: 'Kitchen Set',
  blackout: 'Blackout',
  parking: 'Parking',
  truck_access: 'Truck Access',
  makeup_room: 'Makeup Room',
  changing_rooms: 'Changing Rooms',
};

export default function StudioCard({ studio, searchParams, rank }) {
  const router = useRouter();
  const { availability, amenities, images } = studio;
  
  const statusClass = {
    AVAILABLE: 'badge-available',
    PARTIAL: 'badge-partial',
    BOOKED: 'badge-booked',
    UNKNOWN: 'badge-partial',
  }[availability?.status || 'UNKNOWN'];

  const heroImage = images?.[0] || 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80';

  const handleBook = () => {
    const params = new URLSearchParams();
    if (searchParams?.date) params.set('date', searchParams.date);
    if (searchParams?.start_hour) params.set('start', searchParams.start_hour);
    if (searchParams?.end_hour) params.set('end', searchParams.end_hour);
    router.push(`/studios/${studio.slug}?${params.toString()}`);
  };

  // Which amenities to highlight (show matched ones first)
  const highlightAmenities = Object.entries(amenities || {})
    .filter(([, v]) => v)
    .slice(0, 4);

  const isBooked = availability?.status === 'BOOKED';

  return (
    <div 
      className={`studio-card ${isBooked ? 'opacity-50' : ''}`}
      onClick={!isBooked ? handleBook : undefined}
      style={{ animationDelay: `${rank * 80}ms` }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-obsidian-800">
        <img 
          src={heroImage} 
          alt={studio.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/80 via-transparent to-transparent" />
        
        {/* Rank badge */}
        {rank === 0 && availability?.status === 'AVAILABLE' && (
          <div className="absolute top-3 left-3 bg-sand-500 text-obsidian-950 text-xs font-mono px-2 py-0.5 tracking-widest uppercase">
            Best Match
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={statusClass}>
            {availability?.status === 'PARTIAL' 
              ? `${availability.availableSlots}h free` 
              : availability?.status || 'Check'}
          </span>
        </div>

        {/* District */}
        <div className="absolute bottom-3 left-3 text-xs font-mono text-obsidian-300 tracking-widest uppercase">
          {studio.district}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-xl text-sand-100 leading-tight">{studio.name}</h3>
            <p className="text-xs text-obsidian-400 mt-0.5 font-mono">
              {studio.size_category.toUpperCase()} · {studio.sqft.toLocaleString()} sqft
            </p>
          </div>
          <div className="text-right">
            <div className="price-display text-lg">
              AED {studio.hourly_price.toLocaleString()}
            </div>
            <div className="text-xs text-obsidian-500">/hour</div>
          </div>
        </div>

        {/* Amenity tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {highlightAmenities.map(([key]) => (
            <span 
              key={key}
              className="text-xs bg-obsidian-800 border border-obsidian-700 text-obsidian-300 px-2 py-0.5 font-mono"
            >
              {AMENITY_LABELS[key] || key}
            </span>
          ))}
        </div>

        {/* Day pricing */}
        {studio.full_day_price && (
          <div className="text-xs text-obsidian-500 mb-4 font-mono border-t border-obsidian-800 pt-3">
            Half Day AED {studio.half_day_price?.toLocaleString()} · Full Day AED {studio.full_day_price?.toLocaleString()}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); if (!isBooked) handleBook(); }}
          disabled={isBooked}
          className={`w-full py-2.5 text-sm font-medium tracking-wide transition-all duration-200 ${
            isBooked 
              ? 'bg-obsidian-700 text-obsidian-500 cursor-not-allowed' 
              : 'btn-primary'
          }`}
        >
          {isBooked ? 'Fully Booked' : 'View & Book →'}
        </button>
      </div>
    </div>
  );
}
