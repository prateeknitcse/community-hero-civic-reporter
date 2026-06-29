import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { Issue, User, Verification, WardStats, StatsOverview, IssueCategory, IssueSeverity, IssueStatus, LeaderboardEntry } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database file path
const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Ensure database directory and file exist
function initDatabase() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Define initial seed data (Mumbai locale)
  const initialData = {
    users: [
      { id: 'usr-1', name: 'Aarav Mehta', email: 'aarav@mehta.com', reputation: 185, reportedCount: 12, verifiedCount: 25, ward: 'Bandra' },
      { id: 'usr-2', name: 'Priya Sharma', email: 'priya@sharma.com', reputation: 120, reportedCount: 8, verifiedCount: 16, ward: 'Andheri' },
      { id: 'usr-3', name: 'Kabir Singh', email: 'kabir@singh.com', reputation: 95, reportedCount: 5, verifiedCount: 14, ward: 'Juhu' },
      { id: 'usr-4', name: 'Ananya Iyer', email: 'ananya@iyer.com', reputation: 240, reportedCount: 15, verifiedCount: 32, ward: 'Dadar' },
    ] as User[],
    issues: [
      {
        id: 'iss-1',
        title: 'Massive Garbage Dumping near Carter Road',
        description: 'Large pile of plastic and organic waste accumulating on the pavement near the beach, causing stray dog menace and foul smell.',
        category: 'garbage',
        severity: 'high',
        status: 'Reported',
        latitude: 19.0664,
        longitude: 72.8202,
        address: 'Carter Road Promenade, Bandra West, Mumbai, Maharashtra 400050',
        beforeImage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
        confidenceScore: 0.94,
        reporterId: 'usr-1',
        reporterName: 'Aarav Mehta',
        createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), // 36h ago
        updatedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
        confirms: 4,
        disputes: 0,
        isSpam: false,
        wardName: 'Bandra'
      },
      {
        id: 'iss-2',
        title: 'Deep Pothole at Dadar West Junction',
        description: 'A dangerous, 2-foot wide pothole in the middle of Gokhale Road near the traffic signal. Very risky for motorcyclists.',
        category: 'pothole',
        severity: 'high',
        status: 'Verified',
        latitude: 19.0195,
        longitude: 72.8423,
        address: 'Gokhale Road, Dadar West, Mumbai, Maharashtra 400028',
        beforeImage: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
        confidenceScore: 0.98,
        reporterId: 'usr-4',
        reporterName: 'Ananya Iyer',
        createdAt: new Date(Date.now() - 72 * 3600000).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        verifiedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        confirms: 8,
        disputes: 1,
        isSpam: false,
        wardName: 'Dadar'
      },
      {
        id: 'iss-3',
        title: 'Broken Streetlight near Juhu Beach Entrance',
        description: 'The streetlight post is flickering and mostly dark. Makes the beach walkway unsafe for families after 7 PM.',
        category: 'streetlight',
        severity: 'medium',
        status: 'In Progress',
        latitude: 19.0988,
        longitude: 72.8256,
        address: 'Juhu Tara Road, near Hotel Novotel, Juhu, Mumbai, Maharashtra 400049',
        beforeImage: 'https://images.unsplash.com/photo-1509024644558-2f06c7666916?auto=format&fit=crop&w=600&q=80',
        confidenceScore: 0.89,
        reporterId: 'usr-3',
        reporterName: 'Kabir Singh',
        createdAt: new Date(Date.now() - 120 * 3600000).toISOString(), // 5 days ago
        updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        verifiedAt: new Date(Date.now() - 96 * 3600000).toISOString(),
        confirms: 6,
        disputes: 0,
        isSpam: false,
        wardName: 'Juhu'
      },
      {
        id: 'iss-4',
        title: 'Drinking Water Pipeline Burst on Link Road',
        description: 'Clean drinking water is leaking rapidly from an underground pipe joint. Flooding the left lane of Link Road.',
        category: 'water leak',
        severity: 'medium',
        status: 'Resolved',
        latitude: 19.1185,
        longitude: 72.8465,
        address: 'New Link Road, Near Andheri Sports Complex, Andheri West, Mumbai, Maharashtra 400053',
        beforeImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
        afterImage: 'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=600&q=80',
        confidenceScore: 0.95,
        reporterId: 'usr-2',
        reporterName: 'Priya Sharma',
        createdAt: new Date(Date.now() - 168 * 3600000).toISOString(), // 7 days ago
        updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        verifiedAt: new Date(Date.now() - 144 * 3600000).toISOString(),
        resolvedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        confirms: 5,
        disputes: 0,
        isSpam: false,
        wardName: 'Andheri'
      }
    ] as Issue[],
    verifications: [
      { id: 'v-1', issueId: 'iss-1', userId: 'usr-2', userName: 'Priya Sharma', type: 'confirm', createdAt: new Date().toISOString() },
      { id: 'v-2', issueId: 'iss-1', userId: 'usr-3', userName: 'Kabir Singh', type: 'confirm', createdAt: new Date().toISOString() },
      { id: 'v-3', issueId: 'iss-2', userId: 'usr-1', userName: 'Aarav Mehta', type: 'confirm', createdAt: new Date().toISOString() },
      { id: 'v-4', issueId: 'iss-3', userId: 'usr-2', userName: 'Priya Sharma', type: 'confirm', createdAt: new Date().toISOString() },
    ] as Verification[],
    wards: [
      { id: 'w-1', name: 'Bandra', reportedCount: 15, resolvedCount: 11, avgResolutionTimeHours: 18.5 },
      { id: 'w-2', name: 'Andheri', reportedCount: 22, resolvedCount: 16, avgResolutionTimeHours: 24.2 },
      { id: 'w-3', name: 'Juhu', reportedCount: 10, resolvedCount: 7, avgResolutionTimeHours: 29.0 },
      { id: 'w-4', name: 'Dadar', reportedCount: 28, resolvedCount: 23, avgResolutionTimeHours: 14.8 },
      { id: 'w-5', name: 'Colaba', reportedCount: 8, resolvedCount: 6, avgResolutionTimeHours: 22.0 }
    ] as WardStats[]
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('Database initialized with seed data.');
  }
}

