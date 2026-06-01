import { getDb } from '../../../lib/db';
import { getDayAvailability } from '../../../lib/availability';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, date } = req.query;
    const db = getDb();

    const studio = db.prepare('SELECT * FROM studios WHERE slug = ? AND active = 1').get(slug);
    
    if (!studio) {
      return res.status(404).json({ error: 'Studio not found' });
    }

    // Parse JSON fields
    const parsedStudio = {
      ...studio,
      images: JSON.parse(studio.images),
      amenities: JSON.parse(studio.amenities),
      rules: JSON.parse(studio.rules),
    };

    // Get addons for this studio
    const addons = db.prepare(`
      SELECT * FROM addons 
      WHERE active = 1 AND (studio_id IS NULL OR studio_id = ?)
      ORDER BY price ASC
    `).all(studio.id);

    // Get availability for requested date (or next 14 days)
    let availabilityData = {};
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get 14 days of availability summary
    for (let i = 0; i < 14; i++) {
      const d = new Date(targetDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      const blocks = getDayAvailability(studio.id, dateStr);
      const available = blocks.filter(b => b.block_type === 'available').length;
      const total = blocks.length;
      
      availabilityData[dateStr] = {
        blocks,
        availableHours: available,
        totalHours: total,
        status: available === 0 ? 'BOOKED' : available < total ? 'PARTIAL' : 'AVAILABLE',
      };
    }

    return res.status(200).json({
      studio: parsedStudio,
      addons,
      availability: availabilityData,
    });
  } catch (error) {
    console.error('Studio detail error:', error);
    return res.status(500).json({ error: 'Failed to fetch studio', details: error.message });
  }
}
