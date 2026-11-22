import type { RailwayStation } from '@/types/railway';

export interface StationCardProps {
  station: RailwayStation;
  selected?: boolean;
  onClick?: (id: string) => void;
}

export default function StationCard({ station, selected = false, onClick }: StationCardProps) {
  const handleClick = () => {
    if (onClick) onClick(station.id);
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
          <h3 className="font-semibold text-white truncate">{station.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{station.id} · {station.region}</p>
        </div>
        <span
          className={`shrink-0 w-2 h-2 rounded-full ${station.interchange ? 'bg-amber-400' : 'bg-slate-400'}`}
          title={station.interchange ? 'Interchange station' : 'No interchange'}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {station.lines.slice(0, 3).map((lineId) => (
          <span
            key={lineId}
            className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-300"
          >
            {lineId}
          </span>
        ))}
        {station.lines.length > 3 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
            +{station.lines.length - 3}
          </span>
        )}
      </div>
    </button>
  );
}
