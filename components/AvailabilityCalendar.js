import { useState } from 'react';
import { format, addDays, parseISO } from 'date-fns';

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

function formatHour(h) {
  if (h === 12) return '12P';
  if (h === 0) return '12A';
  return h < 12 ? `${h}A` : `${h - 12}P`;
}

export default function AvailabilityCalendar({ 
  availability, 
  selectedDate, 
  onDateChange,
  selectedStart,
  selectedEnd,
  onSlotSelect,
}) {
  const dates = Object.keys(availability).sort().slice(0, 14);
  const dayBlocks = availability[selectedDate]?.blocks || [];

  // Determine slot status for a given hour
  const getSlotStatus = (hour) => {
    const block = dayBlocks.find(b => b.start_hour === hour);
    if (!block) return 'unavailable';
    return block.block_type;
  };

  // Handle time selection
  const handleHourClick = (hour) => {
    if (getSlotStatus(hour) === 'booked') return;
    if (!onSlotSelect) return;

    if (selectedStart === null || selectedStart === undefined) {
      onSlotSelect(hour, null);
    } else if (selectedEnd === null || selectedEnd === undefined) {
      if (hour <= selectedStart) {
        onSlotSelect(hour, null);
      } else {
        // Check all hours in range are available
        const allAvailable = Array.from(
          { length: hour - selectedStart }, 
          (_, i) => selectedStart + i
        ).every(h => getSlotStatus(h) === 'available');
        
        if (allAvailable) {
          onSlotSelect(selectedStart, hour);
        } else {
          onSlotSelect(hour, null);
        }
      }
    } else {
      onSlotSelect(hour, null);
    }
  };

  const getDayStatus = (date) => {
    const data = availability[date];
    if (!data) return 'unknown';
    return data.status;
  };

  const getDayStatusClass = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'text-emerald-400 border-emerald-800/40';
      case 'PARTIAL': return 'text-amber-400 border-amber-800/40';
      case 'BOOKED': return 'text-red-400/50 border-red-900/20 opacity-50';
      default: return 'text-obsidian-500 border-obsidian-700';
    }
  };

  return (
    <div>
      {/* Date strip */}
      <div className="mb-4">
        <div className="section-label mb-3">Select Date</div>
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {dates.map(date => {
            const d = parseISO(date);
            const status = getDayStatus(date);
            const isSelected = date === selectedDate;
            
            return (
              <button
                key={date}
                onClick={() => onDateChange(date)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 border transition-colors min-w-[52px] ${
                  isSelected 
                    ? 'bg-sand-500/20 border-sand-500/60 text-sand-300'
                    : `${getDayStatusClass(status)} hover:border-obsidian-500`
                }`}
              >
                <span className="text-xs font-mono uppercase tracking-wide opacity-70">
                  {format(d, 'EEE')}
                </span>
                <span className="text-sm font-mono font-medium mt-0.5">
                  {format(d, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly grid */}
      <div>
        <div className="section-label mb-3">
          Select Time — {format(parseISO(selectedDate), 'EEEE, d MMMM')}
        </div>
        
        {onSlotSelect && (
          <p className="text-xs text-obsidian-500 mb-3 font-mono">
            {selectedStart === null || selectedStart === undefined
              ? 'Click a time to set start'
              : selectedEnd === null || selectedEnd === undefined
              ? `Start: ${formatHour(selectedStart)} — click end time`
              : `${formatHour(selectedStart)} → ${formatHour(selectedEnd)} (${selectedEnd - selectedStart}h)`
            }
          </p>
        )}

        <div className="grid grid-cols-8 sm:grid-cols-17 gap-0.5">
          {HOURS.map(hour => {
            const status = getSlotStatus(hour);
            const isInRange = selectedStart !== null && selectedStart !== undefined 
              && selectedEnd !== null && selectedEnd !== undefined
              && hour >= selectedStart && hour < selectedEnd;
            const isStart = hour === selectedStart;
            const isAvailable = status === 'available';
            
            return (
              <button
                key={hour}
                onClick={() => handleHourClick(hour)}
                disabled={!isAvailable || !onSlotSelect}
                className={`
                  h-10 flex flex-col items-center justify-center text-xs transition-colors border
                  ${isInRange || isStart
                    ? 'bg-sand-600/40 border-sand-500/60 text-sand-200'
                    : status === 'available'
                    ? 'bg-emerald-900/20 border-emerald-800/30 text-emerald-400 hover:bg-emerald-900/40 cursor-pointer'
                    : 'bg-red-900/10 border-red-900/20 text-red-400/40 cursor-not-allowed'
                  }
                `}
              >
                <span className="font-mono leading-none">{formatHour(hour)}</span>
                {status === 'booked' && <span className="text-[8px] opacity-60 leading-none mt-0.5">●</span>}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-900/40 border border-emerald-800/40" />
            <span className="text-xs font-mono text-obsidian-500">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-sand-600/40 border border-sand-500/60" />
            <span className="text-xs font-mono text-obsidian-500">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-900/20 border border-red-900/30" />
            <span className="text-xs font-mono text-obsidian-500">Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
