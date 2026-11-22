'use client';

import { useState, useEffect } from 'react';
import { MapPin, Route, ArrowLeft, Users } from 'lucide-react';
import JourneyCard from '@/components/journeys/journey-card';
import type { Route as RouteType } from '@/types/railway';

export default function JourneysPage() {
  const [stations] = useState<any[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [origin, setOrigin] = useState<string>('');
  const [dest, setDest] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample stations from the dataset
  const sampleStations = [
    { id: 'JAKK', name: 'Jakarta Kota' },
    { id: 'MRI', name: 'Manggarai' },
    { id: 'THB', name: 'Tanah Abang' },
    { id: 'BD', name: 'Bandung' },
    { id: 'BNI', name: 'BNI City' },
    { id: 'TPK', name: 'Tanjung Priok' },
    { id: 'CKR', name: 'Cikarang' },
    { id: 'ML', name: 'Malang' },
    { id: 'SY', name: 'Solo Balapan' },
    { id: 'GMR', name: 'Gambir' },
  ];

  const handlePlan = async () => {
    if (!origin || !dest) {
      setError('Please select both origin and destination.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/journeys/plan?origin=' + origin + '&dest=' + dest);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to plan route');
        return;
      }
      setRoutes([data.data]);
    } catch (err) {
      setError('Failed to plan route');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Journeys</h1>
            <p className="text-sm text-slate-400 mt-1">
              Plan routes between stations across the Indonesian railway network.
            </p>
          </div>
        </div>

        <div className="glass p-5 rounded-xl mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">
                Origin
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-rail-500"
              >
                <option value="">Select origin station</option>
                {sampleStations.map((s) => (
                  <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">
                Destination
              </label>
              <select
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-rail-500"
              >
                <option value="">Select destination station</option>
                {sampleStations.map((s) => (
                  <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handlePlan}
            disabled={loading || !origin || !dest}
            className="mt-3 px-4 py-2 rounded-lg bg-rail-500 text-white text-sm font-medium hover:bg-rail-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Planning...' : 'Find Route'}
          </button>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        {routes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Available Routes</h2>
            <div className="space-y-3">
              {routes.map((route, idx) => (
                <JourneyCard
                  key={idx}
                  journey={route}
                  selected={idx === 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
