import { getDb } from '../../lib/db';
import { getStudiosAvailability, rankStudios } from '../../lib/availability';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, start_hour, end_hour, size, requirements } = req.query;

    const db = getDb();

    // Build studio query
    let query = 'SELECT * FROM studios WHERE active = 1';
    const params = [];

    if (size) {
      query += ' AND size_category = ?';
      params.push(size);
    }

    const studios = db.prepare(query).all(...params);

    // Parse requirements from comma-separated string
    const requirementList = requirements 
      ? requirements.split(',').filter(Boolean) 
      : [];

    // Filter by requirements (amenity matching)
    let filteredStudios = studios.filter(studio => {
      if (requirementList.length === 0) return true;
      const amenities = JSON.parse(studio.amenities);
      return requirementList.every(req => amenities[req]);
    });

    // Parse images + amenities for each studio
    filteredStudios = filteredStudios.map(s => ({
      ...s,
      images: JSON.parse(s.images),
      amenities: JSON.parse(s.amenities),
      rules: JSON.parse(s.rules),
    }));

    // Check availability if date + time provided
    let availabilityMap = {};
    if (date && start_hour && end_hour) {
      const studioIds = filteredStudios.map(s => s.id);
      availabilityMap = getStudiosAvailability(
        studioIds, 
        date, 
        parseInt(start_hour), 
        parseInt(end_hour)
      );
    }

    // Rank results
    const rankedStudios = rankStudios(filteredStudios, availabilityMap, {
      requirements: requirementList,
    });

    return res.status(200).json({
      studios: rankedStudios,
      total: rankedStudios.length,
      searchParams: { date, start_hour, end_hour, size, requirements: requirementList },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Failed to search studios', details: error.message });
  }
}
