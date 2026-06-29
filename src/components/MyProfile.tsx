import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Mail, 
  Zap, 
  TrendingUp, 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from 'lucide-react';
import { User, Issue, Verification } from '../types';

interface MyProfileProps {
  currentUser: User | null;
  onSelectIssue: (issueId: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function MyProfile({
  currentUser,
  onSelectIssue,
  setActiveTab
}: MyProfileProps) {
  const [userReports, setUserReports] = useState<Issue[]>([]);
  const [userVerifications, setUserVerifications] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const [reportsRes, verificationsRes] = await Promise.all([
          fetch(`/api/users/${currentUser.id}/reports`),
          fetch(`/api/users/${currentUser.id}/verifications`)
        ]);

        if (reportsRes.ok && verificationsRes.ok) {
          const reportsData = await reportsRes.json();
          const verificationsData = await verificationsRes.json();
          setUserReports(reportsData);
          setUserVerifications(verificationsData);
        }
      } catch (error) {
        console.error('Error fetching user profile historical details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
        <span>Syncing current active citizen session...</span>
      </div>
    );
  }

  // --- Calculate Stats & Gamification Levels ---
  const totalXP = currentUser.reputation;
  
  // Levels configuration
  const getReputationLevel = (xp: number) => {
    if (xp >= 300) return { name: 'Locality Guardian', nextThreshold: 500, currentBase: 300, icon: Shield };
    if (xp >= 150) return { name: 'Street Sentinel', nextThreshold: 300, currentBase: 150, icon: Award };
    if (xp >= 50) return { name: 'Active Patrol', nextThreshold: 150, currentBase: 50, icon: Zap };
    return { name: 'Civic Rookie', nextThreshold: 50, currentBase: 0, icon: TrendingUp };
  };

  const levelInfo = getReputationLevel(totalXP);
  const LevelIcon = levelInfo.icon;
  const xpInCurrentLevel = totalXP - levelInfo.currentBase;
  const xpNeededForNextLevel = levelInfo.nextThreshold - levelInfo.currentBase;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  // --- Calculate Verified vs. Disputed Reports Breakdown ---
  // A report is "verified" if it has status In Progress, Resolved, Verified, or has 5+ confirms.
  // A report is "disputed" if it is marked as spam, or has disputes > 0.
  const verifiedReports = userReports.filter(
    (i) => i.status === 'Verified' || i.status === 'In Progress' || i.status === 'Resolved' || i.confirms >= 5
  );
  
  const disputedReports = userReports.filter(
    (i) => i.isSpam || i.disputes > 0
  );

  const pendingReports = userReports.filter(
    (i) => i.status === 'Reported' && !i.isSpam && i.confirms < 5 && i.disputes === 0
  );

  // Trust rating calculation: verified reports / total reports containing definitive outcomes
  const outcomeCount = verifiedReports.length + disputedReports.length;
  const trustIndex = outcomeCount > 0 
    ? Math.round((verifiedReports.length / outcomeCount) * 100) 
    : 100;

  // --- Calculate Verification Votes Breakdown ---
  const confirmsCast = userVerifications.filter((v) => v.type === 'confirm').length;
  const disputesCast = userVerifications.filter((v) => v.type === 'dispute').length;

  const getAvatarBg = (name: string) => {
    const palette = [
      'bg-emerald-950/40 text-emerald-300 border border-emerald-800/20',
      'bg-amber-950/40 text-amber-300 border border-amber-800/20',
      'bg-indigo-950/40 text-indigo-300 border border-indigo-800/20',
      'bg-rose-950/40 text-rose-300 border border-rose-800/20',
      'bg-teal-950/40 text-teal-300 border border-teal-800/20',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return palette[sum % palette.length];
  };

  const getStatusBadge = (issue: Issue) => {
    if (issue.isSpam) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-rose-950 bg-rose-950/30 text-rose-400">
          <XCircle className="w-3 h-3" /> DISPUTED / SPAM
        </span>
      );
    }
    switch (issue.status) {
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
            <CheckCircle2 className="w-3 h-3" /> RESOLVED FIX
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-brand-accent/20 bg-brand-accent/10 text-brand-accent">
            <Loader2 className="w-3 h-3 animate-spin" /> IN PROGRESS
          </span>
        );
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-3 h-3" /> COMMUNITY VERIFIED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
            <History className="w-3 h-3" /> UNDER REVIEW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* 1. Header Profile Banner */}
      <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
        {/* Visual background accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* User Meta Information */}
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center font-display font-bold text-2xl shrink-0 ${getAvatarBg(currentUser.name)}`}>
              {currentUser.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display font-bold text-xl md:text-2xl text-white">{currentUser.name}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {currentUser.email}
                </span>
                <span className="hidden sm:inline-block text-slate-600">|</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Assigned Ward: <strong className="text-slate-300">{currentUser.ward}</strong>
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-slate-950/40 border border-slate-800 px-3 py-1 rounded-lg text-xs">
                <LevelIcon className="w-3.5 h-3.5 text-brand-primary" />
                <span className="text-slate-300">Rank: <strong className="text-brand-primary">{levelInfo.name}</strong></span>
              </div>
            </div>
          </div>

          {/* XP & Level Summary Card */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 md:w-80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reputation Status</span>
              <span className="text-xs font-mono font-bold text-brand-primary">{totalXP} Total XP</span>
            </div>
            
            {/* XP progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{levelInfo.currentBase} XP</span>
                <span>Next level at {levelInfo.nextThreshold} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Impact statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-2 relative overflow-hidden">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">My Filed Reports</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100">{userReports.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">total civic reports</span>
          </div>
          <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
            🛡️ Including {pendingReports.length} under review
          </div>
        </div>

        <div className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Verified by Community</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-brand-primary">{verifiedReports.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">accepted fixes</span>
          </div>
          <div className="text-[9px] text-brand-primary flex items-center gap-1 font-mono">
            ✅ Authenticity confirmed
          </div>
        </div>

        <div className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Audits Cast (Verifications)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100">{userVerifications.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">audits submitted</span>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1.5 font-mono">
            <ThumbsUp className="w-3 h-3 text-slate-400" /> {confirmsCast} up / <ThumbsDown className="w-3 h-3 text-slate-400" /> {disputesCast} down
          </div>
        </div>

        <div className="bg-brand-panel border border-slate-800 p-4 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Community Trust Score</span>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-bold ${trustIndex >= 80 ? 'text-brand-primary' : trustIndex >= 50 ? 'text-brand-accent' : 'text-rose-500'}`}>
              {trustIndex}%
            </span>
            <span className="text-[10px] text-slate-400 font-mono">trust score</span>
          </div>
          <div className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
            ⭐ Based on verified vs disputed ratio
          </div>
        </div>
      </div>

      {/* 3. Detailed Breakdown section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Breakdown Box */}
        <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-200">Reports Authenticity Breakdown</h3>
            <p className="text-[11px] text-slate-500">How many of your reported civic issues have been verified as genuine vs disputed by neighboring citizens.</p>
          </div>

          <div className="space-y-4">
            {/* Visual breakdown progress bars */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-brand-primary flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified genuine
                </span>
                <span className="font-mono text-slate-300">
                  {verifiedReports.length} ({userReports.length > 0 ? Math.round((verifiedReports.length / userReports.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/80 h-3 rounded-md overflow-hidden p-0.5 border border-slate-800/60">
                <div 
                  className="bg-brand-primary h-full rounded-sm"
                  style={{ width: `${userReports.length > 0 ? (verifiedReports.length / userReports.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> Pending Community Review
                </span>
                <span className="font-mono text-slate-300">
                  {pendingReports.length} ({userReports.length > 0 ? Math.round((pendingReports.length / userReports.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/80 h-3 rounded-md overflow-hidden p-0.5 border border-slate-800/60">
                <div 
                  className="bg-slate-500 h-full rounded-sm"
                  style={{ width: `${userReports.length > 0 ? (pendingReports.length / userReports.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Disputed / Spam
                </span>
                <span className="font-mono text-slate-300">
                  {disputedReports.length} ({userReports.length > 0 ? Math.round((disputedReports.length / userReports.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/80 h-3 rounded-md overflow-hidden p-0.5 border border-slate-800/60">
                <div 
                  className="bg-rose-500 h-full rounded-sm"
                  style={{ width: `${userReports.length > 0 ? (disputedReports.length / userReports.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-lg text-xs leading-relaxed text-slate-400">
            <strong>💡 Gamification Note:</strong> Contributing highly precise, genuine issues with descriptive photos earns you up to <span className="text-brand-primary font-semibold">+40 XP</span> per issue (+15 base on report, +25 upon 5-crowd verifications). Reports marked as spam or duplicate by the community incur a penalty of <span className="text-rose-400 font-semibold">-30 XP</span>.
          </div>
        </div>

        {/* Auditing Activities Breakdown Box */}
        <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-200">My Neighborhood Auditing</h3>
            <p className="text-[11px] text-slate-500">Your contribution towards auditing issues filed by other citizens inside local geofenced limits.</p>
          </div>

          {userVerifications.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-brand-primary mb-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> Upvotes Cast
                  </div>
                  <span className="text-2xl font-bold text-slate-200">{confirmsCast}</span>
                  <p className="text-[9px] text-slate-500 mt-1">Confirmed authenticity</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-brand-accent mb-1">
                    <ThumbsDown className="w-3.5 h-3.5" /> Disputes Cast
                  </div>
                  <span className="text-2xl font-bold text-slate-200">{disputesCast}</span>
                  <p className="text-[9px] text-slate-500 mt-1">Flagged as incorrect/spam</p>
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-4.5 h-4.5 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Total Auditing XP Earned: <span className="text-brand-primary">{confirmsCast * 5} XP</span></span>
                  <p className="text-[11px] text-slate-400 mt-0.5">Neighboring citizens are awarded +5 XP for each genuine upvote audit they perform near report geofences.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 bg-slate-950/20 rounded-lg text-slate-400">
              <ThumbsUp className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-xs font-semibold">No audits submitted yet</span>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs">Use the Dashboard Map to find active reported issues close to your location and help verify them!</p>
              <button 
                onClick={() => setActiveTab('map')}
                className="mt-3 bg-brand-primary hover:bg-brand-primary/85 text-slate-950 font-semibold text-[10px] px-3 py-1.5 rounded-lg transition-colors"
              >
                Go to Map
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Historic Reports Feed */}
      <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-sm text-slate-200">My Reports History</h3>
          <p className="text-[11px] text-slate-500">Track the real-time status and crowd votes on all the issues you have reported.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin mb-2" />
            <span className="text-xs">Loading report logs...</span>
          </div>
        ) : userReports.length > 0 ? (
          <div className="divide-y divide-slate-800/60 max-h-[450px] overflow-y-auto pr-2 space-y-3">
            {userReports.map((issue) => (
              <div 
                key={issue.id} 
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-100 font-display text-xs group-hover:text-brand-primary transition-colors">
                      {issue.title}
                    </span>
                    {getStatusBadge(issue)}
                  </div>
                  <p className="text-slate-400 line-clamp-1 text-[11px]">"{issue.description}"</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {issue.wardName}
                    </span>
                    <span>&bull;</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  {/* Votes count */}
                  <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono">
                    <span className="text-brand-primary flex items-center gap-0.5" title="Confirms">
                      <ThumbsUp className="w-3 h-3" /> {issue.confirms}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-rose-400 flex items-center gap-0.5" title="Disputes">
                      <ThumbsDown className="w-3 h-3" /> {issue.disputes}
                    </span>
                  </div>

                  {/* View Details button */}
                  {!issue.isSpam && (
                    <button
                      onClick={() => onSelectIssue(issue.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                    >
                      View Pin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 bg-slate-950/20 rounded-lg text-slate-400">
            <AlertTriangle className="w-8 h-8 text-slate-600 mb-2" />
            <span className="text-xs font-semibold">You haven't reported any issues yet</span>
            <p className="text-[10px] text-slate-500 mt-1 max-w-sm">Keep our streets safe by snapping photos of deep potholes, flickering light poles, or leaking pipelines in your locality!</p>
            <button 
              onClick={() => setActiveTab('report')}
              className="mt-3 bg-brand-primary hover:bg-brand-primary/85 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
            >
              Report First Issue (+15 XP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
