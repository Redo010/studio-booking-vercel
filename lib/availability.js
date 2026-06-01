const { getDb } = require('./db');

/**
 * Core availability and booking logic module.
 * All booking operations should go through these functions.
 */

/**
 * Check if a studio is available for a given date + time range.
 * Returns detailed availability info.
 */
function checkAvailability(studioId, date, startHour, endHour) {
  const db = getDb();
  
  const blocks = db.prepare(`
    SELECT * FROM availability_blocks
    WHERE studio_id = ? AND date = ? AND start_hour >= ? AND start_hour < ?
    ORDER BY start_hour ASC
  `).all(studioId, date, startHour, endHour);

  const requestedHours = endHour - startHour;
  const totalSlots = blocks.length;
  const availableSlots = blocks.filter(b => b.block_type === 'available').length;
  const bookedSlots = blocks.filter(b => b.block_type === 'booked').length;

  return {
    isFullyAvailable: availableSlots === requestedHours && totalSlots === requestedHours,
    isPartiallyAvailable: availableSlots > 0 && bookedSlots > 0,
    isFullyBooked: bookedSlots === requestedHours,
    availableSlots,
    bookedSlots,
    totalSlots,
    blocks,
  };
}

/**
 * Get a studio's full availability for a given date.
 * Returns hour-by-hour status.
 */
function getDayAvailability(studioId, date) {
  const db = getDb();
  
  const blocks = db.prepare(`
    SELECT ab.*, b.id as booking_ref
    FROM availability_blocks ab
    LEFT JOIN bookings b ON ab.booking_id = b.id
    WHERE ab.studio_id = ? AND ab.date = ?
    ORDER BY ab.start_hour ASC
  `).all(studioId, date);

  return blocks;
}

/**
 * Get availability summary for multiple studios across a date range.
 * Used for the search/discovery page.
 */
function getStudiosAvailability(studioIds, date, startHour, endHour) {
  const db = getDb();
  const results = {};

  for (const studioId of studioIds) {
    const avail = checkAvailability(studioId, date, startHour, endHour);
    
    let status;
    if (avail.isFullyAvailable) {
      status = 'AVAILABLE';
    } else if (avail.isPartiallyAvailable) {
      status = 'PARTIAL';
    } else {
      status = 'BOOKED';
    }

    results[studioId] = {
      ...avail,
      status,
    };
  }

  return results;
}

/**
 * Lock time slots for a booking (atomic operation).
 * Returns true if successful, throws if conflict detected.
 */
function lockTimeSlots(studioId, date, startHour, endHour, bookingId) {
  const db = getDb();

  // Use a transaction to prevent race conditions
  const lock = db.transaction(() => {
    // Double-check availability within transaction
    const conflicts = db.prepare(`
      SELECT COUNT(*) as count FROM availability_blocks
      WHERE studio_id = ? AND date = ? AND start_hour >= ? AND start_hour < ?
      AND block_type != 'available'
    `).get(studioId, date, startHour, endHour);

    if (conflicts.count > 0) {
      throw new Error('TIME_SLOT_CONFLICT: One or more time slots are no longer available.');
    }

    // Lock the slots
    const result = db.prepare(`
      UPDATE availability_blocks
      SET block_type = 'booked', booking_id = ?
      WHERE studio_id = ? AND date = ? AND start_hour >= ? AND start_hour < ?
      AND block_type = 'available'
    `).run(bookingId, studioId, date, startHour, endHour);

    if (result.changes !== (endHour - startHour)) {
      throw new Error('TIME_SLOT_CONFLICT: Could not lock all required time slots.');
    }

    return true;
  });

  return lock();
}

/**
 * Release time slots (e.g., on cancellation).
 */
