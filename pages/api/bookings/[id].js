import { getDb } from '../../../lib/db';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const db = getDb();

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const studio = db.prepare('SELECT * FROM studios WHERE id = ?').get(booking.studio_id);
    
    const formattedBooking = {
      ...booking,
      addons: typeof booking.addons === 'string' ? JSON.parse(booking.addons) : booking.addons,
    };

    const formattedStudio = {
      ...studio,
      images: typeof studio.images === 'string' ? JSON.parse(studio.images) : studio.images,
      amenities: typeof studio.amenities === 'string' ? JSON.parse(studio.amenities) : studio.amenities,
      rules: typeof studio.rules === 'string' ? JSON.parse(studio.rules) : studio.rules,
    };

    // Only reveal contact info after confirmed booking
    if (booking.status !== 'confirmed') {
      delete formattedStudio.contact_email;
      delete formattedStudio.contact_phone;
      delete formattedStudio.contact_whatsapp;
    }

    return res.status(200).json({
      booking: formattedBooking,
      studio: formattedStudio,
      contact_revealed: booking.status === 'confirmed',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch booking', details: error.message });
  }
}
