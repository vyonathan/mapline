import type { TimetableTrip, TimetableMetadata } from '@/types/railway';
import { formatTimeWIB } from '@/lib/railway-data';

export interface TimetableVersionCardProps {
  version: TimetableMetadata;
  tripCount: number;
  selected?: boolean;
  onClick?: (version: string) => void;
}

export default function TimetableVersionCard({ version, tripCount, selected = false, onClick }: TimetableVersionCardProps) {
  const handleClick = () => {
    if (onClick) onClick(version.version);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full text-left p-5 rounded-xl border-2 transition-all duration-150
        ${selected
          ? 'border-rail-500 bg-rail-500/5'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">GAPEKA {version.version}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{version.authority}</p>
          <p className="text-xs text-slate-500 mt-1">
            {tripCount} trips · {version.scheduleSource}
          </p>
        </div>
        <span
          className={`shrink-0 text-xs px-2 py-1 rounded-full ${
            version.isSyntheticEstimate
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {version.isSyntheticEstimate ? 'Synthetic Estimate' : 'Official Schedule'}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-300 leading-relaxed">{version.disclaimer}</p>
    </button>
  );
}

export interface TimetableListProps {
  trips: TimetableTrip[];
  activeStationId?: string;
}

export function TimetableList({ trips, activeStationId }: TimetableListProps) {
  // Filter trips that stop at the active station
  const filtered = activeStationId
    ? trips.filter((t) => t.stops.some((s) => s.stationId === activeStationId))
    : trips;

  return (
    <div>
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No trips found for this station.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((trip) => {
            const firstStop = trip.stops[0];
            const atStation = firstStop?.stationId === activeStationId;
            const dest = trip.stops[trip.stops.length - 1];
            return (
              <div
                key={trip.ka}
                className="glass p-4 rounded-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{trip.ka}</p>
                    <p className="text-xs text-slate-400 truncate">{trip.routeTitle}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      {atStation ? '🛫 Departs now' : '→'} {dest?.stationId}
                    </span>
                    <span className="text-slate-400">
                      {formatTimeWIB(firstStop?.time ?? 0)}
                    </span>
                    <span className="text-slate-400">
                      {formatTimeWIB(dest?.time ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
