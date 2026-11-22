import type { TrainPosition } from '@/features/simulation/simulation-engine';
import { getLineById } from '@/lib/railway-data';

export interface TrainCardProps {
  train: TrainPosition;
  selected?: boolean;
  onClick?: (ka: string) => void;
}

export default function TrainCard({ train, selected = false, onClick }: TrainCardProps) {
  const line = getLineById(train.lineId);
  const categoryLabel = train.category === 'KAJJ' ? 'Intercity' : train.category === 'BARANG' ? 'Freight' : 'Commuter';
  const color = line?.color ?? '#0a84ff';

  const handleClick = () => {
    if (onClick) onClick(train.ka);
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
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{train.ka}</h3>
            <p className="text-xs text-slate-500 truncate">{train.routeTitle}</p>
          </div>
        </div>
        <span
          className="shrink-0 text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400"
        >
          {categoryLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            📍 {train.stationSequence[0]} → {train.stationSequence[train.stationSequence.length - 1]}
          </span>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-1">
            {train.stopTime} min — {Math.round((train.stopTime / 1440) * 100)}% complete
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {train.pos[0].toFixed(4)}, {train.pos[1].toFixed(4)}
        </span>
      </div>
    </button>
  );
}
