import { getDb } from '../../../lib/db';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const db = getDb();
    const booking = db.prepare('SELECT contract_html, status FROM bookings WHERE id = ?').get(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(403).json({ error: 'Contract only available for confirmed bookings' });
    }

    if (!booking.contract_html) {
      return res.status(404).json({ error: 'Contract not yet generated' });
    }

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="booking-contract-${id}.html"`);
    return res.send(booking.contract_html);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve contract', details: error.message });
  }
}
