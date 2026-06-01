import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import Nav from '../../components/Nav';

export default function ConfirmationPage() {
  const router = useRouter();
  const { id } = router.query;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (!res.ok) throw new Error('Booking not found');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const formatHour = (h) => {
    if (h === 12) return '12:00 PM';
    return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  };

  if (loading) return (
    <>
      <Nav />
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-obsidian-600 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-obsidian-400 text-sm font-mono">Confirming booking...</p>
        </div>
      </div>
    </>
  );

  if (error || !data) return (
    <>
      <Nav />
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center pt-16">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Booking not found'}</p>
          <Link href="/" className="btn-secondary">← Back to search</Link>
        </div>
      </div>
    </>
  );

  const { booking, studio } = data;
  const addons = typeof booking.addons === 'string' ? JSON.parse(booking.addons) : (booking.addons || []);
  const balanceDue = booking.total_price - booking.deposit_amount;

  return (
    <>
      <Head>
        <title>Booking Confirmed — StudioBook Dubai</title>
      </Head>
      <Nav />

      <main className="min-h-screen bg-obsidian-950 pt-16">
        <div className="max-w-3xl mx-auto px-6 py-16">
          
          {/* Success header */}
          <div className="text-center mb-12 animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 mb-6">
              <span className="text-2xl">✓</span>
            </div>
            <div className="section-label mb-3">Booking Confirmed</div>
            <h1 className="display-heading text-4xl text-sand-50 mb-2">You're all set.</h1>
            <p className="text-obsidian-400">
              {studio.name} is booked and your slot is locked.
            </p>
            <div className="font-mono text-xs text-obsidian-600 mt-2">
              Booking ID: {booking.id.toUpperCase()}
            </div>
          </div>

          {/* Booking details card */}
          <div className="bg-obsidian-900 border border-obsidian-700 mb-6 animate-fade-in-up opacity-0 animate-delay-100" style={{ animationFillMode: 'forwards' }}>
            {/* Studio hero */}
            <div className="h-40 overflow-hidden relative">
              <img
                src={studio.images?.[0]}
                alt={studio.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <h2 className="display-heading text-2xl text-sand-50">{studio.name}</h2>
                <p className="text-xs font-mono text-obsidian-300 mt-0.5">{studio.location}</p>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-obsidian-800">
              <div>
                <div className="section-label mb-1">Date</div>
                <div className="text-sand-100 text-sm font-medium">
                  {format(parseISO(booking.date), 'd MMM yyyy')}
                </div>
                <div className="text-obsidian-500 text-xs font-mono">
                  {format(parseISO(booking.date), 'EEEE')}
                </div>
              </div>
              <div>
                <div className="section-label mb-1">Time</div>
                <div className="text-sand-100 text-sm font-medium">
                  {formatHour(booking.start_hour)}
                </div>
                <div className="text-obsidian-500 text-xs font-mono">
                  to {formatHour(booking.end_hour)}
                </div>
              </div>
              <div>
                <div className="section-label mb-1">Duration</div>
                <div className="text-sand-100 text-sm font-medium">{booking.duration_hours} hours</div>
              </div>
              <div>
                <div className="section-label mb-1">Status</div>
                <span className="badge-available">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-obsidian-900 border border-obsidian-700 p-6 mb-6 animate-fade-in-up opacity-0 animate-delay-200" style={{ animationFillMode: 'forwards' }}>
            <div className="section-label mb-4">Payment Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-obsidian-400">Studio hire ({booking.duration_hours}h)</span>
                <span className="text-obsidian-200">AED {booking.base_price.toLocaleString()}</span>
              </div>
              {addons.map(a => (
                <div key={a.id} className="flex justify-between">
                  <span className="text-obsidian-400">{a.name}</span>
                  <span className="text-obsidian-200">AED {a.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-medium pt-2 border-t border-obsidian-800">
                <span>Total</span>
                <span className="price-display">AED {booking.total_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>✓ Deposit Paid</span>
                <span>AED {booking.deposit_amount.toLocaleString()}</span>
              </div>
              {balanceDue > 0 && (
                <div className="flex justify-between text-amber-400/80">
                  <span>⏳ Balance Due on Day</span>
                  <span>AED {balanceDue.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Studio Contact — REVEALED */}
          <div className="bg-emerald-900/20 border border-emerald-500/40 p-6 mb-6 animate-fade-in-up opacity-0 animate-delay-300" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="section-label text-emerald-400">Studio Contact</div>
              <span className="badge-available">Unlocked</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-obsidian-500 w-5">📧</span>
                <a href={`mailto:${studio.contact_email}`} className="text-emerald-300 hover:text-emerald-200 transition-colors">
                  {studio.contact_email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-obsidian-500 w-5">📞</span>
                <a href={`tel:${studio.contact_phone}`} className="text-emerald-300 hover:text-emerald-200 transition-colors">
                  {studio.contact_phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-obsidian-500 w-5">💬</span>
                <a 
                  href={`https://wa.me/${(studio.contact_whatsapp || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  WhatsApp: {studio.contact_whatsapp}
                </a>
              </div>
            </div>
            <p className="text-xs text-obsidian-500 mt-4">
              Reach out to coordinate load-in, access codes, and any pre-shoot logistics.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up opacity-0 animate-delay-400" style={{ animationFillMode: 'forwards' }}>
            <a
              href={`/api/bookings/contract?id=${booking.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-primary py-3 text-center flex items-center justify-center gap-2"
            >
              📄 Download Contract
            </a>
            <Link
              href="/"
              className="flex-1 btn-secondary py-3 text-center"
            >
              ← Book Another Studio
            </Link>
          </div>

          <div className="text-center mt-8 text-xs font-mono text-obsidian-600">
            A confirmation has been sent to {booking.user_email}
          </div>
        </div>
      </main>
    </>
  );
}