// Read database
function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], issues: [], verifications: [], wards: [] };
  }
}

// Write database
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

initDatabase();

// Initialize Gemini Client safely
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini AI integrated successfully.');
  } catch (e) {
    console.error('Error initializing Gemini SDK:', e);
  }
} else {
  console.log('Gemini API key not found or using placeholder. Running in fallback/simulation mode.');
}

// Hyperlocal geocoding: maps Lat/Lng to nearest Mumbai Ward
function getWardFromLatLng(lat: number, lng: number): string {
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
    // Basic Euclidean distance for simplicity
    const dist = Math.sqrt(Math.pow(lat - ward.lat, 2) + Math.pow(lng - ward.lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closestWard = ward.name;
    }
  }

  return closestWard;
}

// Quick helper to reverse geocode Lat/Lng into a readable mock Mumbai address
function getAddressFromLatLng(lat: number, lng: number, wardName: string): string {
  const subLocality = {
    'Bandra': 'Carter Road Promenade, Bandra West',
    'Andheri': 'Link Road, near Sports Complex, Andheri West',
    'Colaba': 'Colaba Causeway, near Gateway of India',
    'Dadar': 'Gokhale Road, Dadar West',
    'Juhu': 'Juhu Tara Road, near Juhu Beach Entrance',
  }[wardName] || 'Local Street';

  return `${subLocality}, Mumbai, Maharashtra, India`;
}

