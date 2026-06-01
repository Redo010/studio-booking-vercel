import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import Nav from '../../components/Nav';
import AvailabilityCalendar from '../../components/AvailabilityCalendar';

const AMENITY_LABELS = {
  daylight: { label: 'Natural Daylight', icon: '☀' },
  cyc_wall: { label: 'Cyclorama Wall', icon: '◻' },
  kitchen_set: { label: 'Kitchen Set', icon: '⚏' },
  blackout: { label: 'Full Blackout', icon: '◼' },
  parking: { label: 'Parking', icon: '⊡' },
  truck_access: { label: 'Truck Access', icon: '⊞' },
  ac: { label: 'Air Conditioning', icon: '❄' },
  changing_rooms: { label: 'Changing Rooms', icon: '⊛' },
  wifi: { label: 'High-Speed WiFi', icon: '⊕' },
  makeup_room: { label: 'Makeup Room', icon: '✦' },
};

export default function StudioDetail() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [studio, setStudio] = useState(null);
  const [addons, setAddons] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [pricing, setPricing] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    const startParam = router.query.start;
    const endParam = router.query.end;
    const dateParam = router.query.date;
    
    if (startParam) setSelectedStart(parseInt(startParam));
    if (endParam) setSelectedEnd(parseInt(endParam));

    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const targetDate = dateParam || today;
        
        const res = await fetch(`/api/studios/${slug}?date=${targetDate}`);
        if (!res.ok) throw new Error('Studio not found');
        const data = await res.json();
        
        setStudio(data.studio);
        setAddons(data.addons || []);
        setAvailability(data.availability || {});
        setSelectedDate(dateParam || Object.keys(data.availability || {})[0] || today);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, router.query.date]);

  // Recalculate pricing when selection changes
  useEffect(() => {
    if (!studio || !selectedDate || selectedStart === null || selectedEnd === null) {
      setPricing(null);
      return;
    }
    
    const calculatePricing = async () => {
      setCalcLoading(true);
      try {
        const duration = selectedEnd - selectedStart;
        let basePrice;
        
        if (duration >= 8 && studio.full_day_price) {
          basePrice = studio.full_day_price;
        } else if (duration >= 4 && studio.half_day_price) {
          basePrice = studio.half_day_price;
        } else {
          basePrice = studio.hourly_price * duration;
        }
        
        let addonsPrice = 0;
        let addonDetails = [];
        for (const id of selectedAddons) {
          const addon = addons.find(a => a.id === id);
          if (addon) {
            addonsPrice += addon.price;
            addonDetails.push(addon);
          }
        }
        
        const total = basePrice + addonsPrice;
        setPricing({
          basePrice,
          addonsPrice,
          totalPrice: total,
          depositAmount: Math.round(total * 0.5),
          addonDetails,
          duration,
        });
      } finally {
        setCalcLoading(false);
      }
    };
    
    calculatePricing();
  }, [studio, selectedDate, selectedStart, selectedEnd, selectedAddons, addons]);

  const handleSlotSelect = (start, end) => {
    setSelectedStart(start);
    setSelectedEnd(end);
  };

  const toggleAddon = (id) => {
    setSelectedAddons(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleBookNow = () => {
    if (!selectedDate || selectedStart === null || selectedEnd === null) return;
    
    const params = new URLSearchParams({
      studio: studio.id,
      date: selectedDate,
      start: selectedStart,
      end: selectedEnd,
    });
    if (selectedAddons.length) params.set('addons', selectedAddons.join(','));
    
    router.push(`/checkout?${params.toString()}`);
  };

  const formatHour = (h) => {
    if (h === 12) return '12:00 PM';
    return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  };

  if (loading) return (
    <>
      <Nav />
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-obsidian-600 border-t-sand-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-obsidian-400 text-sm font-mono">Loading studio...</p>
        </div>
      </div>
    </>
  );

  if (error || !studio) return (
    <>
      <Nav />
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center pt-16">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Studio not found'}</p>
          <Link href="/" className="btn-secondary">← Back to search</Link>
        </div>
      </div>
    </>
  );

  const canBook = selectedDate && selectedStart !== null && selectedEnd !== null && selectedEnd > selectedStart;
  const amenityList = Object.entries(studio.amenities || {}).filter(([, v]) => v);

  return (
    <>
      <Head>
        <title>{studio.name} — StudioBook Dubai</title>
        <meta name="description" content={studio.description} />
      </Head>
      
      <Nav />

      <main className="min-h-screen bg-obsidian-950 pt-16">
        {/* Image gallery */}
        <section className="relative h-[50vh] bg-obsidian-900 overflow-hidden">
          <img
            src={studio.images[activeImage]}
            alt={studio.name}
            className="w-full h-full object-cover transition-all duration-500"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/60 to-transparent" />
          
          {/* Thumbnail strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {studio.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-14 h-10 overflow-hidden border-2 transition-all ${
                  activeImage === i ? 'border-sand-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=400&q=60'; }} />
              </button>
            ))}
          </div>

          {/* Back button */}
          <div className="absolute top-6 left-6">
            <Link href="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors bg-obsidian-950/60 px-3 py-1.5 backdrop-blur-sm border border-white/10">
              ← All Studios
            </Link>
          </div>
        </section>

        {/* Content grid */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
            
            {/* Left column */}
            <div className="space-y-10">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="display-heading text-4xl text-sand-50">{studio.name}</h1>
                  <div className="text-right">
                    <div className="price-display text-2xl">AED {studio.hourly_price.toLocaleString()}</div>
                    <div className="text-xs text-obsidian-500">/hour</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm font-mono text-obsidian-400">
                  <span>{studio.location}</span>
                  <span>·</span>
                  <span>{studio.sqft.toLocaleString()} sqft</span>
                  <span>·</span>
                  <span className="capitalize">{studio.size_category}</span>
                </div>
                
                {/* Block pricing */}
                <div className="flex gap-4 mt-4">
                  {studio.half_day_price && (
                    <div className="bg-obsidian-900 border border-obsidian-700 px-4 py-2 text-sm">
                      <div className="text-obsidian-500 text-xs font-mono uppercase tracking-widest">Half Day (4h+)</div>
                      <div className="price-display">AED {studio.half_day_price.toLocaleString()}</div>
                    </div>
                  )}
                  {studio.full_day_price && (
                    <div className="bg-obsidian-900 border border-obsidian-700 px-4 py-2 text-sm">
                      <div className="text-obsidian-500 text-xs font-mono uppercase tracking-widest">Full Day (8h+)</div>
                      <div className="price-display">AED {studio.full_day_price.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="section-label mb-3">About This Studio</div>
                <p className="text-obsidian-300 leading-relaxed">{studio.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <div className="section-label mb-4">Included Amenities</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {amenityList.map(([key]) => (
                    <div key={key} className="flex items-center gap-2.5 bg-obsidian-900 border border-obsidian-700 px-3 py-2">
                      <span className="text-sand-400">{AMENITY_LABELS[key]?.icon || '·'}</span>
                      <span className="text-sm text-obsidian-200">{AMENITY_LABELS[key]?.label || key}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              {addons.length > 0 && (
                <div>
                  <div className="section-label mb-4">Optional Add-ons</div>
                  <div className="space-y-2">
                    {addons.map(addon => (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 border transition-colors text-left ${
                          selectedAddons.includes(addon.id)
                            ? 'bg-sand-500/10 border-sand-500/50 text-sand-200'
                            : 'border-obsidian-700 text-obsidian-300 hover:border-obsidian-500'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium">{addon.name}</div>
                          {addon.description && (
                            <div className="text-xs text-obsidian-500 mt-0.5">{addon.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="price-display text-sm">+AED {addon.price.toLocaleString()}</span>
                          <div className={`w-5 h-5 border flex-shrink-0 flex items-center justify-center transition-colors ${
                            selectedAddons.includes(addon.id) 
                              ? 'bg-sand-500 border-sand-500' 
                              : 'border-obsidian-600'
                          }`}>
                            {selectedAddons.includes(addon.id) && (
                              <span className="text-obsidian-950 text-xs">✓</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              <div>
                <div className="section-label mb-4">Studio Rules & Policy</div>
                <div className="bg-obsidian-900 border border-obsidian-700 p-5 space-y-3 text-sm">
                  <div>
                    <span className="text-obsidian-500 font-mono text-xs uppercase tracking-widest">Cancellation</span>
                    <p className="text-obsidian-300 mt-1">{studio.rules?.cancellation_policy}</p>
                  </div>
                  <div className="border-t border-obsidian-800 pt-3">
                    <span className="text-obsidian-500 font-mono text-xs uppercase tracking-widest">Overtime</span>
                    <p className="text-obsidian-300 mt-1">AED {studio.rules?.overtime_rate}/hour · Must request 30 min before wrap</p>
                  </div>
                  <div className="border-t border-obsidian-800 pt-3">
                    <span className="text-obsidian-500 font-mono text-xs uppercase tracking-widest">Minimum Booking</span>
                    <p className="text-obsidian-300 mt-1">{studio.rules?.minimum_hours} hours</p>
                  </div>
                  {studio.rules?.notes && (
                    <div className="border-t border-obsidian-800 pt-3">
                      <span className="text-obsidian-500 font-mono text-xs uppercase tracking-widest">Notes</span>
                      <p className="text-obsidian-300 mt-1">{studio.rules.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability Calendar */}
              <div>
                <AvailabilityCalendar
                  availability={availability}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  selectedStart={selectedStart}
                  selectedEnd={selectedEnd}
                  onSlotSelect={handleSlotSelect}
                />
              </div>
            </div>

            {/* Right column: Booking widget */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="bg-obsidian-900 border border-obsidian-700 p-6">
                <div className="section-label mb-5">Book This Studio</div>
                
                {/* Selected slot summary */}
                {canBook ? (
                  <div className="bg-sand-500/10 border border-sand-500/30 p-4 mb-5">
                    <div className="text-xs font-mono text-obsidian-400 uppercase tracking-widest mb-2">Selected</div>
                    <div className="text-sand-200 text-sm">
                      <div className="font-medium">{selectedDate && format(parseISO(selectedDate), 'EEEE, d MMMM yyyy')}</div>
                      <div className="text-obsidian-400 mt-0.5">
                        {formatHour(selectedStart)} — {formatHour(selectedEnd)}
                        <span className="text-sand-400 ml-2">({selectedEnd - selectedStart}h)</span>
                      </div>
                    </div>
                    
                    {pricing && !calcLoading && (
                      <div className="mt-3 pt-3 border-t border-obsidian-700">
                        <div className="flex justify-between text-sm">
                          <span className="text-obsidian-400">Studio hire</span>
                          <span className="price-display">AED {pricing.basePrice.toLocaleString()}</span>
                        </div>
                        {pricing.addonsPrice > 0 && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-obsidian-400">Add-ons</span>
                            <span className="price-display">AED {pricing.addonsPrice.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-obsidian-700">
                          <span className="text-obsidian-200">Total</span>
                          <span className="price-display text-base">AED {pricing.totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-obsidian-500">Deposit (50%)</span>
                          <span className="text-sand-400">AED {pricing.depositAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    
                    {calcLoading && (
                      <div className="mt-3 text-xs text-obsidian-500 font-mono animate-pulse">Calculating...</div>
                    )}
                  </div>
                ) : (
                  <div className="bg-obsidian-800/50 border border-obsidian-700 p-4 mb-5 text-center">
                    <p className="text-sm text-obsidian-400">
                      {!selectedDate 
                        ? 'Select a date to check availability' 
                        : 'Click a start time, then an end time on the calendar'}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={handleBookNow}
                  disabled={!canBook}
                  className={`w-full py-4 text-base font-medium tracking-wide transition-all duration-200 ${
                    canBook
                      ? 'btn-primary'
                      : 'bg-obsidian-700 text-obsidian-500 cursor-not-allowed'
                  }`}
                >
                  {canBook ? 'Book This Slot →' : 'Select a Time Slot'}
                </button>

                <p className="text-xs text-center text-obsidian-600 font-mono mt-3">
                  🔒 Studio contacts revealed after booking
                </p>

                {/* Studio contact preview (locked) */}
                <div className="mt-4 pt-4 border-t border-obsidian-800">
                  <div className="text-xs font-mono text-obsidian-600 mb-2 uppercase tracking-widest">Studio Contact</div>
                  <div className="flex items-center gap-2 text-sm text-obsidian-600">
                    <span>📧</span>
                    <span className="blur-sm select-none">studio@example.ae</span>
                    <span className="text-xs">🔒</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-obsidian-600 mt-1">
                    <span>📱</span>
                    <span className="blur-sm select-none">+971 XX XXX XXXX</span>
                    <span className="text-xs">🔒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
