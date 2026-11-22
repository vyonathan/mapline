import type { Route } from '@/types/railway';
import { formatTimeWIB } from '@/lib/railway-data';

export interface JourneyCardProps {
  journey: Route;
  selected?: boolean;
  onClick?: (journey: Route) => void;
}

export default function JourneyCard({ journey, selected = false, onClick }: JourneyCardProps) {
  const handleClick = () => {
    if (onClick) onClick(journey);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all duration-150
        ${selected
          ? 'border-rail-500 bg-rail-500/5'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-white truncate">
            {journey.originId} → {journey.destId}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {journey.steps.length} leg{journey.steps.length !== 1 ? 's' : ''} · {journey.transfers} transfer{journey.transfers !== 1 ? 's' : ''}
          </p>
        </div>
        <span
          className="shrink-0 text-xs px-2 py-1 rounded-full bg-rail-500/10 text-rail-300"
        >
          {journey.totalDistanceKm.toFixed(1)} km
        </span>
      </div>

      {/* Route steps */}
      <div className="mt-3 space-y-2">
        {journey.steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs text-slate-400"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#0a84ff' }}
            />
            <span className="truncate">
              {step.from} → {step.to}
            </span>
            <span className="ml-auto text-slate-500">
              {step.lineId}
            </span>
          </div>
        ))}
      </div>

      {/* Route summary */}
      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-slate-500">
        {journey.stationSequence.length > 0
          ? (() => {
              const first = journey.stationSequence[0];
              const last = journey.stationSequence[journey.stationSequence.length - 1];
              return first && last ? `${first} → ${last}` : '—';
            })()
          : '—'}
        <span>{journey.totalDistanceKm.toFixed(1)} km</span>
      </div>
    </button>
  );
}

function stationName(id: string): string {
  // In a real app, this would look up the station name
  return id;
}
