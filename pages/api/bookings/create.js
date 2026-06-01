import { getDb } from '../../../lib/db';
import { checkAvailability, lockTimeSlots, calculatePrice } from '../../../lib/availability';
import { generateContract } from '../../../lib/contract';
import { v4 as uuidv4 } from 'uuid';

const MOCK_STRIPE = process.env.NEXT_PUBLIC_MOCK_STRIPE === 'true';

async function createStripePaymentIntent(amount, metadata) {
  if (MOCK_STRIPE) {
    // Return a mock payment intent for development
    return {
      id: `pi_mock_${uuidv4().replace(/-/g, '').slice(0, 20)}`,
      client_secret: `pi_mock_secret_${uuidv4().replace(/-/g, '').slice(0, 20)}`,
      amount,
      currency: 'aed',
      status: 'requires_payment_method',
    };
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  return await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe uses fils (smallest AED unit)
    currency: 'aed',
    metadata,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    studio_id,
    date,
    start_hour,
    end_hour,
    user_name,
    user_email,
    user_phone,
    user_company,
    addon_ids,
    notes,
    payment_type, // 'deposit' or 'full'
  } = req.body;

  // Validation
  if (!studio_id || !date || start_hour == null || end_hour == null || !user_name || !user_email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (end_hour <= start_hour) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  try {
    const db = getDb();

    // Get studio
    const studio = db.prepare('SELECT * FROM studios WHERE id = ? AND active = 1').get(studio_id);
    if (!studio) {
      return res.status(404).json({ error: 'Studio not found' });
    }

    const parsedStudio = {
      ...studio,
      rules: JSON.parse(studio.rules),
    };

    // Check minimum hours
    const duration = end_hour - start_hour;
    const minHours = parsedStudio.rules.minimum_hours || 1;
    if (duration < minHours) {
      return res.status(400).json({ 
        error: `Minimum booking is ${minHours} hours for this studio` 
      });
    }

    // Check availability
    const availability = checkAvailability(studio_id, date, start_hour, end_hour);
    if (!availability.isFullyAvailable) {
      return res.status(409).json({ 
        error: 'Selected time slot is not fully available',
        availability 
      });
    }

    // Calculate pricing
    const pricing = calculatePrice(parsedStudio, start_hour, end_hour, addon_ids || []);
    
    // Determine payment amount
    const paymentAmount = payment_type === 'full' 
      ? pricing.totalPrice 
      : pricing.depositAmount;

    // Create booking record
    const bookingId = `bkg-${uuidv4().slice(0, 12)}`;

    // Create Stripe payment intent
    const paymentIntent = await createStripePaymentIntent(paymentAmount, {
      booking_id: bookingId,
      studio_id,
      studio_name: studio.name,
      date,
    });

    // Save booking (pending payment)
    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        id, studio_id, user_name, user_email, user_phone, user_company,
        date, start_hour, end_hour, duration_hours,
        base_price, addons_price, total_price, deposit_amount,
        addons, payment_status, status,
        stripe_payment_intent_id, notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, 'pending', 'pending',
        ?, ?
      )
    `);

    insertBooking.run(
      bookingId, studio_id, user_name, user_email, user_phone || null, user_company || null,
      date, start_hour, end_hour, duration,
      pricing.basePrice, pricing.addonsPrice, pricing.totalPrice, pricing.depositAmount,
      JSON.stringify(pricing.addonDetails),
      paymentIntent.id,
      notes || null
    );

    return res.status(200).json({
      booking_id: bookingId,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      pricing,
      payment_amount: paymentAmount,
      payment_type: payment_type || 'deposit',
      mock_stripe: MOCK_STRIPE,
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    
    if (error.message?.includes('TIME_SLOT_CONFLICT')) {
      return res.status(409).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
}
