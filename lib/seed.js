const { getDb } = require('./db');
const { v4: uuidv4 } = require('uuid');
const { addDays, format } = require('date-fns');

const STUDIOS = [
  {
    id: 'studio-001',
    name: 'Studio Society',
    slug: 'studio-society',
    location: 'Al Quoz Industrial Area 1, Dubai',
    district: 'Al Quoz',
    size_category: 'large',
    sqft: 4200,
    hourly_price: 850,
    half_day_price: 3200,
    full_day_price: 5800,
    description: 'Dubai\'s premier creative production space. A converted warehouse featuring soaring 8m ceilings, a full cyclorama wall, and a modular kitchen set. Trusted by Nike, Netflix, and the biggest regional agencies. Raw industrial bones with world-class infrastructure.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80',
      'https://images.unsplash.com/photo-1574717024453-354056aafa98?w=1200&q=80',
    ]),
    amenities: JSON.stringify({
      daylight: true,
      cyc_wall: true,
      kitchen_set: true,
      blackout: true,
      parking: true,
      truck_access: true,
      ac: true,
      changing_rooms: true,
      wifi: true,
      makeup_room: true,
    }),
    rules: JSON.stringify({
      overtime_rate: 1200,
      cancellation_policy: '50% refund if cancelled 72+ hours before. No refund within 72 hours.',
      minimum_hours: 4,
      deposit_percent: 50,
      notes: 'Load-in from 6AM available. Catering kitchen for crew. No open flames.',
    }),
    contact_email: 'bookings@studiosociety.ae',
    contact_phone: '+971 4 341 2000',
    contact_whatsapp: '+971 50 341 2000',
  },
  {
    id: 'studio-002',
    name: 'Ravenscar Studios',
    slug: 'ravenscar-studios',
    location: 'Dubai Production City, Dubai',
    district: 'Production City',
    size_category: 'large',
    sqft: 6800,
    hourly_price: 1100,
    half_day_price: 4200,
    full_day_price: 7500,
    description: 'The largest privately-owned production stage in the UAE. Full blackout capability, integrated LED grid, 12m ceiling height, and a dedicated vehicle entrance. Built for TVC, broadcast, and feature productions. State-of-the-art grip and electric package available.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
      'https://images.unsplash.com/photo-1567443024551-f3e3cc2be870?w=1200&q=80',
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80',
    ]),
    amenities: JSON.stringify({
      daylight: false,
      cyc_wall: true,
      kitchen_set: false,
      blackout: true,
      parking: true,
      truck_access: true,
      ac: true,
      changing_rooms: true,
      wifi: true,
      makeup_room: true,
    }),
    rules: JSON.stringify({
      overtime_rate: 1600,
      cancellation_policy: '75% refund if cancelled 96+ hours before. 25% refund within 48-96 hours. No refund within 48 hours.',
      minimum_hours: 8,
      deposit_percent: 50,
      notes: 'Full production insurance required. Generator hookup available. 24/7 access with advance booking.',
    }),
    contact_email: 'studio@ravenscar.ae',
    contact_phone: '+971 4 817 6600',
    contact_whatsapp: '+971 55 817 6600',
  },
  {
    id: 'studio-003',
    name: 'Luma Studio',
    slug: 'luma-studio',
    location: 'Alserkal Avenue, Al Quoz, Dubai',
    district: 'Al Quoz',
    size_category: 'medium',
    sqft: 1800,
    hourly_price: 480,
    half_day_price: 1800,
    full_day_price: 3200,
    description: 'Bathed in natural light from north-facing skylights, Luma is the definitive daylight studio in Dubai. Polished concrete floors, clean white walls, and a Scandinavian-minimal aesthetic. Perfect for beauty, fashion, and editorial campaigns. The light here is genuinely exceptional.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80',
    ]),
    amenities: JSON.stringify({
      daylight: true,
      cyc_wall: false,
      kitchen_set: false,
      blackout: false,
      parking: true,
      truck_access: false,
      ac: true,
      changing_rooms: true,
      wifi: true,
      makeup_room: true,
    }),
    rules: JSON.stringify({
      overtime_rate: 650,
      cancellation_policy: '100% refund if cancelled 48+ hours before. No refund within 48 hours.',
      minimum_hours: 2,
      deposit_percent: 50,
      notes: 'Shoes off policy in the studio. Max 15 people on set. No confetti or glitter.',
    }),
    contact_email: 'hello@lumastudio.ae',
    contact_phone: '+971 4 388 1400',
    contact_whatsapp: '+971 52 388 1400',
  },
  {
    id: 'studio-004',
    name: 'AWS Studios',
    slug: 'aws-studios',
    location: 'Dubai Media City, Dubai',
    district: 'Media City',
    size_category: 'medium',
    sqft: 2400,
    hourly_price: 650,
    half_day_price: 2400,
    full_day_price: 4200,
    description: 'Professional broadcast and commercial production studio inside Dubai Media City. Dual shooting bays with independent lighting rigs, a permanent news/interview set, and a floating kitchen set. In-house production support team. Used by regional broadcasters, tech brands, and luxury advertisers.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1572267512875-edd9d55f62f4?w=1200&q=80',
      'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&q=80',
      'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?w=1200&q=80',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
    ]),
    amenities: JSON.stringify({
      daylight: false,
      cyc_wall: true,
      kitchen_set: true,
      blackout: true,
      parking: true,
      truck_access: false,
      ac: true,
      changing_rooms: true,
      wifi: true,
      makeup_room: true,
    }),
    rules: JSON.stringify({
      overtime_rate: 900,
      cancellation_policy: '50% refund if cancelled 72+ hours before. No refund within 72 hours.',
      minimum_hours: 3,
      deposit_percent: 50,
      notes: 'Media City parking validation available. Teleprompter available on request.',
    }),
    contact_email: 'bookings@awsstudios.ae',
    contact_phone: '+971 4 451 9000',
    contact_whatsapp: '+971 54 451 9000',
  },
  {
    id: 'studio-005',
    name: 'Garage Studio',
    slug: 'garage-studio',
    location: 'Jumeirah, Dubai',
    district: 'Jumeirah',
    size_category: 'small',
    sqft: 900,
    hourly_price: 280,
    half_day_price: 1000,
    full_day_price: 1800,
    description: 'A boutique creative space in the heart of Jumeirah. Intimate, versatile, and beautifully designed for portrait, product, and content creation. Two built-in backdrops, a styling corner, and a client lounge. Favourited by influencers, photographers, and startups launching their visual identity.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1452457750107-be084040ef7f?w=1200&q=80',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=80',
      'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=1200&q=80',
      'https://images.unsplash.com/photo-1580974852861-c381510bc98a?w=1200&q=80',
    ]),
    amenities: JSON.stringify({
      daylight: true,
      cyc_wall: false,
      kitchen_set: false,
      blackout: false,
      parking: false,
      truck_access: false,
      ac: true,
      changing_rooms: false,
      wifi: true,
      makeup_room: false,
    }),
    rules: JSON.stringify({
      overtime_rate: 380,
      cancellation_policy: '100% refund if cancelled 24+ hours before. No refund within 24 hours.',
      minimum_hours: 1,
      deposit_percent: 50,
      notes: 'Street parking available. Max 8 people. No pets.',
    }),
    contact_email: 'garage@creativespace.ae',
    contact_phone: '+971 4 344 8800',
    contact_whatsapp: '+971 50 344 8800',
  },
  {
    id: 'studio-006',
    name: 'HotCold Rental',
    slug: 'hotcold-rental',
    location: 'Al Barsha 1, Dubai',
    district: 'Al Barsha',
    size_category: 'medium',
    sqft: 2100,
    hourly_price: 550,
    half_day_price: 2000,
    full_day_price: 3600,
    description: 'A full-service production rental space known for its flexibility. Convert between a warm lifestyle studio with earthy tones and timber finishes, or a cold architectural white box with industrial steel accents. Comes with a resident gaffer and grip equipment included in the rate. Zero setup time.',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1200&q=80',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
    ]),
    amenities: JSON.stringify({
      daylight: true,
      cyc_wall: false,
      kitchen_set: true,
      blackout: true,
      parking: true,
      truck_access: true,
      ac: true,
      changing_rooms: true,
      wifi: true,
      makeup_room: false,
    }),
    rules: JSON.stringify({
      overtime_rate: 750,
      cancellation_policy: '75% refund if cancelled 48+ hours before. No refund within 48 hours.',
      minimum_hours: 4,
      deposit_percent: 50,
      notes: 'Set conversion (warm/cold) requires 1 hour. Gaffer included. Props from catalogue available at cost.',
    }),
    contact_email: 'rent@hotcold.ae',
    contact_phone: '+971 4 399 7700',
    contact_whatsapp: '+971 56 399 7700',
  },
];