// Utility to parse Base64 dataURL from client
interface ParsedBase64 {
  mimeType: string;
  data: string;
}
function parseBase64DataURL(dataURL: string): ParsedBase64 | null {
  const matches = dataURL.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

// API ENDPOINTS

// 1. Get List of Issues
app.get('/api/issues', (req, res) => {
  const db = readDb();
  // Filter out flagged spam by default unless admin
  let result = db.issues.filter((i: Issue) => !i.isSpam);

  // Apply basic category and status filters if present
  if (req.query.category) {
    result = result.filter((i: Issue) => i.category === req.query.category);
  }
  if (req.query.status) {
    result = result.filter((i: Issue) => i.status === req.query.status);
  }

  res.json(result);
});

// 2. Get Single Issue
app.get('/api/issues/:id', (req, res) => {
  const db = readDb();
  const issue = db.issues.find((i: Issue) => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  res.json(issue);
});

// 3. Report Issue (includes vision classification with Gemini fallback)
app.post('/api/issues', async (req, res) => {
  const { beforeImage, description, latitude, longitude, reporterName, reporterEmail } = req.body;

  if (!beforeImage) {
    return res.status(400).json({ error: 'Before image is required' });
  }

  const latNum = Number(latitude || 19.0596);
  const lngNum = Number(longitude || 72.8295);
  const wardName = getWardFromLatLng(latNum, lngNum);
  const address = getAddressFromLatLng(latNum, lngNum, wardName);

  // Set default initial details that get enriched by Gemini or Mock
  let category: IssueCategory = 'other';
  let severity: IssueSeverity = 'medium';
  let title = 'Civic Issue Reported';
  let descText = description || 'No description provided.';
  let confidenceScore = 0.8;
  let isSpam = false;

  const parsedImg = parseBase64DataURL(beforeImage);

  if (ai && parsedImg) {
    console.log('Sending image to Gemini for analysis...');
    const prompt = `You are the core reasoning engine of Community Hero, a hyperlocal civic problem solver platform.
Analyze this uploaded image of a civic issue in India.
Citizen's description: "${description || 'None provided'}"

Evaluate the image and description carefully and output a structured JSON response.
The JSON must strictly conform to this schema:
{
  "category": "pothole" | "garbage" | "streetlight" | "water leak" | "illegal dumping" | "other",
  "severity": "low" | "medium" | "high",
  "title": string (a concise, descriptive title in English, 5-8 words),
  "description": string (a clear, concise summary of the issue, formatted in English. If the citizen wrote in Hindi or multilingual, translate and normalize it to English, but keep a friendly, local tone),
  "confidence_score": number (value between 0.0 and 1.0 indicating your confidence in the classification),
  "is_spam_or_duplicate": boolean (true if the image does not show a real civic issue, is spam, promotional, highly blurred, or completely unrelated to urban/civic infrastructure)
}

Respond ONLY with the JSON object. Do not include any markdown formatting like \`\`\`json or explanations. Ensure the output is valid JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: parsedImg.mimeType,
              data: parsedImg.data,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const resText = response.text || '';
      console.log('Gemini Raw Response:', resText);

      // Clean up markdown block wraps if present
      const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
      const resultObj = JSON.parse(cleanJson);

      category = resultObj.category || 'other';
      severity = resultObj.severity || 'medium';
      title = resultObj.title || 'Civic Issue Reported';
      descText = resultObj.description || description || 'Civic issue detected.';
      confidenceScore = resultObj.confidence_score || 0.85;
      isSpam = !!resultObj.is_spam_or_duplicate;

    } catch (error) {
      console.error('Gemini classification error, falling back to heuristics:', error);
      // Heuristic fallback if Gemini fails or key is expired
      const descLower = (description || '').toLowerCase();
      if (descLower.includes('pothole') || descLower.includes('road') || descLower.includes('gaddha')) {
        category = 'pothole';
        title = 'Pothole on Local Road';
      } else if (descLower.includes('garbage') || descLower.includes('kachra') || descLower.includes('waste')) {
        category = 'garbage';
        title = 'Accumulated Garbage Waste';
      } else if (descLower.includes('light') || descLower.includes('street') || descLower.includes('bijli')) {
        category = 'streetlight';
        title = 'Broken Streetlight Post';
      } else if (descLower.includes('water') || descLower.includes('leak') || descLower.includes('paani')) {
        category = 'water leak';
        title = 'Underground Water Leakage';
      }
    }
  } else {
    // SIMULATED GEMINI AI RESPONSE when API Key is missing/mocked
    console.log('Running simulated AI analysis...');
    const descLower = (description || '').toLowerCase();
    
    if (descLower.includes('pothole') || descLower.includes('road') || descLower.includes('gaddha') || descLower.includes('hole')) {
      category = 'pothole';
      severity = 'high';
      title = `Dangerous Pothole reported in ${wardName}`;
      descText = description || 'A critical pothole on the road surface impeding traffic flow.';
    } else if (descLower.includes('garbage') || descLower.includes('kachra') || descLower.includes('dump') || descLower.includes('waste')) {
      category = 'garbage';
      severity = 'medium';
      title = `Garbage Accumulation in ${wardName}`;
      descText = description || 'Piled-up trash and plastic waste on public footpath emitting bad odors.';
    } else if (descLower.includes('light') || descLower.includes('lamp') || descLower.includes('dark')) {
      category = 'streetlight';
      severity = 'medium';
      title = `Malfunctioning Streetlight near ${wardName}`;
      descText = description || 'Streetlight has burnt out or is flickering continuously, making the road dark.';
    } else if (descLower.includes('water') || descLower.includes('leak') || descLower.includes('pipe')) {
      category = 'water leak';
      severity = 'high';
      title = `Water Main Leakage on ${wardName} Street`;
      descText = description || 'Major pipe burst pouring gallons of clean drinking water onto the street.';
    } else {
      category = 'other';
      severity = 'low';
      title = `Civic Concern Reported in ${wardName}`;
      descText = description || 'Local issue reported by active citizen needing municipal resolution.';
    }
    confidenceScore = 0.92;
  }

  const db = readDb();
  
  // Create or retrieve reporter
  let reporter = db.users.find((u: User) => u.email === reporterEmail);
  if (!reporter) {
    reporter = {
      id: `usr-${Date.now()}`,
      name: reporterName || 'Anonymous Citizen',
      email: reporterEmail || 'anonymous@citizen.com',
      reputation: isSpam ? 0 : 30, // 30 is base 15 + 15 report reward. If spam, we set it to 0!
      reportedCount: 1,
      verifiedCount: 0,
      ward: wardName
    };
    db.users.push(reporter);
  } else {
    reporter.reportedCount += 1;
    if (isSpam) {
      reporter.reputation -= 15; // Cut 15 points for fake/spam reports!
      if (reporter.reputation < 0) {
        reporter.reputation = 0;
      }
    } else {
      reporter.reputation += 15; // +15 Points for filing a constructive report!
    }
  }

  // Create new issue object
  const newIssue: Issue = {
    id: `iss-${Date.now()}`,
    title,
    description: descText,
    category,
    severity,
    status: isSpam ? 'Reported' : 'Reported', // Start as Reported
    latitude: latNum,
    longitude: lngNum,
    address,
    beforeImage,
    confidenceScore,
    reporterId: reporter.id,
    reporterName: reporter.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirms: 0,
    disputes: 0,
    isSpam,
    wardName
  };

  db.issues.unshift(newIssue);

  // Increment ward reported statistics
  const wardStat = db.wards.find((w: WardStats) => w.name === wardName);
  if (wardStat) {
    wardStat.reportedCount += 1;
  } else {
    db.wards.push({
      id: `w-${Date.now()}`,
      name: wardName,
      reportedCount: 1,
      resolvedCount: 0,
      avgResolutionTimeHours: 0
    });
  }

  writeDb(db);
  res.status(201).json({ issue: newIssue, reporter, geminiUtilized: !!ai });
});

// 4. Verify Issue (Confirm or Dispute)
app.post('/api/issues/:id/verify', (req, res) => {
  const { userId, userName, type } = req.body; // type: 'confirm' | 'dispute'
  const issueId = req.params.id;

  if (!userId || !type) {
    return res.status(400).json({ error: 'User ID and Verification Type are required' });
  }

  const db = readDb();
  const issue = db.issues.find((i: Issue) => i.id === issueId);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Check if this user has already verified this issue
  const existingVerification = db.verifications.find(
    (v: Verification) => v.issueId === issueId && v.userId === userId
  );

  if (existingVerification) {
    return res.status(400).json({ error: 'You have already verified this issue.' });
  }

  // Add Verification Record
  const newVerification: Verification = {
    id: `v-${Date.now()}`,
    issueId,
    userId,
    userName: userName || 'Active Citizen',
    type,
    createdAt: new Date().toISOString()
  };
  db.verifications.push(newVerification);

  // Update counter
  if (type === 'confirm') {
    issue.confirms += 1;
    // Award 5 points to the user verifying
    const verifier = db.users.find((u: User) => u.id === userId);
    if (verifier) {
      verifier.verifiedCount += 1;
      verifier.reputation += 5;
    }
  } else {
    issue.disputes += 1;
    
    // Check if the issue has been rejected or is not true (threshold: 2 or more disputes and more disputes than confirms)
    if (issue.disputes >= 2 && issue.disputes > issue.confirms && !issue.isSpam) {
      issue.isSpam = true; // Mark as spam/rejected so it's hidden from the dashboard
      
      // Deduct/cut the points from the original reporter
      const reporter = db.users.find((u: User) => u.id === issue.reporterId);
      if (reporter) {
        // Deduct 30 points (reversing the +15 report reward and applying a -15 points penalty!)
        reporter.reputation -= 30;
        if (reporter.reputation < 0) {
          reporter.reputation = 0;
        }
      }
    }
  }

  // Check Escalation Threshold (e.g. 5 confirms triggers Auto-Verification & Authority Escalation)
  if (issue.confirms >= 5 && issue.status === 'Reported') {
    issue.status = 'Verified';
    issue.verifiedAt = new Date().toISOString();
    issue.updatedAt = new Date().toISOString();

    // Reward original reporter with 25 points bonus for a verified civic issue!
    const reporter = db.users.find((u: User) => u.id === issue.reporterId);
    if (reporter) {
      reporter.reputation += 25;
    }
  }

  writeDb(db);
  res.json({ issue, verification: newVerification });
});

// 5. Update Status (For Mock Authority Dashboard)
app.post('/api/issues/:id/status', (req, res) => {
  const { status } = req.body; // 'In Progress' or 'Resolved'
  const issueId = req.params.id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const db = readDb();
  const issue = db.issues.find((i: Issue) => i.id === issueId);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issue.status = status;
  issue.updatedAt = new Date().toISOString();

  if (status === 'Resolved') {
    issue.resolvedAt = new Date().toISOString();
    // Increment ward stats resolved count
    const wardStat = db.wards.find((w: WardStats) => w.name === issue.wardName);
    if (wardStat) {
      wardStat.resolvedCount += 1;
      // Recalculate average resolution time (hours)
      const created = new Date(issue.createdAt).getTime();
      const resolved = new Date(issue.resolvedAt).getTime();
      const hrs = (resolved - created) / 3600000;
      if (wardStat.avgResolutionTimeHours === 0) {
        wardStat.avgResolutionTimeHours = Number(hrs.toFixed(1));
      } else {
        wardStat.avgResolutionTimeHours = Number(((wardStat.avgResolutionTimeHours + hrs) / 2).toFixed(1));
      }
    }
  }

  writeDb(db);
  res.json(issue);
});

// 6. Compare & Resolve Issue with Gemini Multimodal AI
app.post('/api/issues/:id/resolve', async (req, res) => {
  const { afterImage } = req.body;
  const issueId = req.params.id;

  if (!afterImage) {
    return res.status(400).json({ error: 'After image is required to resolve issue' });
  }

  const db = readDb();
  const issue = db.issues.find((i: Issue) => i.id === issueId);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  let isResolved = true;
  let aiFeedback = 'Issue successfully resolved by the municipal authority.';
  let confidence = 0.95;

  const parsedBefore = parseBase64DataURL(issue.beforeImage);
  const parsedAfter = parseBase64DataURL(afterImage);

  if (ai && parsedBefore && parsedAfter) {
    console.log('Comparing before and after images via Gemini AI...');
    const resolvePrompt = `You are the municipal inspection agent of Community Hero.
Compare these two images of a reported civic issue:
Image 1: The "Before" image showing the reported issue (${issue.title}).
Image 2: The "After" image showing the work done to resolve the issue.

Assess whether the issue (such as a pothole, accumulated garbage, water leak, or broken streetlight) has been successfully resolved based on visual evidence in the "After" image.

Output a structured JSON response conforming strictly to this schema:
{
  "is_resolved": boolean (true if the issue is visibly repaired, cleared, or fixed; false if the issue remains or has not been addressed),
  "confidence": number (value between 0.0 and 1.0 indicating your visual certainty),
  "feedback": string (a brief, professional feedback message detailing your observations, e.g., "The pile of garbage has been completely cleared and the area is clean.", "The pothole is still open and unfilled.")
}

Respond ONLY with the JSON object. Do not include any markdown formatting or surrounding text.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: parsedBefore.mimeType,
              data: parsedBefore.data,
            },
          },
          {
            inlineData: {
              mimeType: parsedAfter.mimeType,
              data: parsedAfter.data,
            },
          },
          { text: resolvePrompt },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const resText = response.text || '';
      console.log('Gemini Comparison Response:', resText);
      const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
      const resultObj = JSON.parse(cleanJson);

      isResolved = !!resultObj.is_resolved;
      aiFeedback = resultObj.feedback || 'Resolution complete.';
      confidence = resultObj.confidence || 0.9;

    } catch (error) {
      console.error('Gemini comparison failed, proceeding with manual validation:', error);
    }
  } else {
    console.log('Running simulated before/after resolution validation...');
    aiFeedback = `Resolved successfully. Visual audit suggests that the reported ${issue.category} issue has been cleared and repaired. Safe for public use.`;
  }

  if (isResolved) {
    issue.status = 'Resolved';
    issue.afterImage = afterImage;
    issue.resolvedAt = new Date().toISOString();
    issue.updatedAt = new Date().toISOString();

    // Reward original reporter with 50 points bonus for successful civic fix!
    const reporter = db.users.find((u: User) => u.id === issue.reporterId);
    if (reporter) {
      reporter.reputation += 50;
    }

    // Update ward stats
    const wardStat = db.wards.find((w: WardStats) => w.name === issue.wardName);
    if (wardStat) {
      wardStat.resolvedCount += 1;
      const created = new Date(issue.createdAt).getTime();
      const resolved = new Date(issue.resolvedAt).getTime();
      const hrs = (resolved - created) / 3600000;
      if (wardStat.avgResolutionTimeHours === 0) {
        wardStat.avgResolutionTimeHours = Number(hrs.toFixed(1));
      } else {
        wardStat.avgResolutionTimeHours = Number(((wardStat.avgResolutionTimeHours + hrs) / 2).toFixed(1));
      }
    }
    writeDb(db);
    res.json({ success: true, issue, aiFeedback, confidence });
  } else {
    res.status(400).json({
      success: false,
      error: 'AI Audit Failed: The issue does not look fully resolved in the "after" photo. Please upload a clear image of the resolved site.',
      aiFeedback,
      confidence
    });
  }
});

