import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import Nav from '../../components/Nav';
import CheckoutForm from '../../components/CheckoutForm';

export default function CheckoutPage() {
  const router = useRouter();
  const { studio: studioId, date, start, end, addons: addonsParam } = router.query;

  const [studio, setStudio] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const startHour = parseInt(start);
  const endHour = parseInt(end);
  const addonIds = addonsParam ? addonsParam.split(',') : [];

  useEffect(() => {
    if (!studioId || !date || !start || !end) return;

    const fetchStudio = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/studios/${studioId}?isId=true`);
        // We need to search by ID not slug, so let's fetch from search
        const searchRes = await fetch(`/api/studios/search`);
        const searchData = await searchRes.json();
        const found = searchData.studios.find(s => s.id === studioId);
        
        if (!found) throw new Error('Studio not found');
        setStudio(found);

        // Calculate pricing
        const duration = endHour - startHour;
        let basePrice;
        if (duration >= 8 && found.full_day_price) {
          basePrice = found.full_day_price;
        } else if (duration >= 4 && found.half_day_price) {
          basePrice = found.half_day_price;
        } else {
          basePrice = found.hourly_price * duration;
        }

        const allAddons = await fetch(`/api/studios/${found.slug}`).then(r => r.json()).then(d => d.addons || []);
        
        let addonsPrice = 0;
        let addonDetails = [];
        for (const id of addonIds) {
          const addon = allAddons.find(a => a.id === id);
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudio();
  }, [studioId, date, start, end]);

  const handleSubmit = async (formData) => {
    if (!studio || !pricing) return;
    
    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create booking + payment intent
      const createRes = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studio_id: studio.id,
          date,
          start_hour: startHour,
          end_hour: endHour,
          user_name: formData.user_name,
          user_email: formData.user_email,
          user_phone: formData.user_phone,
          user_company: formData.user_company,
          addon_ids: addonIds,
          notes: formData.notes,
          payment_type: formData.payment_type,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create booking');
      }

      const createData = await createRes.json();

      // Step 2: Confirm booking (simulate payment success for mock Stripe)
      const confirmRes = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: createData.booking_id,
          payment_intent_id: createData.payment_intent_id,
        }),
      });

      if (!confirmRes.ok) {
        const err = await confirmRes.json();
        throw new Error(err.error || 'Failed to confirm booking');
      }

      const confirmData = await confirmRes.json();

      // Step 3: Redirect to confirmation
      router.push(`/confirmation/${createData.booking_id}`);

    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const formatHour = (h) => {
    if (h === 12) return '12:00 PM';
    return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  };

  if (loading || !router.isReady) return (
    <>
      <Nav />
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-obsidian-600 border-t-sand-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-obsidian-400 text-sm font-mono">Preparing checkout...</p>
        </div>
      </div>
    </>
  );

  if (error && !submitting) return (
    <>
      <Nav />
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center pt-16">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-4xl mb-4">⚠</div>
          <p className="text-red-400 mb-2">{error}</p>
          <Link href="/" className="btn-secondary mt-4 inline-block">← Back to search</Link>
        </div>
      </div>
    </>
  );

  if (!studio || !pricing) return null;

  return (
    <>
      <Head>
        <title>Checkout — {studio?.name} — StudioBook Dubai</title>
      </Head>
      <Nav />

      <main className="min-h-screen bg-obsidian-950 pt-16">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-obsidian-500 mb-8">
            <Link href="/" className="hover:text-obsidian-300">Studios</Link>
            <span>›</span>
            <Link href={`/studios/${studio.slug}`} className="hover:text-obsidian-300">{studio.name}</Link>
            <span>›</span>
            <span className="text-obsidian-300">Checkout</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="section-label mb-2">Complete Your Booking</div>
            <h1 className="display-heading text-3xl text-sand-100">{studio.name}</h1>
            <p className="text-obsidian-400 text-sm mt-1 font-mono">
              {date && format(parseISO(date), 'EEEE, d MMMM yyyy')} · {formatHour(startHour)} – {formatHour(endHour)}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 text-sm mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            <CheckoutForm
              booking={{ date, startHour, endHour }}
              studio={studio}
              pricing={pricing}
              onSubmit={handleSubmit}
              loading={submitting}
            />

            {/* Right side info */}
            <div className="space-y-4">
              {/* Studio image */}
              <div className="aspect-video bg-obsidian-900 overflow-hidden border border-obsidian-700">
                <img
                  src={studio.images?.[0]}
                  alt={studio.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=600&q=80'; }}
                />
              </div>

              {/* What's included */}
              <div className="bg-obsidian-900 border border-obsidian-700 p-5">
                <div className="section-label mb-3">What Happens Next</div>
                <div className="space-y-3 text-sm">
                  {[
                    { step: '01', text: 'Deposit locks your time slot immediately' },
                    { step: '02', text: 'Studio contact details revealed instantly' },
                    { step: '03', text: 'Booking contract generated & emailed' },
                    { step: '04', text: 'Balance due at the start of your shoot' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="font-mono text-xs text-obsidian-600 pt-0.5 flex-shrink-0">{step}</span>
                      <span className="text-obsidian-300">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancellation note */}
              <div className="bg-obsidian-900 border border-obsidian-700 p-4">
                <div className="text-xs font-mono text-obsidian-500 uppercase tracking-widest mb-2">Cancellation Policy</div>
                <p className="text-xs text-obsidian-400 leading-relaxed">{studio.rules?.cancellation_policy}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
