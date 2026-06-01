const { format } = require('date-fns');

/**
 * Generates an HTML booking contract.
 * Returns HTML string that can be served as a downloadable document.
 */
function generateContract(booking, studio) {
  const rules = typeof studio.rules === 'string' ? JSON.parse(studio.rules) : studio.rules;
  const addons = typeof booking.addons === 'string' ? JSON.parse(booking.addons) : (booking.addons || []);
  
  const startTime = `${String(booking.start_hour).padStart(2, '0')}:00`;
  const endTime = `${String(booking.end_hour).padStart(2, '0')}:00`;
  const bookingDate = booking.date;
  const issuedDate = format(new Date(), 'dd MMMM yyyy');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Booking Contract — ${booking.id}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; color: #1a1a1a; background: #fff; padding: 60px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #1a1a1a; padding-bottom: 24px; margin-bottom: 32px; }
  .brand { font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: #888; margin-bottom: 8px; }
  h1 { font-size: 28px; font-weight: normal; }
  .contract-id { font-size: 11px; color: #888; margin-top: 4px; }
  .section { margin-bottom: 32px; }
  .section-title { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #888; margin-bottom: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { margin-bottom: 12px; }
  .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 2px; }
  .field-value { font-size: 15px; }
  .price-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .price-row.total { border-top: 2px solid #1a1a1a; border-bottom: none; font-weight: bold; font-size: 17px; padding-top: 12px; margin-top: 4px; }
  .price-row.deposit { color: #d08428; font-weight: bold; }
  .terms { background: #f8f8f8; padding: 24px; font-size: 13px; line-height: 1.8; }
  .terms p { margin-bottom: 12px; }
  .status-badge { display: inline-block; background: #1a1a1a; color: #fff; font-size: 11px; letter-spacing: 2px; padding: 4px 12px; text-transform: uppercase; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 40px; }
  .sig-line { border-top: 1px solid #1a1a1a; padding-top: 8px; font-size: 12px; color: #888; }
  .watermark { text-align: center; margin-top: 48px; font-size: 11px; color: #ccc; letter-spacing: 2px; text-transform: uppercase; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>

<div class="header">
  <div class="brand">Dubai Studio Booking Platform</div>
  <h1>Production Studio Booking Agreement</h1>
  <div class="contract-id">Contract No: ${booking.id.toUpperCase()} &nbsp;|&nbsp; Issued: ${issuedDate}</div>
</div>

<div class="section">
  <div class="section-title">Booking Status</div>
  <span class="status-badge">✓ Confirmed</span>
</div>

<div class="section">
  <div class="section-title">Studio</div>
  <div class="grid-2">
    <div>
      <div class="field">
        <div class="field-label">Studio Name</div>
        <div class="field-value">${studio.name}</div>
      </div>
      <div class="field">
        <div class="field-label">Location</div>
        <div class="field-value">${studio.location}</div>
      </div>
      <div class="field">
        <div class="field-label">Size</div>
        <div class="field-value">${studio.sqft.toLocaleString()} sqft (${studio.size_category})</div>
      </div>
    </div>
    <div>
      <div class="field">
        <div class="field-label">Studio Contact</div>
        <div class="field-value">${studio.contact_email}</div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${studio.contact_phone}</div>
      </div>
      <div class="field">
        <div class="field-label">WhatsApp</div>
        <div class="field-value">${studio.contact_whatsapp}</div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Client Details</div>
  <div class="grid-2">
    <div>
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${booking.user_name}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">${booking.user_email}</div>
      </div>
    </div>
    <div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${booking.user_phone || 'N/A'}</div>
      </div>
      <div class="field">
        <div class="field-label">Company / Agency</div>
        <div class="field-value">${booking.user_company || 'N/A'}</div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Booking Details</div>
  <div class="grid-2">
    <div>
      <div class="field">
        <div class="field-label">Date</div>
        <div class="field-value">${bookingDate}</div>
      </div>
      <div class="field">
        <div class="field-label">Time</div>
        <div class="field-value">${startTime} — ${endTime}</div>
      </div>
    </div>
    <div>
      <div class="field">
        <div class="field-label">Duration</div>
        <div class="field-value">${booking.duration_hours} hours</div>
      </div>
      <div class="field">
        <div class="field-label">Add-ons</div>
        <div class="field-value">${addons.length > 0 ? addons.map(a => a.name).join(', ') : 'None'}</div>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Pricing</div>
  <div class="price-row">
    <span>Studio hire (${booking.duration_hours} hrs × AED ${studio.hourly_price}/hr)</span>
    <span>AED ${booking.base_price.toLocaleString()}</span>
  </div>
  ${addons.map(a => `
  <div class="price-row">
    <span>${a.name}</span>
    <span>AED ${a.price.toLocaleString()}</span>
  </div>`).join('')}
  <div class="price-row total">
    <span>Total</span>
    <span>AED ${booking.total_price.toLocaleString()}</span>
  </div>
  <div class="price-row deposit">
    <span>Deposit Paid (50%)</span>
    <span>AED ${booking.deposit_amount.toLocaleString()}</span>
  </div>
  <div class="price-row">
    <span>Balance Due on Day</span>
    <span>AED ${(booking.total_price - booking.deposit_amount).toLocaleString()}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">Terms & Conditions</div>
  <div class="terms">
    <p><strong>Cancellation Policy:</strong> ${rules.cancellation_policy}</p>
    <p><strong>Overtime:</strong> AED ${rules.overtime_rate}/hour. Overtime must be requested at least 30 minutes before scheduled wrap. Subject to studio availability.</p>
    <p><strong>Payment:</strong> The deposit of AED ${booking.deposit_amount.toLocaleString()} has been paid to confirm this booking. The balance of AED ${(booking.total_price - booking.deposit_amount).toLocaleString()} is due at the beginning of the shoot day, prior to studio access being granted.</p>
    <p><strong>Studio Rules:</strong> ${rules.notes}</p>
    <p><strong>Liability:</strong> The client is responsible for any damage to the studio, equipment, or fixtures caused during their booking period. The studio operator's liability is limited to the value of the booking fee paid.</p>
    <p><strong>Force Majeure:</strong> Neither party shall be liable for cancellation due to circumstances beyond reasonable control, including but not limited to natural disasters or government restrictions.</p>
    <p><strong>Governing Law:</strong> This agreement is governed by the laws of the United Arab Emirates and the Emirate of Dubai.</p>
  </div>
</div>

<div class="signatures">
  <div>
    <div class="sig-line">Client Signature &amp; Date</div>
  </div>
  <div>
    <div class="sig-line">Studio Representative &amp; Date</div>
  </div>
</div>

<div class="watermark">Dubai Studio Booking Platform &nbsp;·&nbsp; studiobooking.ae &nbsp;·&nbsp; ${issuedDate}</div>

</body>
</html>`;
}

module.exports = { generateContract };