const ADDONS = [
  // Global addons
  { id: 'addon-001', studio_id: null, name: 'Lighting Kit (Full Package)', description: 'Profoto B10 plus heads, stands, modifiers', price: 800, unit: 'per_booking' },
  { id: 'addon-002', studio_id: null, name: 'Studio Assistant', description: 'Professional studio assistant for full day', price: 600, unit: 'per_day' },
  { id: 'addon-003', studio_id: null, name: 'Props Package', description: 'Curated selection of lifestyle and decor props', price: 400, unit: 'per_booking' },
  { id: 'addon-004', studio_id: null, name: 'Grip Package', description: 'C-stands, flags, scrims, apple boxes', price: 350, unit: 'per_booking' },
  { id: 'addon-005', studio_id: null, name: 'Teleprompter', description: 'iPad-based teleprompter with remote', price: 250, unit: 'per_booking' },
  // Studio-specific
  { id: 'addon-006', studio_id: 'studio-001', name: 'Cyc Wall Repaint', description: 'Fresh white repaint of cyclorama wall', price: 1200, unit: 'per_booking' },
  { id: 'addon-007', studio_id: 'studio-002', name: 'LED Grid Package', description: 'Full overhead LED grid control system', price: 1500, unit: 'per_booking' },
  { id: 'addon-008', studio_id: 'studio-003', name: 'Natural Light Enhancement', description: 'Silk diffusion for skylight control', price: 300, unit: 'per_booking' },
  { id: 'addon-009', studio_id: 'studio-005', name: 'Backdrop Change', description: 'Change to any of 8 available backdrop colors', price: 150, unit: 'per_change' },
  { id: 'addon-010', studio_id: 'studio-006', name: 'Set Conversion', description: 'Warm to cold or cold to warm mid-booking', price: 400, unit: 'per_change' },
];

