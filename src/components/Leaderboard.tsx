import React from 'react';
import { Award, ShieldAlert, CheckCircle, MapPin, Trophy, Star } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
}

export default function Leaderboard({ entries, isLoading }: LeaderboardProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Trophy className="w-8 h-8 animate-spin text-brand-primary mb-2" />
        <span>Loading leaderboards...</span>
      </div>
    );
  }

  const topThreeMedals = [
    { rank: 1, medalColor: 'text-amber-400', bgGlow: 'shadow-amber-500/10 border-amber-500/20 bg-amber-500/5' },
    { rank: 2, medalColor: 'text-slate-300', bgGlow: 'shadow-slate-300/10 border-slate-300/20 bg-slate-300/5' },
    { rank: 3, medalColor: 'text-amber-600', bgGlow: 'shadow-amber-600/10 border-amber-600/20 bg-amber-600/5' }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      {/* Title */}
      <div className="text-center space-y-2 border-b border-slate-800 pb-5">
        <h1 className="font-display font-bold text-xl text-white flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6 text-brand-primary" /> Locality Leaderboard
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Earn reputation XP by reporting real civic issues (+15 XP) and verifying local reports (+5 XP). Top contributors keep our streets safe.
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {entries.slice(0, 3).map((entry, index) => {
          const medal = topThreeMedals[index];
          const initials = entry.name.split(' ').map(n => n[0]).join('');
          return (
            <div
              key={entry.userId}
              className={`border p-4 rounded-xl flex flex-col items-center text-center relative overflow-hidden shadow-xl ${medal.bgGlow}`}
            >
              {/* Rank Badge */}
              <div className="absolute top-3 left-3 bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400">
                Rank #{index + 1}
              </div>

              {/* Medal Icon */}
              <div className="absolute top-3 right-3">
                <Star className={`w-5 h-5 fill-current ${medal.medalColor}`} />
              </div>

              <div className="w-14 h-14 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center font-display font-bold text-brand-primary text-lg mt-4 mb-3">
                {initials}
              </div>

              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-xs text-white">{entry.name}</h3>
                <span className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-0.5">
                  <MapPin className="w-3 h-3 text-brand-primary" /> {entry.ward} Ward
                </span>
              </div>

              <div className="text-brand-primary font-mono font-bold text-sm mt-3 bg-brand-primary/10 px-3 py-1 rounded-lg border border-brand-primary/20">
                {entry.reputation} XP
              </div>

              {/* Contribution summary */}
              <div className="grid grid-cols-2 gap-4 w-full border-t border-slate-800/40 mt-4 pt-3 text-[10px] text-slate-400">
                <div>
                  <span className="font-bold text-slate-300 block">{entry.reportsCount}</span>
                  <span>Reports</span>
                </div>
                <div>
                  <span className="font-bold text-slate-300 block">{entry.verificationsCount}</span>
                  <span>Verifications</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Rankings Table */}
      <div className="bg-brand-panel border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Rankings</h3>
          <span className="text-[10px] text-slate-500 font-mono">Sorted by XP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-5">Rank</th>
                <th className="py-3 px-4">Citizen</th>
                <th className="py-3 px-4">Ward</th>
                <th className="py-3 px-4 text-center">Filed Reports</th>
                <th className="py-3 px-4 text-center">Audited Votes</th>
                <th className="py-3 px-5 text-right">Reputation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {entries.map((entry, index) => (
                <tr key={entry.userId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-400">
                    #{index + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center font-display font-bold text-brand-primary text-xs shrink-0">
                        {entry.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-semibold text-slate-200">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-brand-primary" /> {entry.ward}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-300 font-mono">
                    {entry.reportsCount}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-300 font-mono">
                    {entry.verificationsCount}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="font-mono font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-0.5 rounded-lg">
                      {entry.reputation} XP
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
