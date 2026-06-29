import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Clock,
  ArrowLeft,
  Camera,
  Upload,
  Shield,
  MapPin,
  MessageSquare,
  AlertCircle,
  Activity,
  Loader2,
  Lock
} from 'lucide-react';
import { Issue, User } from '../types';
import { calculateDistance } from './MapDashboard';

interface IssueDetailProps {
  issueId: string;
  currentUser: User | null;
  userLat: number;
  userLng: number;
  onBack: () => void;
  onVerify: (issueId: string, type: 'confirm' | 'dispute') => Promise<void>;
  onStatusUpdate: (issueId: string, status: string) => Promise<void>;
  onResolve: (issueId: string, afterImage: string) => Promise<{ success: boolean; aiFeedback?: string; error?: string }>;
  isUpdating: boolean;
}

export default function IssueDetail({
  issueId,
  currentUser,
  userLat,
  userLng,
  onBack,
  onVerify,
  onStatusUpdate,
  onResolve,
  isUpdating
}: IssueDetailProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [canVerify, setCanVerify] = useState<boolean>(false);
  const [bypassGeofence, setBypassGeofence] = useState<boolean>(true); // default true for simple judge testing!
  const [afterImage, setAfterImage] = useState<string | null>(null);
  
  // Camera/Upload states for Resolution
  const [showCamera, setShowCamera] = useState(false);
  const [resolutionLoader, setResolutionLoader] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load Single Issue details
  const fetchIssueDetails = async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      if (res.ok) {
        const data = await res.json();
        setIssue(data);
      }
    } catch (e) {
      console.error('Error fetching issue:', e);
    }
  };

  useEffect(() => {
    fetchIssueDetails();
    // Poll for status updates every 4 seconds (Real-Time Firestore simulation/Websockets substitute)
    const interval = setInterval(fetchIssueDetails, 4000);
    return () => clearInterval(interval);
  }, [issueId]);

  // Recalculate distance from current user
  useEffect(() => {
    if (!issue) return;
    const dist = calculateDistance(userLat, userLng, issue.latitude, issue.longitude);
    setDistance(dist);
    
    // Citizens can verify if within 3.0 km range
    setCanVerify(dist <= 3.0 || bypassGeofence);
  }, [issue, userLat, userLng, bypassGeofence]);

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
        <span>Loading tracking details...</span>
      </div>
    );
  }

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImage(file);
  };

  const readImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setAfterImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Camera Snapshot for Resolution Handlers
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert('Camera is blocked or unavailable on this device.');
      setShowCamera(false);
    }
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setAfterImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleResolveSubmit = async () => {
    if (!afterImage) return;
    setResolutionLoader(true);
    setAiFeedback(null);
    setAiSuccess(null);

    try {
      const res = await onResolve(issue.id, afterImage);
      if (res.success) {
        setAiSuccess(true);
        setAiFeedback(res.aiFeedback || 'Visual verification successful. Issue status updated to Resolved!');
        // Reload details
        fetchIssueDetails();
      } else {
        setAiSuccess(false);
        setAiFeedback(res.error || 'Gemini audit failed. Before and after images do not look like a complete fix.');
      }
    } catch (err: any) {
      alert('Error verifying resolution: ' + err.message);
    } finally {
      setResolutionLoader(false);
    }
  };

  // Pipeline/Stepper Configuration
  const steps = [
    { label: 'Reported', desc: 'Auto-categorized by AI Agent', time: issue.createdAt },
    { label: 'Verified', desc: 'Crowd authenticity check', time: issue.verifiedAt },
    { label: 'In Progress', desc: 'Assigned to Municipal Ward', time: issue.verifiedAt ? new Date(new Date(issue.verifiedAt).getTime() + 10 * 60000).toISOString() : null }, // mock logic
    { label: 'Resolved', desc: 'Gemini visual closure audit', time: issue.resolvedAt }
  ];

  const getStepStatus = (index: number) => {
    const statuses = ['Reported', 'Verified', 'In Progress', 'Resolved'];
    const currentIdx = statuses.indexOf(issue.status);
    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        id="detail-back-btn"
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Map Dashboard</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Info, Media, & Stepper */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded border border-slate-800 bg-slate-950/50 text-slate-300 font-medium uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    issue.severity === 'high' ? 'bg-red-500' : issue.severity === 'medium' ? 'bg-brand-accent' : 'bg-brand-primary'
                  }`} />
                  {issue.severity} Severity
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded border border-slate-800 bg-slate-950/50 text-slate-300 font-medium uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  {issue.category}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">ID: {issue.id}</span>
            </div>

            <div className="space-y-1.5">
              <h1 className="font-display font-bold text-lg sm:text-xl text-white">{issue.title}</h1>
              <div className="flex items-center text-xs text-slate-400 gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                <span>{issue.address}</span>
              </div>
            </div>

            <hr className="border-slate-800" />

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Description</h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-lg border border-slate-850">
                "{issue.description}"
              </p>
            </div>

            {/* Media Showcases */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Before Photo */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Before Photo (Citizen upload)</span>
                <div className="border border-slate-800 bg-slate-950 rounded-lg overflow-hidden aspect-video">
                  <img src={issue.beforeImage} alt="Before repair" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>

              {/* After Photo */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">After Photo (Municipal closure)</span>
                <div className="border border-slate-800 bg-slate-950 rounded-lg overflow-hidden aspect-video flex items-center justify-center text-center">
                  {issue.afterImage ? (
                    <img src={issue.afterImage} alt="After repair" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="p-4 text-slate-600 flex flex-col items-center justify-center">
                      <Clock className="w-8 h-8 text-slate-700 mb-1" />
                      <span className="text-xs">Issue in progress</span>
                      <span className="text-[10px] text-slate-700 mt-1">Pending authority fix</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-primary" />
              Real-Time Tracking Timeline
            </h3>

            <div className="flow-root mt-2">
              <ul className="-mb-8">
                {steps.map((step, stepIdx) => {
                  const status = getStepStatus(stepIdx);
                  const isLast = stepIdx === steps.length - 1;
                  return (
                    <li key={step.label}>
                      <div className="relative pb-8">
                        {!isLast && (
                          <span className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                            status === 'completed' ? 'bg-brand-primary' : 'bg-slate-800'
                          }`} aria-hidden="true" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-brand-panel ${
                              status === 'completed'
                                ? 'bg-brand-primary text-slate-950'
                                : status === 'current'
                                ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {status === 'completed' ? (
                                <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                              ) : (
                                <span className="text-xs font-bold font-mono">{stepIdx + 1}</span>
                              )}
                            </span>
                          </div>
                          <div className="flex-grow pt-1.5 flex justify-between gap-2 min-w-0">
                            <div>
                              <p className={`text-xs font-bold ${status === 'upcoming' ? 'text-slate-500' : 'text-slate-200'}`}>
                                {step.label}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                            </div>
                            {step.time && (
                              <div className="text-right text-[9px] text-slate-500 font-mono">
                                {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="block mt-0.5 text-[8px]">
                                  {new Date(step.time).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Crowd Verification & Authority Controls */}
        <div className="space-y-6">
          {/* Crowd Verification Box */}
          <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crowd-Sourced Verification</h3>
            
            {/* Distance Geofence Alert */}
            <div className={`p-3 rounded-lg border flex items-start space-x-2.5 ${
              canVerify 
                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' 
                : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
            }`}>
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold">
                  Distance from issue: <span className="font-mono font-bold">{distance.toFixed(2)} km</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {canVerify 
                    ? '✅ Within active crowd zone! You can audit and verify this issue.' 
                    : '⚠️ Too far away (> 3.0 km). Switch simulated citizen or bypass geofence to vote.'}
                </div>
              </div>
            </div>

            {/* Bypass switch (for simple evaluation) */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
              <span>Bypass Geofencing constraints:</span>
              <button
                type="button"
                onClick={() => setBypassGeofence(!bypassGeofence)}
                className={`w-8 h-4 rounded-full relative transition-colors ${bypassGeofence ? 'bg-brand-primary' : 'bg-slate-800'}`}
              >
                <span className={`absolute top-0.5 left-0.5 bg-slate-950 w-3 h-3 rounded-full transition-transform ${bypassGeofence ? 'translate-x-4' : ''}`} />
              </button>
            </div>

            {/* Score Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-brand-primary uppercase font-mono font-semibold block">Confirms</span>
                <span className="text-xl font-bold text-slate-200 mt-1 block">{issue.confirms}</span>
                <span className="text-[9px] text-slate-500 mt-0.5 block">Required: 5 for escalate</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-center">
                <span className="text-[10px] text-red-400/80 uppercase font-mono font-semibold block">Disputes</span>
                <span className="text-xl font-bold text-slate-200 mt-1 block">{issue.disputes}</span>
                <span className="text-[9px] text-slate-500 mt-0.5 block">Flagged spam if high</span>
              </div>
            </div>

            {/* Voting buttons */}
            <div className="space-y-2 pt-2">
              <button
                id="btn-confirm-issue"
                disabled={!canVerify || isUpdating || issue.status !== 'Reported'}
                onClick={() => onVerify(issue.id, 'confirm')}
                className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/85 text-slate-950 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ThumbsUp className="w-4 h-4" /> Confirm Authenticity (+5 XP)
              </button>
              <button
                id="btn-dispute-issue"
                disabled={!canVerify || isUpdating || issue.status !== 'Reported'}
                onClick={() => onVerify(issue.id, 'dispute')}
                className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 py-2.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ThumbsDown className="w-4 h-4" /> Dispute Report
              </button>
            </div>
            
            {issue.status !== 'Reported' && (
              <div className="text-[10px] text-slate-500 italic text-center">
                * This issue is already verified/escalated and cannot be verified further.
              </div>
            )}
          </div>

          {/* Municipal Authority Panel */}
          <div className="bg-brand-panel border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                Authority Actions (Mock)
              </h3>
              <span className="text-[9px] font-mono text-slate-400 border border-slate-800 bg-slate-950/40 px-1.5 py-0.5 rounded">
                Admin Area
              </span>
            </div>

            {issue.status === 'Verified' && (
              <button
                id="btn-start-work"
                onClick={() => onStatusUpdate(issue.id, 'In Progress')}
                className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/85 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Activity className="w-4 h-4" /> Start Resolution (Set In Progress)
              </button>
            )}

            {(issue.status === 'In Progress' || issue.status === 'Verified') && (
              <div className="space-y-4 pt-1.5">
                <hr className="border-slate-850" />
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Upload After Photo to Resolve</label>
                  
                  {/* Resolution photo selector */}
                  {afterImage ? (
                    <div className="space-y-2">
                      <div className="border border-slate-800 rounded-lg overflow-hidden aspect-video">
                        <img src={afterImage} alt="After fix snapshot" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAfterImage(null)}
                          className="flex-1 bg-slate-800 text-slate-400 text-[10px] font-bold py-2 rounded-lg border border-slate-700 transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          id="btn-gemini-audit"
                          type="button"
                          disabled={resolutionLoader}
                          onClick={handleResolveSubmit}
                          className="flex-1 bg-brand-primary hover:bg-brand-primary/85 text-slate-950 text-[10px] font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          {resolutionLoader ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Shield className="w-3 h-3" /> AI Validation Audit
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : showCamera ? (
                    <div className="border border-slate-800 bg-slate-950 rounded-lg overflow-hidden aspect-video flex flex-col relative">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-2 z-10">
                        <button
                          type="button"
                          onClick={captureSnapshot}
                          className="bg-brand-primary text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-brand-primary/85"
                        >
                          Snap
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex flex-col items-center p-3 border border-slate-800 bg-slate-950/40 hover:border-brand-primary/40 rounded-lg text-center transition-colors group"
                      >
                        <Camera className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" />
                        <span className="text-[10px] text-slate-300 mt-1 font-semibold">Camera Snap</span>
                      </button>
                      <label className="flex flex-col items-center p-3 border border-slate-800 bg-slate-950/40 hover:border-brand-primary/40 rounded-lg text-center cursor-pointer transition-colors group">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" />
                        <span className="text-[10px] text-slate-300 mt-1 font-semibold">Upload Photo</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resolution validation results */}
            {aiFeedback && (
              <div className={`p-3.5 rounded-lg border text-xs leading-relaxed flex items-start space-x-2 ${
                aiSuccess 
                  ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' 
                  : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
              }`}>
                {aiSuccess ? <CheckCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" /> : <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />}
                <div className="space-y-1">
                  <div className="font-bold">{aiSuccess ? 'AI Visual Audit: Verified Fixed' : 'AI Visual Audit: Review Failed'}</div>
                  <p className="text-[11px] text-slate-300">"{aiFeedback}"</p>
                </div>
              </div>
            )}

            {issue.status === 'Resolved' && (
              <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-brand-primary font-mono font-bold block flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Resolution Closure Audit
                </span>
                <p className="text-slate-300 italic">
                  "The before and after visual checks have been compiled. Visual confirmation verified the issue is completely fixed. +50 reputation XP awarded."
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
