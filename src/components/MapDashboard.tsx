import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Eye, AlertTriangle, ShieldCheck, Clock, MapPin, Compass, Search, Activity } from 'lucide-react';
import { Issue, IssueCategory, IssueStatus } from '../types';

interface MapDashboardProps {
  issues: Issue[];
  onSelectIssue: (issueId: string) => void;
  userLat: number;
  userLng: number;
  onSetUserLocation: (lat: number, lng: number) => void;
  isLoading?: boolean;
}

// Haversine formula to calculate distance in km between two lat/lng coordinates
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function getWardFromLatLng(lat: number, lng: number): string {
  const wards = [
    { name: 'Bandra', lat: 19.0596, lng: 72.8295 },
    { name: 'Andheri', lat: 19.1136, lng: 72.8697 },
    { name: 'Colaba', lat: 18.9067, lng: 72.8147 },
    { name: 'Dadar', lat: 19.0178, lng: 72.8478 },
    { name: 'Juhu', lat: 19.1048, lng: 72.8268 },
  ];

  let minDistance = Infinity;
  let closestWard = 'Other';

  for (const ward of wards) {
    const dist = Math.sqrt(Math.pow(lat - ward.lat, 2) + Math.pow(lng - ward.lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closestWard = ward.name;
    }
  }

  return closestWard;
}

export default function MapDashboard({
  issues,
  onSelectIssue,
  userLat,
  userLng,
  onSetUserLocation,
  isLoading = false
}: MapDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] animate-pulse">
        {/* Map Control Sidebar Skeleton */}
        <div className="lg:col-span-1 bg-brand-panel border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Geolocation Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-850 rounded w-1/2" />
                <div className="h-7 bg-slate-800 rounded-lg w-1/4" />
              </div>
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="h-3 bg-slate-850 rounded w-2/3" />
                <div className="h-3 bg-slate-850 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2 pt-1 border-t border-slate-850/40 mt-1" />
              </div>
            </div>

            <hr className="border-slate-800" />

            {/* Filters Title */}
            <div className="h-3 bg-slate-850 rounded w-1/3" />

            {/* Search Box */}
            <div className="h-10 bg-slate-950/60 border border-slate-800 rounded-lg w-full" />

            {/* Range Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-slate-850 rounded w-1/3" />
                <div className="h-3 bg-slate-850 rounded w-1/4" />
              </div>
              <div className="h-1.5 bg-slate-950 rounded w-full" />
              <div className="h-2 bg-slate-850 rounded w-2/3" />
            </div>

            {/* Problem Clusters Toggle */}
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 flex justify-between items-center">
              <div className="space-y-1.5 w-2/3">
                <div className="h-3 bg-slate-850 rounded w-3/4" />
                <div className="h-2 bg-slate-850 rounded w-5/6" />
              </div>
              <div className="w-8 h-4 bg-slate-800 rounded-full" />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <div className="h-3 bg-slate-850 rounded w-1/4" />
              <div className="h-9 bg-slate-950 border border-slate-800 rounded-lg w-full" />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <div className="h-3 bg-slate-850 rounded w-1/4" />
              <div className="h-9 bg-slate-950 border border-slate-800 rounded-lg w-full" />
            </div>

            {/* Recent Activity Feed Skeleton */}
            <div className="space-y-3 pt-3 border-t border-slate-800/60">
              <div className="flex justify-between items-center">
                <div className="h-3.5 bg-slate-850 rounded w-2/3" />
                <div className="h-2.5 bg-slate-850 rounded w-8" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/20 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 bg-slate-850 rounded w-1/3" />
                      <div className="h-2.5 bg-slate-850 rounded w-12" />
                    </div>
                    <div className="h-3.5 bg-slate-850 rounded w-5/6" />
                    <div className="flex justify-between pt-1">
                      <div className="h-2.5 bg-slate-850 rounded w-16" />
                      <div className="h-2.5 bg-slate-800 rounded w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
            <div className="h-3 bg-slate-850 rounded w-1/3" />
            <div className="h-5 bg-slate-850 rounded w-1/6" />
          </div>
        </div>

        {/* Main Map Area Skeleton */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div className="relative flex-grow border border-slate-800 bg-brand-panel rounded-xl overflow-hidden shadow-inner min-h-[350px] flex items-center justify-center bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Grid background / map overlay vibes */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" />
            
            {/* Simulated Radar or Mapping Target */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="relative flex items-center justify-center">
                {/* Pulsing ring */}
                <div className="absolute w-24 h-24 rounded-full border border-brand-primary/20 animate-ping" />
                <div className="absolute w-16 h-16 rounded-full border border-brand-primary/40 animate-pulse" />
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-brand-primary">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
              </div>
              <div className="space-y-1.5 animate-bounce">
                <p className="text-sm font-semibold text-slate-200">Aligning GPS Satellites...</p>
                <p className="text-xs text-slate-500 max-w-xs font-mono">Calibrating ward-boundary coordinates and fetching localized civic databases.</p>
              </div>
            </div>

            {/* Simulated overlay points */}
            <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50 animate-pulse" />
            <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute bottom-1/4 left-1/2 w-3 h-3 rounded-full bg-cyan-500/30 border border-cyan-500/50 animate-pulse" style={{ animationDelay: '0.4s' }} />
            <div className="absolute bottom-1/3 left-1/4 w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50 animate-pulse" style={{ animationDelay: '0.6s' }} />

            {/* Fake overlay toggles in skeleton form */}
            <div className="absolute left-4 top-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />
              <div className="h-3 bg-slate-800 rounded w-16" />
            </div>

            {/* Fake legend at bottom */}
            <div className="absolute left-4 bottom-4 bg-brand-panel/95 border border-slate-800 p-3 rounded-lg flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-700" /><div className="h-2 bg-slate-800 rounded w-8" /></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-700" /><div className="h-2 bg-slate-800 rounded w-10" /></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-700" /><div className="h-2 bg-slate-800 rounded w-12" /></div>
            </div>
          </div>

          {/* Fake Preview Drawer Skeleton */}
          <div className="bg-brand-panel border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-32 h-24 bg-slate-800 rounded-xl shrink-0" />
            <div className="flex-grow space-y-2 w-full">
              <div className="flex gap-2">
                <div className="h-4 bg-slate-850 rounded w-16" />
                <div className="h-4 bg-slate-850 rounded w-20" />
              </div>
              <div className="h-4 bg-slate-850 rounded w-2/3" />
              <div className="h-3 bg-slate-850 rounded w-3/4" />
              <div className="flex gap-4">
                <div className="h-3 bg-slate-850 rounded w-24" />
                <div className="h-3 bg-slate-850 rounded w-16" />
              </div>
            </div>
            <div className="h-10 bg-slate-800 rounded-lg w-full md:w-44 shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  const mapContainerId = 'leaflet-dashboard-map';
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.FeatureGroup | null>(null);
  const densityGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Circle | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(5); // default 5 km
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showDensityOverlay, setShowDensityOverlay] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) {
      // Map center defaulted to Mumbai (Dadar area)
      mapRef.current = L.map(mapContainerId, {
        zoomControl: false // custom position later
      }).setView([userLat, userLng], 13);

      // CartoDB Voyager map tiles (Clean, modern, and has outstanding readability)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);

      markerGroupRef.current = L.featureGroup().addTo(mapRef.current);
      densityGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    return () => {
      // Don't fully destroy map on tab switch to preserve state unless unmounted
    };
  }, []);

  // Sync user location on map
  useEffect(() => {
    if (!mapRef.current) return;

    // Pan map to user coordinates
    mapRef.current.setView([userLat, userLng], 13);

    // Draw citizen verification range circle
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLat, userLng]);
      userMarkerRef.current.setRadius(maxDistance * 1000);
    } else {
      userMarkerRef.current = L.circle([userLat, userLng], {
        radius: maxDistance * 1000,
        color: '#0e8e6d', // brand-primary desaturated civic green
        fillColor: '#0e8e6d',
        fillOpacity: 0.04,
        weight: 1.2,
        dashArray: '3, 4'
      }).addTo(mapRef.current);
    }
  }, [userLat, userLng, maxDistance]);

  // Request browser location and reverse geocode
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onSetUserLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error getting browser geolocation:', error);
          alert('Could not capture browser geolocation. Defaulting to Dadar, Mumbai coordinates.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Filter Issues
  const filteredIssues = issues.filter((issue) => {
    const categoryMatch = selectedCategory === 'all' || issue.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || issue.status === selectedStatus;
    const distance = calculateDistance(userLat, userLng, issue.latitude, issue.longitude);
    const distanceMatch = distance <= maxDistance;
    
    const searchMatch =
      searchQuery === '' ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.wardName.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && statusMatch && distanceMatch && searchMatch;
  });

  // Find the 3 most recent reports submitted in the user's vicinity (distance <= maxDistance)
  const recentVicinityIssues = [...issues]
    .filter((issue) => {
      const distance = calculateDistance(userLat, userLng, issue.latitude, issue.longitude);
      return distance <= maxDistance;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Re-draw Markers and Density Clusters when filtered list or overlay mode changes
  useEffect(() => {
    if (!mapRef.current || !markerGroupRef.current || !densityGroupRef.current) return;

    // Clear previous markers & density elements
    markerGroupRef.current.clearLayers();
    densityGroupRef.current.clearLayers();

    // Adjust standard pin transparency if density overlay is on to make cluster highlights pop
    const markerOpacity = showDensityOverlay ? 0.35 : 1.0;

    filteredIssues.forEach((issue) => {
      const isSelected = selectedIssueId === issue.id;

      // Define CSS classes for category markers
      const colorMap = {
        pothole: 'bg-rose-500 border-rose-300 shadow-rose-500/20',
        garbage: 'bg-amber-600 border-amber-400 shadow-amber-600/20',
        streetlight: 'bg-yellow-500 border-yellow-300 shadow-yellow-500/20',
        'water leak': 'bg-cyan-500 border-cyan-300 shadow-cyan-500/20',
        'illegal dumping': 'bg-fuchsia-600 border-fuchsia-400 shadow-fuchsia-600/20',
        other: 'bg-slate-500 border-slate-300 shadow-slate-500/20'
      };
      const colorClass = colorMap[issue.category as keyof typeof colorMap] || colorMap.other;
      const ringAnim = issue.status === 'Reported' ? 'animate-ping' : '';

      // Set initials of category for easy identifier
      const label = issue.category === 'water leak' ? 'W' : issue.category[0].toUpperCase();

      const markerHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-xl ${colorClass} text-white font-display font-bold text-xs cursor-pointer transition-transform duration-200 hover:scale-110 ${
        isSelected ? 'ring-4 ring-emerald-400 scale-115' : ''
      }">
          ${issue.status === 'Reported' ? `<span class="absolute -inset-1 rounded-full ${ringAnim} ${colorClass} opacity-40"></span>` : ''}
          <span class="relative z-10">${label}</span>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon, opacity: markerOpacity });
      
      // Bind marker click event
      marker.on('click', () => {
        setSelectedIssueId(issue.id);
        mapRef.current?.panTo([issue.latitude, issue.longitude]);
      });

      marker.addTo(markerGroupRef.current!);
    });

    // Draw Dynamic Spatial Density Overlay Hotspots
    if (showDensityOverlay) {
      const clusters: {
        lat: number;
        lng: number;
        issues: Issue[];
        count: number;
      }[] = [];

      // Group nearby issues within ~400 meters of each other (roughly 0.4 km)
      filteredIssues.forEach((issue) => {
        let addedToCluster = false;
        for (const cluster of clusters) {
          const distance = calculateDistance(issue.latitude, issue.longitude, cluster.lat, cluster.lng);
          if (distance <= 0.4) {
            cluster.issues.push(issue);
            // Recalculate hotspot center centroid on addition
            cluster.lat = cluster.issues.reduce((sum, i) => sum + i.latitude, 0) / cluster.issues.length;
            cluster.lng = cluster.issues.reduce((sum, i) => sum + i.longitude, 0) / cluster.issues.length;
            cluster.count = cluster.issues.length;
            addedToCluster = true;
            break;
          }
        }
        if (!addedToCluster) {
          clusters.push({
            lat: issue.latitude,
            lng: issue.longitude,
            issues: [issue],
            count: 1
          });
        }
      });

      // Filter to find and highlight real high-volume problem clusters
      clusters.forEach((cluster) => {
        const count = cluster.count;
        
        // Setup styled circular heatzones according to issue density
        let innerRadius = 150; // meters
        let outerRadius = 300; // meters
        let color = '#f59e0b'; // Amber warning
        let fillOpacity = 0.22;
        let severityLabel = 'Moderate density';

        if (count >= 4) {
          innerRadius = 260;
          outerRadius = 500;
          color = '#ef4444'; // Red critical hazard
          fillOpacity = 0.42;
          severityLabel = 'CRITICAL OVERLOAD';
        } else if (count >= 2) {
          innerRadius = 200;
          outerRadius = 400;
          color = '#f97316'; // Orange High warning
          fillOpacity = 0.32;
          severityLabel = 'High density';
        }

        // 1. Draw Outer Faint Radiating Aura
        L.circle([cluster.lat, cluster.lng], {
          radius: outerRadius,
          color: color,
          fillColor: color,
          fillOpacity: fillOpacity * 0.35,
          weight: 0,
          interactive: false
        }).addTo(densityGroupRef.current!);

        // 2. Draw Dense Core Hotspot Circle
        const coreCircle = L.circle([cluster.lat, cluster.lng], {
          radius: innerRadius,
          color: color,
          fillColor: color,
          fillOpacity: fillOpacity,
          weight: 1.5,
          dashArray: '3, 4'
        }).addTo(densityGroupRef.current!);

        // Prepare categories list to present in cluster info
        const categoryCounts = cluster.issues.reduce((acc, curr) => {
          acc[curr.category] = (acc[curr.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const categoriesString = Object.entries(categoryCounts)
          .map(([cat, cnt]) => `${cnt}x ${cat.charAt(0).toUpperCase() + cat.slice(1)}`)
          .join(', ');

        const popupHtml = `
          <div class="p-2.5 space-y-1.5 min-w-[210px] font-sans">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span class="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded ${
                count >= 4 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }">
                ${severityLabel.toUpperCase()}
              </span>
              <span class="text-[11px] font-mono text-slate-400 font-bold">${count} Reports</span>
            </div>
            <h4 class="font-bold text-xs text-white">Active Problem Cluster</h4>
            <p class="text-[10px] text-slate-300 leading-normal">
              Accumulated civic issues: <span class="font-semibold text-white">${categoriesString}</span>
            </p>
            <div class="text-[9px] text-slate-500 font-mono flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
              <span>Geo-center:</span>
              <span>${cluster.lat.toFixed(4)}° N, ${cluster.lng.toFixed(4)}° E</span>
            </div>
          </div>
        `;

        coreCircle.bindPopup(popupHtml, {
          className: 'custom-leaflet-popup',
          maxWidth: 240
        });

        // 3. Render floating count badge directly over cluster centroid
        const badgeHtml = `
          <div class="flex items-center justify-center w-6 h-6 rounded-full border border-white font-mono font-extrabold text-[10px] text-slate-950 shadow-xl ${
            count >= 4 ? 'bg-red-400 animate-pulse' : 'bg-amber-400'
          }" style="transform: translate(-12px, -12px);">
            ${count}
          </div>
        `;

        const badgeIcon = L.divIcon({
          html: badgeHtml,
          className: 'custom-density-badge-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([cluster.lat, cluster.lng], { icon: badgeIcon, interactive: false }).addTo(densityGroupRef.current!);
      });
    }
  }, [filteredIssues, selectedIssueId, showDensityOverlay]);

  const activeSelectedIssue = issues.find((i) => i.id === selectedIssueId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)]">
      {/* Map Control Sidebar */}
      <div className="lg:col-span-1 bg-brand-panel border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          {/* Geolocation Section */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-primary" />
                Your Geolocation
              </h2>
              <button
                id="btn-detect-loc"
                onClick={handleDetectLocation}
                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-semibold border border-slate-700 hover:border-slate-600 px-2.5 py-1 rounded-lg bg-slate-900 transition-colors shadow-sm"
              >
                <MapPin className="w-3 h-3" /> Detect
              </button>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/85 mt-2">
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                <span>Latitude:</span>
                <span className="text-slate-200 font-semibold">{userLat.toFixed(4)}° N</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between mt-1">
                <span>Longitude:</span>
                <span className="text-slate-200 font-semibold">{userLng.toFixed(4)}° E</span>
              </div>
              <div className="text-[11px] text-brand-primary font-mono mt-1.5 flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                <span>Local Ward:</span>
                <span className="font-bold">{getWardFromLatLng(userLat, userLng)}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Filters Title */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Search & Filters
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              id="search-input"
              type="text"
              placeholder="Search ward, street, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 text-xs border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Range Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Crowd Range Radius:</span>
              <span className="text-brand-primary font-mono font-semibold">{maxDistance} km</span>
            </div>
            <input
              id="range-distance-slider"
              type="range"
              min="1"
              max="15"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-brand-primary h-1.5 bg-slate-950 rounded cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 italic">
              Shows issues reported within {maxDistance} km of your position.
            </div>
          </div>

          {/* Dynamic Density Cluster Overlay Option */}
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/85 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-accent animate-pulse shrink-0" />
                Problem Clusters
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="density-overlay-toggle-checkbox"
                  type="checkbox"
                  checked={showDensityOverlay}
                  onChange={(e) => setShowDensityOverlay(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-red-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
              </label>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Fuses neighboring reports into a glowing heat map with click-to-view popup analytics of urgent local concerns.
            </p>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Category</label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Potholes</option>
              <option value="garbage">Garbage Pileup</option>
              <option value="streetlight">Streetlights</option>
              <option value="water leak">Water Leakages</option>
              <option value="illegal dumping">Illegal Dumping</option>
              <option value="other">Other Concerns</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Status</label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported (Pending)</option>
              <option value="Verified">Verified (Escalated)</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Recent Activity Feed */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-brand-primary" />
                Recent Vicinity Activity
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-bold animate-pulse">Live</span>
            </div>
            
            {recentVicinityIssues.length > 0 ? (
              <div className="space-y-2">
                {recentVicinityIssues.map((issue) => {
                  const isSelected = selectedIssueId === issue.id;
                  const distance = calculateDistance(userLat, userLng, issue.latitude, issue.longitude);
                  
                  const categoryColors = {
                    pothole: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                    garbage: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    streetlight: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                    'water leak': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                    'illegal dumping': 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
                    other: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                  };
                  const colorClass = categoryColors[issue.category as keyof typeof categoryColors] || categoryColors.other;

                  return (
                    <button
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        mapRef.current?.setView([issue.latitude, issue.longitude], 15);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all duration-200 flex flex-col space-y-1 ${
                        isSelected
                          ? 'bg-slate-850 border-brand-primary/40 shadow-lg shadow-brand-primary/5'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${colorClass}`}>
                          {issue.category}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {distance.toFixed(1)} km away
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 truncate w-full">
                        {issue.title}
                      </h4>
                      <div className="flex items-center justify-between w-full text-[9px] text-slate-500 font-mono pt-1">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-brand-primary flex items-center gap-0.5 font-bold">
                          ★ {issue.confirms} verifies
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center border border-dashed border-slate-800 bg-slate-950/20 rounded-lg text-slate-500 space-y-1">
                <p className="text-[10px] font-semibold">No recent activity nearby</p>
                <p className="text-[9px] text-slate-600 leading-normal">
                  Expand your search radius or report a new local issue to initiate a feed here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Aggregate total count */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Active pins in range:</span>
          <span className="text-brand-primary font-mono font-semibold bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20">
            {filteredIssues.length}
          </span>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="lg:col-span-3 flex flex-col space-y-4">
        <div className="relative flex-grow border border-slate-800 bg-brand-panel rounded-xl overflow-hidden shadow-inner min-h-[350px]">
          {/* Leaflet map binds to this ID */}
          <div id={mapContainerId} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Map Overlay Quick Toggle for Cluster Overlay */}
          <div className="absolute left-4 top-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-850 shadow-2xl flex items-center space-x-3 select-none">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${showDensityOverlay ? 'bg-red-400' : 'bg-slate-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${showDensityOverlay ? 'bg-red-500' : 'bg-slate-500'}`}></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-200">Density Overlay</span>
            </div>
            <button
              id="toggle-density-overlay-map"
              onClick={() => setShowDensityOverlay(!showDensityOverlay)}
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md transition-all uppercase tracking-wider ${
                showDensityOverlay 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {showDensityOverlay ? 'Active' : 'Off'}
            </button>
          </div>

          {filteredIssues.length === 0 && (
            <div className="absolute inset-0 bg-brand-bg/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-3 bg-brand-panel border border-slate-800 rounded-xl text-slate-400">
                <MapPin className="w-5 h-5 text-brand-accent" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200">No reported issues in this area</p>
                <p className="text-xs text-slate-400 max-w-xs">Adjust your search filters, expand the crowd radius, or report a new civic issue to pin it here.</p>
              </div>
            </div>
          )}

          {/* Overlay key code indicators */}
          <div className="absolute left-4 bottom-4 z-10 bg-brand-panel/95 backdrop-blur-md p-3 rounded-lg border border-slate-800 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-400 shadow-xl max-w-[calc(100%-2rem)]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> <span>Pothole</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-600" /> <span>Garbage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> <span>Light</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> <span>Water Leak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-600" /> <span>Dumping</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse border border-brand-primary/40" /> <span>Citizen</span>
            </div>
          </div>
        </div>

        {/* Selected Issue Drawer / Preview Quick Card */}
        {activeSelectedIssue && (
          <div id="selected-issue-drawer" className="bg-brand-panel border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4 fade-in">
            <img
              src={activeSelectedIssue.beforeImage}
              alt={activeSelectedIssue.title}
              className="w-full md:w-32 h-24 object-cover rounded-xl border border-slate-800 bg-slate-950 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-grow space-y-1.5 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-950/50 text-slate-300 font-medium uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeSelectedIssue.severity === 'high'
                      ? 'bg-red-500'
                      : activeSelectedIssue.severity === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-brand-primary'
                  }`} />
                  {activeSelectedIssue.severity} priority
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-950/50 text-slate-300 font-medium uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeSelectedIssue.status === 'Resolved'
                      ? 'bg-blue-400'
                      : activeSelectedIssue.status === 'In Progress'
                      ? 'bg-amber-500'
                      : activeSelectedIssue.status === 'Verified'
                      ? 'bg-emerald-500'
                      : 'bg-slate-500'
                  }`} />
                  {activeSelectedIssue.status}
                </span>
                <span className="text-[10px] font-mono text-slate-500 ml-auto">
                  ID: {activeSelectedIssue.id}
                </span>
              </div>
              <h3 className="font-display font-semibold text-sm text-white truncate">
                {activeSelectedIssue.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">
                {activeSelectedIssue.description}
              </p>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-brand-primary" /> {activeSelectedIssue.confirms} Confirmed</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" /> {new Date(activeSelectedIssue.createdAt).toLocaleDateString()}</span>
                <span className="truncate max-w-[200px]">📍 {activeSelectedIssue.address}</span>
              </div>
            </div>
            <button
              id={`view-details-${activeSelectedIssue.id}`}
              onClick={() => onSelectIssue(activeSelectedIssue.id)}
              className="w-full md:w-auto px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/85 text-slate-950 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Eye className="w-4 h-4" /> View Details & Track
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
