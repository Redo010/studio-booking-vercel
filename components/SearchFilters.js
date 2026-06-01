import { useState } from 'react';
import { format, addDays } from 'date-fns';

const REQUIREMENTS = [
  { key: 'daylight', label: 'Daylight', icon: '☀' },
  { key: 'cyc_wall', label: 'Cyc Wall', icon: '◻' },
  { key: 'kitchen_set', label: 'Kitchen Set', icon: '⚏' },
  { key: 'blackout', label: 'Blackout', icon: '◼' },
  { key: 'parking', label: 'Parking', icon: '⊡' },
  { key: 'truck_access', label: 'Truck Access', icon: '⊞' },
];

const DURATIONS = [
  { label: '2 hrs', hours: 2 },
  { label: '4 hrs', hours: 4 },
  { label: '6 hrs', hours: 6 },
  { label: '8 hrs', hours: 8 },
  { label: '10 hrs', hours: 10 },
  { label: '12 hrs', hours: 12 },
];

export default function SearchFilters({ onSearch, loading }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [startHour, setStartHour] = useState(9);
  const [duration, setDuration] = useState(8);
  const [size, setSize] = useState('');
  const [requirements, setRequirements] = useState([]);

  const endHour = startHour + duration;

  const toggleRequirement = (key) => {
    setRequirements(prev => 
      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
    );
  };

  const handleSearch = () => {
    onSearch({
      date,
      start_hour: startHour,
      end_hour: endHour,
      size,
      requirements,
    });
  };

  const formatHour = (h) => {
    if (h === 12) return '12 PM';
    if (h === 0) return '12 AM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };

  return (
    <div className="bg-obsidian-900 border border-obsidian-700 p-6">
      <div className="section-label mb-5">Search Criteria</div>
      
      <div className="grid grid-cols-1 gap-5">
        {/* Date */}
        <div>
          <label className="block text-xs font-mono text-obsidian-400 uppercase tracking-widest mb-2">
            Shoot Date
          </label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={e => setDate(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-xs font-mono text-obsidian-400 uppercase tracking-widest mb-2">
            Start Time: <span className="text-sand-400">{formatHour(startHour)}</span>
          </label>
          <input
            type="range"
            min={6}
            max={20}
            value={startHour}
            onChange={e => setStartHour(parseInt(e.target.value))}
            className="w-full accent-sand-500 h-1.5 cursor-pointer"
          />
          <div className="flex justify-between text-xs font-mono text-obsidian-600 mt-1">
            <span>6 AM</span>
            <span>8 PM</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-mono text-obsidian-400 uppercase tracking-widest mb-2">
            Duration — ends {formatHour(endHour)}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {DURATIONS.map(({ label, hours }) => (
              <button
                key={hours}
                onClick={() => setDuration(hours)}
                className={`py-2 text-xs font-mono border transition-colors ${
                  duration === hours
                    ? 'bg-sand-500/20 border-sand-500/60 text-sand-300'
                    : 'border-obsidian-700 text-obsidian-400 hover:border-obsidian-500 hover:text-obsidian-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Studio Size */}
        <div>
          <label className="block text-xs font-mono text-obsidian-400 uppercase tracking-widest mb-2">
            Studio Size
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: '', label: 'Any' },
              { value: 'small', label: 'S' },
              { value: 'medium', label: 'M' },
              { value: 'large', label: 'L' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSize(value)}
                className={`py-2 text-xs font-mono border transition-colors ${
                  size === value
                    ? 'bg-sand-500/20 border-sand-500/60 text-sand-300'
                    : 'border-obsidian-700 text-obsidian-400 hover:border-obsidian-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-xs font-mono text-obsidian-400 uppercase tracking-widest mb-2">
            Must Have
          </label>
          <div className="space-y-1.5">
            {REQUIREMENTS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => toggleRequirement(key)}
                className={`w-full flex items-center gap-3 px-3 py-2 border text-left transition-colors text-sm ${
                  requirements.includes(key)
                    ? 'bg-sand-500/10 border-sand-500/40 text-sand-300'
                    : 'border-obsidian-700 text-obsidian-400 hover:border-obsidian-600 hover:text-obsidian-200'
                }`}
              >
                <span className="text-base">{icon}</span>
                <span className="font-mono text-xs tracking-wide">{label}</span>
                {requirements.includes(key) && (
                  <span className="ml-auto text-sand-500 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-obsidian-700 border-t-obsidian-300 rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              Search Studios
              <span className="text-obsidian-600 font-mono text-xs">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
