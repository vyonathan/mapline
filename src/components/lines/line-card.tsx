import type { RailwayLine } from '@/types/railway';

export interface LineCardProps {
  line: RailwayLine;
  selected?: boolean;
  onClick?: (id: string) => void;
}

export default function LineCard({ line, selected = false, onClick }: LineCardProps) {
  const handleClick = () => {
    if (onClick) onClick(line.id);
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
          <h3 className="font-semibold text-white truncate">{line.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{line.shortName} · {line.region}</p>
        </div>
        <span
          className="shrink-0 w-3 h-3 rounded-full"
          style={{ backgroundColor: line.color }}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-300">
          {line.category}
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-300">
          {line.operator}
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-300">
          {line.headway}
        </span>
      </div>
    </button>
  );
}