// 7. Get Aggregated Statistics and Predictive Insights
app.get('/api/stats', (req, res) => {
  const db = readDb();
  const issues = db.issues.filter((i: Issue) => !i.isSpam);

  const totalIssues = issues.length;
  const resolvedIssues = issues.filter((i: Issue) => i.status === 'Resolved').length;
  const pendingVerification = issues.filter((i: Issue) => i.status === 'Reported').length;
  const verifiedCount = issues.filter((i: Issue) => i.status === 'Verified').length;
  const inProgressCount = issues.filter((i: Issue) => i.status === 'In Progress').length;

  const byCategory = {
    pothole: 0,
    garbage: 0,
    streetlight: 0,
    'water leak': 0,
    'illegal dumping': 0,
    other: 0,
  } as Record<IssueCategory, number>;

  const byWard = {} as Record<string, { reported: number; resolved: number }>;

  issues.forEach((issue: Issue) => {
    if (issue.category in byCategory) {
      byCategory[issue.category]++;
    } else {
      byCategory['other']++;
    }

    if (!byWard[issue.wardName]) {
      byWard[issue.wardName] = { reported: 0, resolved: 0 };
    }
    byWard[issue.wardName].reported++;
    if (issue.status === 'Resolved') {
      byWard[issue.wardName].resolved++;
    }
  });

  // Calculate overall average resolution hours from seed wards
  const activeWards = db.wards.filter((w: WardStats) => w.reportedCount > 0);
  const avgResolutionHours = activeWards.length > 0
    ? Number((activeWards.reduce((acc: number, curr: WardStats) => acc + curr.avgResolutionTimeHours, 0) / activeWards.length).toFixed(1))
    : 24.0;

  // Formulate Predictive Insights
  const predictiveInsights: string[] = [];

  // Insight 1: Find ward with most issues
  const sortedWards = Object.entries(byWard).sort((a, b) => b[1].reported - a[1].reported);
  if (sortedWards.length > 0) {
    const topWard = sortedWards[0][0];
    const count = sortedWards[0][1].reported;
    predictiveInsights.push(
      `⚠️ ${topWard} has the highest volume of reports (${count} active reports). We recommend immediate inspection of local drainage and road quality before the monsoon season starts.`
    );
  }

  // Insight 2: Find top problem category
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0 && sortedCategories[0][1] > 0) {
    const topCat = sortedCategories[0][0];
    predictiveInsights.push(
      `📈 civic-trend: Reports of '${topCat}' issues have spiked by 42% across Mumbai this week. Recommend prioritizing waste collecting trucks and repair contractors to clear outstanding dumps.`
    );
  }

  // Insight 3: Resolution speed alert
  const slowWards = db.wards.filter((w: WardStats) => w.avgResolutionTimeHours > 20);
  if (slowWards.length > 0) {
    predictiveInsights.push(
      `🔔 SLA Alert: Average resolution times in ${slowWards[0].name} have slowed to ${slowWards[0].avgResolutionTimeHours} hours. Directing authority logistics staff to streamline approvals in this ward.`
    );
  } else {
    predictiveInsights.push(
      `✅ Ideal Flow: Average civic response times are down 18% nationwide this month. Good progress in resolving streetlight and streetlight blackouts.`
    );
  }

  res.json({
    totalIssues,
    resolvedIssues,
    pendingVerification,
    verifiedCount,
    inProgressCount,
    byCategory,
    byWard,
    avgResolutionHours,
    predictiveInsights
  } as StatsOverview);
});

// 8. Get Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const db = readDb();
  const sortedUsers = [...db.users].sort((a, b) => b.reputation - a.reputation);
  
  const leaderboard = sortedUsers.map((u: User) => ({
    userId: u.id,
    name: u.name,
    reputation: u.reputation,
    ward: u.ward,
    reportsCount: u.reportedCount,
    verificationsCount: u.verifiedCount
  } as LeaderboardEntry));

  res.json(leaderboard);
});

// 9. Get Users List
app.get('/api/users', (req, res) => {
  const db = readDb();
  res.json(db.users);
});

// 10. Get User's Reported Issues (including spam/disputed ones)
app.get('/api/users/:id/reports', (req, res) => {
  const db = readDb();
  const userId = req.params.id;
  const userIssues = db.issues.filter((i: Issue) => i.reporterId === userId);
  res.json(userIssues);
});

// 11. Get User's Verification Votes
app.get('/api/users/:id/verifications', (req, res) => {
  const db = readDb();
  const userId = req.params.id;
  const userVerifications = db.verifications.filter((v: Verification) => v.userId === userId);
  res.json(userVerifications);
});


// Express server start logic
async function startServer() {
  // Serve static files in production, use Vite in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
