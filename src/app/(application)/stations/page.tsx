'use client'
import { useState, useEffect } from 'react';
import { Search, MapPin, Route, Clock } from 'lucide-react';
import StationCard from '@/components/stations/station-card';
import { STATIONS, STATION_INDEX, tripsToStation, tripsByLine } from '@/lib/railway-data';
import type { RailwayStation, RailwayLine, TimetableTrip } from '@/types/railway';

export default function StationsPage() {
  const [stations, setStations] = useState<RailwayStation[]>(STATIONS);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [lines, setLines] = useState<RailwayLine[]>([]);
  const [trips, setTrips] = useState<TimetableTrip[]>([]);

  // Load data
  useEffect(() => {
    // In a real app, these would be fetched from the API
    setLines(JSON.parse(localStorage.getItem('mapline_lines') || '[]')
      .filter((l: any) => l)
    );
    if (!lines || lines.length === 0) {
      // Fetch from API on first load
      fetch('/api/lines')
        .then((res) => res.json())
        .then((result) => {
          const linesData = result.data;
          setLines(linesData);
          localStorage.setItem('mapline_lines', JSON.stringify(linesData));
        })
        .catch((err) => console.error('Failed to load lines:', err));
    }
  }, []);

  // Update station list when filters change
  useEffect(() => {
    let filtered = STATIONS;

    if (region !== 'all') {
      filtered = filtered.filter((s) => s.region === region);
    }
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q)
      );
    }

    // Sort by name
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    setStations(filtered);
  }, [query, region]);

  // Load trips for the selected station
  useEffect(() => {
    if (selectedStation) {
      const stationTrips = tripsByLine(trips, selectedStation);
      const stationTrips2 = tripsToStation(trips, selectedStation);
      setTrips([...new Set([...stationTrips, ...stationTrips2])].map((t, i) => t));
    } else {
      setTrips([]);
    }
  }, [selectedStation, trips]);

  const regions = ['all', ...new Set(STATIONS.map((s) => s.region))];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Stations</h1>
            <p className="text-sm text-slate-400 mt-1">
              Explore {STATIONS.length} railway stations across Indonesia.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search stations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rail-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setRegion('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              region === 'all'
                ? 'bg-rail-500/20 text-rail-300'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            All
          </button>
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                region === r
                  ? 'bg-rail-500/20 text-rail-300'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>

        {/* Station list */}
        {stations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No stations match your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {stations.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                selected={selectedStation === station.id}
                onClick={setSelectedStation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