function releaseTimeSlots(studioId, date, startHour, endHour, bookingId) {
  const db = getDb();

  db.prepare(`
    UPDATE availability_blocks
    SET block_type = 'available', booking_id = NULL
    WHERE studio_id = ? AND date = ? AND start_hour >= ? AND start_hour < ?
    AND booking_id = ?
  `).run(studioId, date, startHour, endHour, bookingId);
}

/**
 * Calculate price for a booking.
 */
function calculatePrice(studio, startHour, endHour, addonIds = []) {
  const db = getDb();
  const durationHours = endHour - startHour;
  
  let basePrice;
  
  // Apply block pricing if applicable
  if (durationHours >= 8 && studio.full_day_price) {
    basePrice = studio.full_day_price;
  } else if (durationHours >= 4 && studio.half_day_price) {
    basePrice = studio.half_day_price;
  } else {
    basePrice = studio.hourly_price * durationHours;
  }

  // Calculate addons
  let addonsPrice = 0;
  let addonDetails = [];
  
  if (addonIds && addonIds.length > 0) {
    const placeholders = addonIds.map(() => '?').join(',');
    const addons = db.prepare(`
      SELECT * FROM addons 
      WHERE id IN (${placeholders}) AND (studio_id IS NULL OR studio_id = ?)
    `).all(...addonIds, studio.id);
    
    for (const addon of addons) {
      addonsPrice += addon.price;
      addonDetails.push(addon);
    }
  }

  const totalPrice = basePrice + addonsPrice;
  const depositAmount = Math.round(totalPrice * 0.5); // 50% deposit

  return {
    durationHours,
    basePrice,
    addonsPrice,
    totalPrice,
    depositAmount,
    addonDetails,
    priceBreakdown: {
      type: durationHours >= 8 ? 'full_day' : durationHours >= 4 ? 'half_day' : 'hourly',
      hours: durationHours,
      hourlyRate: studio.hourly_price,
    },
  };
}

/**
 * Rank studios by match quality for search results.
 */
function rankStudios(studios, availabilityMap, searchParams) {
  return studios.map(studio => {
    const avail = availabilityMap[studio.id] || { status: 'UNKNOWN', availableSlots: 0 };
    
    // Availability score (0-40 pts)
    let availScore = 0;
    if (avail.status === 'AVAILABLE') availScore = 40;
    else if (avail.status === 'PARTIAL') availScore = 20;
    
    // Requirements match score (0-40 pts)
    let reqScore = 0;
    const amenities = typeof studio.amenities === 'string' 
      ? JSON.parse(studio.amenities) 
      : studio.amenities;
    
    const requirements = searchParams.requirements || [];
    if (requirements.length > 0) {
      let matched = 0;
      for (const req of requirements) {
        if (amenities[req]) matched++;
      }
      reqScore = Math.round((matched / requirements.length) * 40);
    } else {
      reqScore = 40; // No requirements = full score
    }

    // Price efficiency score (0-20 pts) — lower price = higher score
    const maxPrice = 1200; // AED/hr ceiling for scoring
    const priceScore = Math.max(0, 20 - Math.round((studio.hourly_price / maxPrice) * 20));

    const totalScore = availScore + reqScore + priceScore;

    return {
      ...studio,
      amenities,
      rules: typeof studio.rules === 'string' ? JSON.parse(studio.rules) : studio.rules,
      images: typeof studio.images === 'string' ? JSON.parse(studio.images) : studio.images,
      availability: avail,
      score: totalScore,
      scoreBreakdown: { availScore, reqScore, priceScore },
    };
  }).sort((a, b) => {
    // Sort BOOKED to end
    if (a.availability.status === 'BOOKED' && b.availability.status !== 'BOOKED') return 1;
    if (b.availability.status === 'BOOKED' && a.availability.status !== 'BOOKED') return -1;
    // Then by score
    return b.score - a.score;
  });
}

module.exports = {
  checkAvailability,
  getDayAvailability,
  getStudiosAvailability,
  lockTimeSlots,
  releaseTimeSlots,
  calculatePrice,
  rankStudios,
};
