import type { Metadata } from 'next';
import MaplineMap from '@/components/map/mapline-map';
import { useState } from 'react';
import { MapPin, Route, Train, Map as MapIcon, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Map — Mapline',
  description: 'Interactive railway map of Indonesia. Explore the network, stations, and train simulation.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function MapPage() {
  // Railway simulation train positions (would normally come from the server)
  const trainPositions = [
    { ka: '801A', pos: [-6.1767, 106.8306], lineId: 'BASOETTA' },
    { ka: '802A', pos: [-6.1857, 106.8108], lineId: 'BASOETTA' },
    { ka: '803A', pos: [-6.1857, 106.8108], lineId: 'BASOETTA' },
    { ka: '804A', pos: [-6.2007, 106.819], lineId: 'CIKARANG' },
    { ka: '805A', pos: [-6.2024, 106.8235], lineId: 'CIKARANG' },
  ];

  // Stations tracked in state
  const trackedStations = ['MRI', 'JAKK', 'THB', 'GMR', 'BD'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Map container */}
      <div className="flex-1 relative">
        <MaplineMap
          initialCenter={[-6.215, 106.825]}
          initialZoom={12}
          activeStationIds={trackedStations}
          trainPositions={trainPositions}
          onStationSelect={(stationId) => {
            // Handle station selection (would open a station panel)
            console.log('Station selected:', stationId);
          }}
          onTrainSelect={(ka) => {
            console.log('Train selected:', ka);
          }}
          loading={false}
        />

        {/* Map legend overlay */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <div className="glass px-3 py-2 rounded-lg text-xs text-slate-400">
            <span className="font-medium text-slate-300">Map Legend</span>
            <div className="mt-1 flex flex-wrap gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 rounded bg-rail-500" /> Lines
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-rail-500 border border-white/30" /> Stations
              </span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-2.5 rounded bg-rail-500" /> Trains
              </span>
            </div>
          </div>
        </div>

        {/* Center button - recenter map */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 glass text-sm text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150"
          aria-label="Recenter map"
        >
          <MapIcon className="w-4 h-4" />
          <span>Recenter</span>
        </button>

        {/* Layers toggle */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button className="px-3 py-2 glass text-sm rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150">
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map footer - status bar */}
      <div className="bg-white/5 border-t border-white/10 px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
        <span>WIB {new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
        <span className="hidden sm:inline">Railway mapping &amp; exploration platform</span>
      </div>
    </div>
  );
}
