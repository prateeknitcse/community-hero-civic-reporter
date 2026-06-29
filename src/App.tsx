import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, RefreshCw, Layers, MapPin, Loader2, Compass } from 'lucide-react';
import Navbar from './components/Navbar';
import MapDashboard from './components/MapDashboard';
import IssueReportForm from './components/IssueReportForm';
import IssueDetail from './components/IssueDetail';
import ImpactDashboard from './components/ImpactDashboard';
import Leaderboard from './components/Leaderboard';
import MyProfile from './components/MyProfile';
import { Issue, User, LeaderboardEntry, StatsOverview } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('map');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Default coordinate set central to Mumbai Dadar (Central Ward Hub)
  const [userLat, setUserLat] = useState<number>(19.0178);
  const [userLng, setUserLng] = useState<number>(72.8478);

  // Core Data States
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Single function to sync all server data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [issuesRes, usersRes, statsRes, leaderboardRes] = await Promise.all([
        fetch('/api/issues'),
        fetch('/api/users'),
        fetch('/api/stats'),
        fetch('/api/leaderboard')
      ]);

      if (issuesRes.ok && usersRes.ok && statsRes.ok && leaderboardRes.ok) {
        const issuesData = await issuesRes.json();
        const usersData = await usersRes.json();
        const statsData = await statsRes.json();
        const leaderboardData = await leaderboardRes.json();

        setIssues(issuesData);
        setUsers(usersData);
        setStats(statsData);
        setLeaderboard(leaderboardData);

        // Update current simulated user references to preserve their live XP scores
        if (currentUser) {
          const updatedUser = usersData.find((u: User) => u.id === currentUser.id);
          if (updatedUser) {
            setCurrentUser(updatedUser);
          }
        } else if (usersData.length > 0) {
          // Default to Priya Sharma (usr-2) as the default active citizen on initial mount
          const defaultUser = usersData.find((u: User) => u.id === 'usr-2') || usersData[0];
          setCurrentUser(defaultUser);
        }
      }
    } catch (error) {
      console.error('Error syncing backend database states:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // On Initial Mount
  useEffect(() => {
    refreshData();
    
    // Auto-detect browser location once on initial mount if permission is granted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        (err) => console.log('Geolocation permission skipped. Defaulting to Central Mumbai coordinates.')
      );
    }
  }, []);

  // Handle User Swap Simulators
  const handleSwitchUser = (userId: string) => {
    const nextUser = users.find((u) => u.id === userId);
    if (nextUser) {
      setCurrentUser(nextUser);
      // If user has a default ward location, pan coordinates close to that ward
      const wardCoordinates: Record<string, { lat: number; lng: number }> = {
        'Bandra': { lat: 19.0596, lng: 72.8295 },
        'Andheri': { lat: 19.1136, lng: 72.8697 },
        'Colaba': { lat: 18.9067, lng: 72.8147 },
        'Dadar': { lat: 19.0178, lng: 72.8478 },
        'Juhu': { lat: 19.1048, lng: 72.8268 },
      };
      
      const loc = wardCoordinates[nextUser.ward];
      if (loc) {
        setUserLat(loc.lat);
        setUserLng(loc.lng);
      }
    }
  };

  // Submit Community Verification Vote (Confirm/Dispute)
  const handleVerifyIssue = async (issueId: string, type: 'confirm' | 'dispute') => {
    if (!currentUser) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit verification vote');
      }

      const data = await response.json();
      
      // Notify points earned
      if (type === 'confirm') {
        alert(`Verification logged! You earned +5 XP for community audit. Current issue status: ${data.issue.status}`);
      } else {
        if (data.issue.isSpam) {
          alert(`Dispute filed! This issue has now been REJECTED as false/spam by the community. The reporter's points have been cut!`);
          setSelectedIssueId(null); // Return to list/map since this issue is now hidden as spam
        } else {
          alert(`Dispute filed! The issue dispute counter is now at ${data.issue.disputes}.`);
        }
      }

      // Sync and reload
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update Status directly (e.g. Set to In Progress)
  const handleStatusUpdate = async (issueId: string, status: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert(`Work initiated! Issue status set to "${status}" and assigned to ward contractors.`);
        await refreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Resolve Issue with After Image & Gemini visual comparison
  const handleResolveIssue = async (issueId: string, afterImage: string) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ afterImage })
      });

      const data = await response.json();
      
      // Force reload to sync statistics
      await refreshData();

      if (data.success) {
        return { success: true, aiFeedback: data.aiFeedback };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message };
    }
  };

  // Callback when a citizen files a new report
  const handleIssueReported = (newIssue: any, updatedUser: User) => {
    // Navigate straight to Map to view their live reported pin!
    setActiveTab('map');
    setSelectedIssueId(newIssue.id);
    refreshData();
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-slate-100 flex flex-col justify-between selection:bg-brand-primary/20 selection:text-slate-100">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Clear sub-page detail route if tab changes
          if (tab !== 'map') setSelectedIssueId(null);
        }}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        refreshData={refreshData}
        isLoading={isLoading}
      />

      {/* Main Content Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Help Banner Alert for Judges/Evaluators */}
        {activeTab === 'map' && !selectedIssueId && (
          <div className="mb-6 bg-brand-panel border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-brand-primary block flex items-center gap-1.5 font-display text-sm">
                <Shield className="w-4 h-4 text-brand-primary" /> Welcome to Mumbai Hyperlocal Solver!
              </span>
              <p className="text-slate-400">
                You are currently simulating as <span className="font-semibold text-slate-200">{currentUser?.name}</span> ({currentUser?.ward} Ward). 
                To test the **reputation gamification** and **5-verification escalation system**, use the top right profile dropdown to swap citizens and vote on unverified reported pins.
              </p>
            </div>
            <button
              onClick={() => {
                // Pre-set location to Dadar to highlight nearby issues
                setUserLat(19.0178);
                setUserLng(72.8478);
              }}
              className="shrink-0 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 px-3.5 py-1.5 rounded-lg font-medium transition-colors text-[11px]"
            >
              Reset simulated location
            </button>
          </div>
        )}

        {/* Dynamic Route Rendering */}
        <div className="relative">
          {isLoading && issues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
              <span className="font-bold text-slate-300">Synchronizing Hyperlocal Node...</span>
              <span className="text-[11px] text-slate-500 mt-1">Downloading Mumbai ward layers and reporting databases</span>
            </div>
          ) : selectedIssueId ? (
            <IssueDetail
              issueId={selectedIssueId}
              currentUser={currentUser}
              userLat={userLat}
              userLng={userLng}
              onBack={() => setSelectedIssueId(null)}
              onVerify={handleVerifyIssue}
              onStatusUpdate={handleStatusUpdate}
              onResolve={handleResolveIssue}
              isUpdating={isUpdating}
            />
          ) : activeTab === 'map' ? (
            <MapDashboard
              issues={issues}
              onSelectIssue={(id) => setSelectedIssueId(id)}
              userLat={userLat}
              userLng={userLng}
              onSetUserLocation={(lat, lng) => {
                setUserLat(lat);
                setUserLng(lng);
              }}
              isLoading={isLoading}
            />
          ) : activeTab === 'report' ? (
            <IssueReportForm
              currentUser={currentUser}
              userLat={userLat}
              userLng={userLng}
              onIssueReported={handleIssueReported}
              isLoading={isUpdating}
              setIsLoading={setIsUpdating}
            />
          ) : activeTab === 'impact' ? (
            <ImpactDashboard stats={stats} isLoading={isLoading} />
          ) : activeTab === 'leaderboard' ? (
            <Leaderboard entries={leaderboard} isLoading={isLoading} />
          ) : activeTab === 'profile' ? (
            <MyProfile
              currentUser={currentUser}
              onSelectIssue={(issueId) => {
                setSelectedIssueId(issueId);
                setActiveTab('map');
              }}
              setActiveTab={setActiveTab}
            />
          ) : null}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-brand-panel/60 py-4 text-center text-[10px] text-slate-500 font-mono">
        <div>
          Community Hero Civic Platform &bull; Mumbai Ward Solver Node &bull; Verification & Gamification
        </div>
        <div className="mt-1 text-[9px] text-brand-primary/50">
          Supervised by AI Safety & Visual Verification Protocol
        </div>
      </footer>
    </div>
  );
}
