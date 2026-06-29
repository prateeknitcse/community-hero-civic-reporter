import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, MapPin, Loader2, Shield, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface IssueReportFormProps {
  currentUser: User | null;
  userLat: number;
  userLng: number;
  onIssueReported: (newIssue: any, updatedUser: User) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export default function IssueReportForm({
  currentUser,
  userLat,
  userLng,
  onIssueReported,
  isLoading,
  setIsLoading
}: IssueReportFormProps) {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  
  // Reporter states
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterEmail, setReporterEmail] = useState(currentUser?.email || '');

  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync reporter info when current user changes
  useEffect(() => {
    if (currentUser) {
      setReporterName(currentUser.name);
      setReporterEmail(currentUser.email);
    }
  }, [currentUser]);

  // Handle Drag-and-Drop / File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (limit to 5MB before canvas compression)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo is too large. Please select an image under 5MB.');
      return;
    }

    readImage(file);
  };

  const readImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      compressImage(base64String, (compressed) => {
        setImage(compressed);
      });
    };
    reader.readAsDataURL(file);
  };

  // Compress image to ensure low-bandwidth compatibility (Vite image optimization)
  const compressImage = (base64Str: string, callback: (compressed: string) => void) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Compress with 0.7 quality to keep payload small
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      callback(dataUrl);
    };
  };

  // Start Camera
  const startCamera = async () => {
    setShowCamera(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Default to back camera on phones
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access was denied or is unavailable on this device.');
    }
  };

  // Capture Snapshot
  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const base64Str = canvas.toDataURL('image/jpeg');
      compressImage(base64Str, (compressed) => {
        setImage(compressed);
        stopCamera();
      });
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Submit Issue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      alert('Please upload or snap a photo of the civic issue.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeImage: image,
          description,
          latitude: userLat,
          longitude: userLng,
          reporterName: reporterName || 'Anonymous Hero',
          reporterEmail: reporterEmail || 'anonymous@citizen.com'
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to file report');
      }

      const data = await response.json();
      
      // Trigger callback with newly reported issue and updated reputation point state!
      onIssueReported(data.issue, data.reporter);
      
      // Reset form
      setDescription('');
      setImage(null);
      alert('Issue reported successfully! The AI Agent has auto-categorized your report and you earned +15 reputation XP!');
    } catch (error: any) {
      console.error('Error reporting issue:', error);
      alert(error.message || 'Error occurred while saving issue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-brand-panel border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-slate-50 text-base">Report a Local Civic Issue</h2>
          <p className="text-xs text-slate-400 mt-1">Empower your locality. File real-time reports directly to authorities.</p>
        </div>
        <div className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded border border-brand-primary/20 flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" /> AI Inspector Active
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Step 1: Camera Snapshot or Photo Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Capture Evidence (Photo/Video)</label>
          
          {/* Photo Display */}
          {image ? (
            <div className="relative border border-slate-800 bg-slate-950 rounded-lg overflow-hidden aspect-video group">
              <img src={image} alt="Report evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  Remove Photo
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-brand-primary hover:bg-brand-primary/85 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" /> Retake
                </button>
              </div>
              <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur text-[10px] text-brand-primary font-mono px-2 py-0.5 rounded border border-brand-primary/20">
                Low-Bandwidth Optimized
              </div>
            </div>
          ) : showCamera ? (
            /* Webcam Frame */
            <div className="relative border border-slate-800 bg-slate-950 rounded-lg overflow-hidden aspect-video flex flex-col">
              {cameraError ? (
                <div className="p-6 flex flex-col items-center justify-center text-center text-red-400 flex-grow">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p className="text-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="mt-3 bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700"
                  >
                    Close Camera
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover flex-grow" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10">
                    <button
                      type="button"
                      onClick={captureSnapshot}
                      className="bg-brand-primary hover:bg-brand-primary/85 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-brand-primary/15"
                    >
                      <Camera className="w-4 h-4" /> Snap Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2 rounded-lg border border-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Upload Placeholders */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={startCamera}
                className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-brand-primary/50 bg-slate-950/60 p-6 rounded-lg transition-colors text-center group"
              >
                <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-brand-primary/10 transition-colors">
                  <Camera className="w-6 h-6 text-slate-400 group-hover:text-brand-primary" />
                </div>
                <span className="text-xs font-semibold text-slate-300 mt-3">Snap Live Photo</span>
                <span className="text-[10px] text-slate-500 mt-1">Use webcam or phone camera</span>
              </button>

              <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-brand-primary/50 bg-slate-950/60 p-6 rounded-lg transition-colors text-center cursor-pointer group">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-brand-primary/10 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-primary" />
                </div>
                <span className="text-xs font-semibold text-slate-300 mt-3">Upload File</span>
                <span className="text-[10px] text-slate-500 mt-1">Select from computer/gallery</span>
              </label>
            </div>
          )}
        </div>

        {/* Step 2: Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              2. Describe the Issue (Multilingual Support)
            </label>
            <span className="text-[10px] text-brand-accent font-mono">English + Hindi + Hinglish OK</span>
          </div>
          <textarea
            id="report-description"
            rows={4}
            placeholder="Describe the issue. (e.g. 'There is a deep pothole in front of Shiv Mandir causing traffic blockages' / 'यहा कचरा बहुत जमा हो गया है, बदबू आ रही है')"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950/40 text-xs border border-slate-800 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-colors"
          />
        </div>

        {/* Step 3: Location verification */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">3. Location Capture</label>
          <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200">Auto-captured Browser Coordinates</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Lat: {userLat.toFixed(5)}° N, Lng: {userLng.toFixed(5)}° E
                </div>
              </div>
            </div>
            <div className="text-xs font-bold font-mono text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-1 rounded">
              📍 GEOFENCED
            </div>
          </div>
        </div>

        {/* Step 4: Reporter Identity Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Reporter Name</label>
            <input
              id="reporter-name"
              type="text"
              placeholder="Your full name"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full bg-slate-950/40 text-xs border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Reporter Email</label>
            <input
              id="reporter-email"
              type="email"
              placeholder="your@email.com"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              className="w-full bg-slate-950/40 text-xs border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-colors"
            />
          </div>
        </div>

        {/* Submit Portal */}
        <div className="pt-4 border-t border-slate-800">
          {isLoading ? (
            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-lg flex items-center space-x-3 justify-center">
              <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-brand-primary block">AI Multi-Agent Inspection in progress...</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Categorizing, estimating severity, translating description, and generating safe title</span>
              </div>
            </div>
          ) : (
            <button
              id="submit-report-btn"
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-primary/85 active:scale-[0.99] text-slate-950 font-semibold py-3 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" /> File Report & Analyze (+15 XP)
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
