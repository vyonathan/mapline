import { useState, useEffect } from 'react';
import { Search, Route, MapPin } from 'lucide-react';
import LineCard from '@/components/lines/line-card';
import type { RailwayLine } from '@/types/railway';

export default function LinesPage() {
  const [lines, setLines] = useState<RailwayLine[]>([]);
  const [query, setQuery] = useState('');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/lines')
      .then((res) => res.json())
      .then((data) => setLines(data.data))
      .catch((err) => console.error('Failed to load lines:', err));
  }, []);

  const filtered = lines.filter((l) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.shortName.toLowerCase().includes(q) ||
      l.region.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Railway Lines</h1>
            <p className="text-sm text-slate-400 mt-1">
              Explore {lines.length} railway lines across Indonesia.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search lines..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rail-500"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No lines match your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                selected={selectedLine === line.id}
                onClick={setSelectedLine}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
