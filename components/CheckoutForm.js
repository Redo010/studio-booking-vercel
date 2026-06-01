import { useState } from 'react';

export default function CheckoutForm({ booking, studio, pricing, onSubmit, loading }) {
  const [form, setForm] = useState({
    user_name: '',
    user_email: '',
    user_phone: '',
    user_company: '',
    notes: '',
    payment_type: 'deposit',
    agreed: false,
    // Mock card fields
    card_number: '',
    card_expiry: '',
    card_cvc: '',
    card_name: '',
  });

  const [errors, setErrors] = useState({});

  const updateField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.user_name.trim()) errs.user_name = 'Name required';
    if (!form.user_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.user_email = 'Valid email required';
    if (!form.agreed) errs.agreed = 'You must agree to the terms';
    if (process.env.NEXT_PUBLIC_MOCK_STRIPE === 'true') {
      if (!form.card_number) errs.card_number = 'Card number required';
      if (!form.card_expiry) errs.card_expiry = 'Expiry required';
      if (!form.card_cvc) errs.card_cvc = 'CVC required';
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  };

  const paymentAmount = form.payment_type === 'full' 
    ? pricing.totalPrice 
    : pricing.depositAmount;

  const formatHour = (h) => {
    if (h === 12) return '12:00 PM';
    return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  };

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-obsidian-900 border border-obsidian-700 p-5">
        <div className="section-label mb-4">Booking Summary</div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-obsidian-400">Studio</span>
            <span className="text-sand-100 font-medium">{studio.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-obsidian-400">Date</span>
            <span className="text-sand-100">{booking.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-obsidian-400">Time</span>
            <span className="text-sand-100">{formatHour(booking.startHour)} – {formatHour(booking.endHour)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-obsidian-400">Duration</span>
            <span className="text-sand-100">{booking.endHour - booking.startHour} hours</span>
          </div>
          
          {pricing.addonDetails?.length > 0 && (
            <>
              <div className="border-t border-obsidian-700 my-2" />
              {pricing.addonDetails.map(a => (
                <div key={a.id} className="flex justify-between text-xs">
                  <span className="text-obsidian-400">+ {a.name}</span>
                  <span className="text-obsidian-300">AED {a.price.toLocaleString()}</span>
                </div>
              ))}
            </>
          )}
          
          <div className="border-t border-obsidian-700 pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span className="text-obsidian-300">Total</span>
              <span className="price-display">AED {pricing.totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Type */}
      <div>
        <div className="section-label mb-3">Payment Option</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateField('payment_type', 'deposit')}
            className={`p-4 border text-left transition-colors ${
              form.payment_type === 'deposit'
                ? 'bg-sand-500/10 border-sand-500/50'
                : 'border-obsidian-700 hover:border-obsidian-500'
            }`}
          >
            <div className="text-sm font-medium text-sand-100">Pay Deposit</div>
            <div className="text-xl font-mono text-sand-300 mt-1">AED {pricing.depositAmount.toLocaleString()}</div>
            <div className="text-xs text-obsidian-500 mt-1">50% now, balance on day</div>
          </button>
          <button
            onClick={() => updateField('payment_type', 'full')}
            className={`p-4 border text-left transition-colors ${
              form.payment_type === 'full'
                ? 'bg-sand-500/10 border-sand-500/50'
                : 'border-obsidian-700 hover:border-obsidian-500'
            }`}
          >
            <div className="text-sm font-medium text-sand-100">Pay in Full</div>
            <div className="text-xl font-mono text-sand-300 mt-1">AED {pricing.totalPrice.toLocaleString()}</div>
            <div className="text-xs text-obsidian-500 mt-1">No balance due on day</div>
          </button>
        </div>
      </div>

      {/* Contact Details */}
      <div>
        <div className="section-label mb-3">Your Details</div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                placeholder="Full Name *"
                value={form.user_name}
                onChange={e => updateField('user_name', e.target.value)}
                className={`input-field ${errors.user_name ? 'border-red-500/60' : ''}`}
              />
              {errors.user_name && <p className="text-red-400 text-xs mt-1">{errors.user_name}</p>}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email Address *"
                value={form.user_email}
                onChange={e => updateField('user_email', e.target.value)}
                className={`input-field ${errors.user_email ? 'border-red-500/60' : ''}`}
              />
              {errors.user_email && <p className="text-red-400 text-xs mt-1">{errors.user_email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="tel"
              placeholder="Phone Number"
              value={form.user_phone}
              onChange={e => updateField('user_phone', e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Company / Agency"
              value={form.user_company}
              onChange={e => updateField('user_company', e.target.value)}
              className="input-field"
            />
          </div>
          <textarea
            placeholder="Special requirements or notes (optional)"
            value={form.notes}
            onChange={e => updateField('notes', e.target.value)}
            rows={2}
            className="input-field resize-none"
          />
        </div>
      </div>

      {/* Mock Card Input */}
      <div>
        <div className="section-label mb-3 flex items-center gap-2">
          Payment Details
          <span className="text-xs font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 uppercase tracking-widest">
            Test Mode
          </span>
        </div>
        <div className="bg-obsidian-900/50 border border-amber-500/20 p-4 mb-3">
          <p className="text-xs text-amber-400/80 font-mono">
            ⚡ Mock Stripe is enabled. Enter any card details to simulate payment. 
            Use real Stripe keys for production.
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Card Number (e.g. 4242 4242 4242 4242)"
              value={form.card_number}
              onChange={e => updateField('card_number', e.target.value.replace(/[^\d\s]/g, '').slice(0, 19))}
              className={`input-field font-mono ${errors.card_number ? 'border-red-500/60' : ''}`}
            />
            {errors.card_number && <p className="text-red-400 text-xs mt-1">{errors.card_number}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                placeholder="MM/YY"
                value={form.card_expiry}
                onChange={e => updateField('card_expiry', e.target.value)}
                className={`input-field font-mono ${errors.card_expiry ? 'border-red-500/60' : ''}`}
              />
              {errors.card_expiry && <p className="text-red-400 text-xs mt-1">{errors.card_expiry}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="CVC"
                value={form.card_cvc}
                onChange={e => updateField('card_cvc', e.target.value.slice(0, 4))}
                className={`input-field font-mono ${errors.card_cvc ? 'border-red-500/60' : ''}`}
              />
              {errors.card_cvc && <p className="text-red-400 text-xs mt-1">{errors.card_cvc}</p>}
            </div>
            <input
              type="text"
              placeholder="Name on Card"
              value={form.card_name}
              onChange={e => updateField('card_name', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Terms */}
      <div>
        <label className={`flex items-start gap-3 cursor-pointer ${errors.agreed ? 'text-red-400' : 'text-obsidian-300'}`}>
          <div 
            onClick={() => updateField('agreed', !form.agreed)}
            className={`flex-shrink-0 w-5 h-5 border mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${
              form.agreed ? 'bg-sand-500 border-sand-500' : 'border-obsidian-600 hover:border-obsidian-400'
            }`}
          >
            {form.agreed && <span className="text-obsidian-950 text-xs">✓</span>}
          </div>
          <span className="text-sm leading-relaxed">
            I agree to the{' '}
            <span className="text-sand-400 underline">booking terms</span>,
            cancellation policy, and studio rules. I understand the deposit is required to confirm the booking.
          </span>
        </label>
        {errors.agreed && <p className="text-red-400 text-xs mt-1 ml-8">{errors.agreed}</p>}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-obsidian-600 border-t-obsidian-200 rounded-full animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <span>Pay AED {paymentAmount.toLocaleString()}</span>
            <span className="text-obsidian-700 font-mono">→</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-obsidian-600 font-mono">
        🔒 Secure payment · Studio contact revealed after confirmation
      </p>
    </div>
  );
}
