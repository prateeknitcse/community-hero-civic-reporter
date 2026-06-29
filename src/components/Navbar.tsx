import React, { useState, useEffect } from 'react';
import { Shield, Map, Award, TrendingUp, AlertTriangle, User as UserIcon, RefreshCw, Layers } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  users: User[];
  onSwitchUser: (userId: string) => void;
  refreshData: () => void;
  isLoading: boolean;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSwitchUser,
  refreshData,
  isLoading
}: NavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const tabs = [
    { id: 'map', label: 'Dashboard Map', icon: Map },
    { id: 'report', label: 'Report Issue', icon: AlertTriangle },
    { id: 'impact', label: 'Impact Portal', icon: TrendingUp },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
  ];

  const getAvatarBg = (name: string) => {
    const palette = [
      'bg-emerald-950 text-emerald-300 border border-emerald-800/30',
      'bg-amber-950 text-amber-300 border border-amber-800/30',
      'bg-indigo-950 text-indigo-300 border border-indigo-800/30',
      'bg-rose-950 text-rose-300 border border-rose-800/30',
      'bg-teal-950 text-teal-300 border border-teal-800/30',
      'bg-slate-900 text-slate-300 border border-slate-800'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return palette[sum % palette.length];
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-panel border-b border-slate-800/80 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('map')}>
            <div className="bg-brand-primary text-slate-950 p-2 rounded-xl">
              <Shield className="w-4 h-4 stroke-[2]" id="logo-icon" />
            </div>
            <div>
              <span className="font-display font-semibold text-base tracking-tight text-slate-50">
                Community Hero
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono border border-slate-800 px-1.5 py-0.5 rounded bg-slate-950/40 text-slate-400 ml-2">
                MUMBAI NODE
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex space-x-6 h-16" aria-label="Main Navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-1 h-full text-xs font-medium border-b-2 transition-all duration-150 ${
                    isActive
                      ? 'border-brand-primary text-slate-50 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Profile Selector & Refresh Button */}
          <div className="flex items-center space-x-3">
            {/* Sync Refresh Button */}
            <button
              id="refresh-btn"
              onClick={refreshData}
              disabled={isLoading}
              className={`p-2 rounded-lg border border-slate-850 bg-slate-900/60 hover:bg-slate-800 transition-colors ${
                isLoading ? 'opacity-50 pointer-events-none' : ''
              }`}
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  id="user-profile-dropdown-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center font-display font-semibold text-xs ${getAvatarBg(currentUser.name)}`}>
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-medium leading-none text-slate-200">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Reputation: <span className="text-brand-primary font-semibold">{currentUser.reputation} XP</span>
                    </div>
                  </div>
                </button>

                {/* Dropdown Options */}
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-800 bg-brand-panel p-2 shadow-2xl z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800/50 mb-1">
                        Simulate Citizen
                      </div>
                      <div className="space-y-1">
                        {users.map((u) => (
                          <button
                            key={u.id}
                            id={`user-select-${u.id}`}
                            onClick={() => {
                              onSwitchUser(u.id);
                              setShowDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors ${
                              currentUser.id === u.id
                                ? 'bg-brand-primary/10 text-brand-primary font-medium'
                                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                            }`}
                          >
                            <div className="flex flex-col items-start">
                              <span>{u.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">{u.ward} Ward</span>
                            </div>
                            <span className="text-[10px] font-mono text-brand-primary font-semibold">{u.reputation} XP</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 border-t border-slate-800/50 pt-1.5 px-3">
                        <div className="text-[9px] text-slate-400 italic leading-snug">
                          * Switch citizens to test crowd-sourced verification confirms and disputes!
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Mobile Tab Bar */}
      <div className="md:hidden flex justify-around border-t border-slate-800 bg-brand-panel py-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center space-y-1 text-xs transition-colors ${
                isActive ? 'text-brand-primary font-semibold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px]">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