function generateAvailability(db) {
  const insertBlock = db.prepare(`
    INSERT OR IGNORE INTO availability_blocks (id, studio_id, date, start_hour, end_hour, block_type)
    VALUES (?, ?, ?, ?, ?, 'available')
  `);

  // Generate 60 days of availability from today
  const today = new Date();
  
  for (const studio of STUDIOS) {
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const date = format(addDays(today, dayOffset), 'yyyy-MM-dd');
      // Studios open 6am to 11pm (hours 6-23)
      // Create one block per hour
      for (let hour = 6; hour < 23; hour++) {
        insertBlock.run(
          `avail-${studio.id}-${date}-${hour}`,
          studio.id,
          date,
          hour,
          hour + 1
        );
      }
    }
    
    // Create some realistic "already booked" slots for demo purposes
    const demoBookings = [
      { dayOffset: 2, start: 9, end: 14 },
      { dayOffset: 3, start: 8, end: 18 },
      { dayOffset: 5, start: 13, end: 17 },
      { dayOffset: 7, start: 10, end: 12 },
    ];
    
    for (const demo of demoBookings) {
      const date = format(addDays(today, demo.dayOffset), 'yyyy-MM-dd');
      for (let hour = demo.start; hour < demo.end; hour++) {
        db.prepare(`
          UPDATE availability_blocks 
          SET block_type = 'booked'
          WHERE studio_id = ? AND date = ? AND start_hour = ?
        `).run(studio.id, date, hour);
      }
    }
  }
}

function seed() {
  const db = getDb();

  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec('DELETE FROM addons; DELETE FROM availability_blocks; DELETE FROM bookings; DELETE FROM studios;');

  // Insert studios
  const insertStudio = db.prepare(`
    INSERT INTO studios (id, name, slug, location, district, size_category, sqft, hourly_price, half_day_price, full_day_price, description, images, amenities, rules, contact_email, contact_phone, contact_whatsapp)
    VALUES (@id, @name, @slug, @location, @district, @size_category, @sqft, @hourly_price, @half_day_price, @full_day_price, @description, @images, @amenities, @rules, @contact_email, @contact_phone, @contact_whatsapp)
  `);

  for (const studio of STUDIOS) {
    insertStudio.run(studio);
    console.log(`  ✓ Studio: ${studio.name}`);
  }

  // Insert addons
  const insertAddon = db.prepare(`
    INSERT INTO addons (id, studio_id, name, description, price, unit)
    VALUES (@id, @studio_id, @name, @description, @price, @unit)
  `);

  for (const addon of ADDONS) {
    insertAddon.run(addon);
  }
  console.log(`  ✓ ${ADDONS.length} add-ons seeded`);

  // Generate availability
  generateAvailability(db);
  console.log('  ✓ Availability blocks generated (60 days)');

  console.log('\n✅ Database seeded successfully!');
}

seed();
