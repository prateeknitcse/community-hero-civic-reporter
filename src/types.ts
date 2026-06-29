/**
 * Types and interfaces for Community Hero
 */

export type IssueCategory = 'pothole' | 'garbage' | 'streetlight' | 'water leak' | 'illegal dumping' | 'other';
export type IssueSeverity = 'low' | 'medium' | 'high';
export type IssueStatus = 'Reported' | 'Verified' | 'In Progress' | 'Resolved';

export interface User {
  id: string;
  name: string;
  email: string;
  reputation: number;
  reportedCount: number;
  verifiedCount: number;
  ward: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  address: string;
  beforeImage: string; // URL or base64 string
  afterImage?: string; // URL or base64 string
  confidenceScore: number;
  reporterId: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
  confirms: number;
  disputes: number;
  verifiedAt?: string;
  resolvedAt?: string;
  isSpam: boolean;
  wardName: string;
}

export interface Verification {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  type: 'confirm' | 'dispute';
  createdAt: string;
}

export interface WardStats {
  id: string;
  name: string;
  reportedCount: number;
  resolvedCount: number;
  avgResolutionTimeHours: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  reputation: number;
  ward: string;
  reportsCount: number;
  verificationsCount: number;
}

export interface StatsOverview {
  totalIssues: number;
  resolvedIssues: number;
  pendingVerification: number;
  verifiedCount: number;
  inProgressCount: number;
  byCategory: Record<IssueCategory, number>;
  byWard: Record<string, { reported: number; resolved: number }>;
  avgResolutionHours: number;
  predictiveInsights: string[];
}
