import type { RailwayLine } from '@/types/railway';
import type { RailwayStation } from '@/types/railway';
import StationCard from '@/components/stations/station-card';
import { getLineById, getStationById } from '@/lib/railway-data';

export interface LineDetailProps {
  line: RailwayLine;
  stations: RailwayStation[];
}

export default function LineDetail({ line, stations }: LineDetailProps) {
  const sequence = line.sequences[0] ?? [];
  const stationIds = sequence.filter((id): id is string => typeof id === 'string');
  const stationData = stationIds
    .map((id) => getStationById(id))
    .filter((s): s is RailwayStation => s !== undefined);

  // Find stations that are NOT on this line (for the "other stations" section)
  const otherStations = stations.filter((s) => !stationIds.includes(s.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{line.name}</h2>
          <p className="text-sm text-slate-400 mt-1">
            {line.shortName} · {line.region} · {line.category}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: `${line.color}20`, color: line.color }}
          >
            {line.color}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400">
            {line.operator}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400">
            {line.headway}
          </span>
        </div>
      </div>

      {/* Route sequence */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Station Sequence</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stationData.map((st, idx) => (
            <div key={st.id} className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: line.color }}
              >
                {idx + 1}
              </div>
              <span className="text-xs text-slate-400 max-w-32 truncate">{st.id}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stations along this line */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Stations ({stationData.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stationData.map((st) => (
            <StationCard key={st.id} station={st} />
          ))}
        </div>
      </div>

      {/* Other stations */}
      {otherStations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Other stations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherStations.map((st) => (
              <StationCard key={st.id} station={st} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
