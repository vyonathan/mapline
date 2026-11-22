import type { RailwayStation } from '@/types/railway';

export interface StationDetailProps {
  station: RailwayStation;
  lines: import('@/types/railway').RailwayLine[];
  trips: import('@/types/railway').TimetableTrip[];
}

export default function StationDetail({ station, lines, trips }: StationDetailProps) {
  const stationLines = lines.filter((l) => station.lines.includes(l.id));
  const stationTrips = trips.filter((t) =>
    t.stops.some((s) => s.stationId === station.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{station.name}</h2>
          <p className="text-sm text-slate-400 mt-1">
            {station.id} · {station.region}{' '}
            <span className="inline-flex items-center gap-1">
              {station.interchange ? '🔄 Interchange' : '—'}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400">
            {station.lines.length} lines
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400">
            {stationTrips.length} trips
          </span>
        </div>
      </div>

      {/* Station info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Coordinates</p>
          <p className="text-sm font-mono text-slate-300 mt-1">
            {station.coords[0].toFixed(5)}, {station.coords[1].toFixed(5)}
          </p>
        </div>
        <div className="glass p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Region</p>
          <p className="text-sm text-slate-300 mt-1">{station.region}</p>
        </div>
      </div>

      {/* Associated lines */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Associated Lines</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stationLines.map((line) => (
            <div
              key={line.id}
              className="glass p-4 rounded-xl"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <p className="text-sm font-medium text-white mt-2">{line.name}</p>
              <p className="text-xs text-slate-400">{line.operator} · {line.category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Departures */}
      {stationTrips.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Departures ({stationTrips.length})
          </h3>
          <div className="space-y-2">
            {stationTrips.map((trip) => {
              const firstStop = trip.stops[0];
              const lastStop = trip.stops[trip.stops.length - 1];
              const isAtStation = firstStop?.stationId === station.id;
              return (
                <div
                  key={trip.ka}
                  className="glass p-3 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{trip.ka}</span>
                    <span className="text-xs text-slate-400">
                      {isAtStation ? '🛫 At' : '→'} {lastStop?.stationId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{trip.routeTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatTime(firstStop?.time ?? 0)} — {formatTime(lastStop?.time ?? 0)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No timetable data available for this station.</p>
      )}
    </div>
  );
}

function formatTime(minutes: number): string {
  const total = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
