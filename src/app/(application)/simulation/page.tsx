use client
import { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, MapPin, Clock, Zap } from 'lucide-react';
import {
  getSimClock,
  setSimSpeed,
  pauseSim,
  resumeSim,
  stepSim,
  resetSim,
  syncToLiveClock,
  getSimSpeed,
} from '@/features/simulation/simulation-engine';
import { STATIONS } from '@/lib/railway-data';

export default function SimulationPage() {
  const [simClock, setSimClock] = useState(getSimClock());
  const [speed, setSpeed] = useState(getSimSpeed());

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      syncToLiveClock();
      setSimClock(getSimClock());
      setSpeed(getSimSpeed());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSpeedChange = (newSpeed: number) => {
    setSimSpeed(newSpeed);
    setSpeed(newSpeed);
  };

  const handleStep = () => {
    stepSim(1);
  };

  const handleReset = () => {
    resetSim();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Train Simulation</h1>
            <p className="text-sm text-slate-400 mt-1">
              Watch trains move along the railway network in real-time (WIB).
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>{simClock.minutes % 3600}:{(simClock.minutes % 60).toFixed(0).padStart(2, '0')} WIB</span>
          </div>
        </div>

        {/* Controls */}
        <div className="glass p-5 rounded-xl mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>

            <div className="flex items-center gap-2 ml-4">
              <Pause className="w-5 h-5 text-slate-400" />
              <button
                onClick={pauseSim}
                className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all"
              >
                Pause
              </button>
              <button
                onClick={resumeSim}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
              >
                Play
              </button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Zap className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSpeedChange(0)}
                  className={`px-2 py-1 rounded text-xs ${speed === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'}`}
                >
                  0×
                </button>
                <button
                  onClick={() => handleSpeedChange(1)}
                  className={`px-2 py-1 rounded text-xs ${speed === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'}`}
                >
                  1×
                </button>
                <button
                  onClick={() => handleSpeedChange(2)}
                  className={`px-2 py-1 rounded text-xs ${speed === 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'}`}
                >
                  2×
                </button>
                <button
                  onClick={() => handleSpeedChange(5)}
                  className={`px-2 py-1 rounded text-xs ${speed === 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-500'}`}
                >
                  5×
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Map preview */}
        <div className="glass p-5 rounded-xl mb-6">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-4 h-4 text-rail-400" />
            <h2 className="text-sm font-semibold text-slate-300">
              Simulation active — trains running on railway network
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            Train positions are recalculated on each simulation tick using cached railway
            segment paths. The simulation clock tracks WIB (UTC+7) time.
          </p>
        </div>

        {/* Station list */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Tracked Stations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {STATIONS.slice(0, 10).map((st) => (
              <div
                key={st.id}
                className="glass p-4 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rail-400" />
                  <span className="text-sm font-medium text-white">{st.id}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{st.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{st.region}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
