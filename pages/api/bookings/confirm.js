import { getDb } from '../../../lib/db';
import { lockTimeSlots } from '../../../lib/availability';
import { generateContract } from '../../../lib/contract';

const MOCK_STRIPE = process.env.NEXT_PUBLIC_MOCK_STRIPE === 'true';

async function verifyPaymentIntent(paymentIntentId) {
  if (MOCK_STRIPE || paymentIntentId.startsWith('pi_mock_')) {
    // Mock: always return succeeded
    return { status: 'succeeded', id: paymentIntentId };
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { booking_id, payment_intent_id } = req.body;

  if (!booking_id || !payment_intent_id) {
    return res.status(400).json({ error: 'Missing booking_id or payment_intent_id' });
  }

  try {
    const db = getDb();

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'confirmed') {
      // Already confirmed — return existing data
      const studio = db.prepare('SELECT * FROM studios WHERE id = ?').get(booking.studio_id);
      return res.status(200).json({ 
        booking: formatBooking(booking), 
        studio: formatStudio(studio),
        already_confirmed: true 
      });
    }

    // Verify payment with Stripe
    const paymentIntent = await verifyPaymentIntent(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ 
        error: 'Payment not completed', 
        payment_status: paymentIntent.status 
      });
    }

    // Lock time slots (atomic)
    lockTimeSlots(
      booking.studio_id,
      booking.date,
      booking.start_hour,
      booking.end_hour,
      booking_id
    );

    const studio = db.prepare('SELECT * FROM studios WHERE id = ?').get(booking.studio_id);
    
    // Generate contract
    const formattedBooking = formatBooking(booking);
    const formattedStudio = formatStudio(studio);
    const contractHtml = generateContract(formattedBooking, formattedStudio);

    // Update booking to confirmed
    const isDeposit = booking.deposit_amount < booking.total_price;
    db.prepare(`
      UPDATE bookings 
      SET status = 'confirmed', 
          payment_status = ?,
          contract_html = ?
      WHERE id = ?
    `).run(
      isDeposit ? 'deposit_paid' : 'paid',
      contractHtml,
      booking_id
    );

    return res.status(200).json({
      booking: { ...formattedBooking, status: 'confirmed' },
      studio: formattedStudio,
      contract_html: contractHtml,
    });

  } catch (error) {
    console.error('Booking confirmation error:', error);
    
    if (error.message?.includes('TIME_SLOT_CONFLICT')) {
      return res.status(409).json({ 
        error: 'Time slot conflict: the slot was booked by another user during checkout. Please choose a different time.' 
      });
    }
    
    return res.status(500).json({ error: 'Confirmation failed', details: error.message });
  }
}

function formatBooking(booking) {
  return {
    ...booking,
    addons: typeof booking.addons === 'string' ? JSON.parse(booking.addons) : booking.addons,
  };
}

function formatStudio(studio) {
  return {
    ...studio,
    images: typeof studio.images === 'string' ? JSON.parse(studio.images) : studio.images,
    amenities: typeof studio.amenities === 'string' ? JSON.parse(studio.amenities) : studio.amenities,
    rules: typeof studio.rules === 'string' ? JSON.parse(studio.rules) : studio.rules,
  };
}
