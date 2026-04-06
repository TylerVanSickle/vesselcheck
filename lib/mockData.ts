export type DeconStatus = 'clean' | 'required' | 'unknown';
export type InspectionDecision = 'pass' | 'hold' | 'deny';
export type RiskLevel = 'critical' | 'high' | 'caution' | 'clear';

export interface Inspection {
  id: string;
  boatId: string;
  officerId: string;
  officerName: string;
  checkpointLocation: string;
  destinationWaterBody: string;
  decontaminationCompleted: boolean;
  decision: InspectionDecision;
  notes: string;
  timestamp: string;
}

export interface Boat {
  id: string;
  registrationNumber: string;
  ownerName: string;
  ownerPhone: string;
  make: string;
  model: string;
  year: number;
  lastWaterBody: string;
  lastLaunchDate: string;
  deconStatus: DeconStatus;
  deconDate: string | null;
  deconLocation: string | null;
  isStolen: boolean;
  inspections: Inspection[];
}

// Water bodies confirmed to have zebra mussels or other priority AIS
export const HIGH_RISK_WATER_BODIES = [
  'Lake Mille Lacs',
  'Prior Lake',
  'Rush Lake',
  'Lake Koronis',
  'Big Marine Lake',
  'Lake Minnetonka',
  'Lake Vermilion',
  'Pelican Lake',
  'Lake Sallie',
];

export function getRiskLevel(boat: Boat): RiskLevel {
  if (boat.isStolen) return 'critical';
  if (boat.deconStatus === 'required') return 'high';
  if (HIGH_RISK_WATER_BODIES.includes(boat.lastWaterBody) && boat.deconStatus !== 'clean') return 'high';
  if (boat.deconStatus === 'unknown') return 'caution';
  if (HIGH_RISK_WATER_BODIES.includes(boat.lastWaterBody)) return 'caution';
  return 'clear';
}

export function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatDaysAgo(dateStr: string): string {
  const days = daysSince(dateStr);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo. ago`;
  return `${Math.floor(days / 365)} yr. ago`;
}

// Mock boats — replace lookupBoat with a Supabase query later
export const MOCK_BOATS: Record<string, Boat> = {
  'MN1234AB': {
    id: 'MN1234AB',
    registrationNumber: 'MN1234AB',
    ownerName: 'Jason Walters',
    ownerPhone: '612-555-0142',
    make: 'Lund',
    model: 'Rebel 1600',
    year: 2019,
    lastWaterBody: 'Lake Mille Lacs',
    lastLaunchDate: '2025-09-14',
    deconStatus: 'required',
    deconDate: null,
    deconLocation: null,
    isStolen: false,
    inspections: [
      {
        id: 'insp-001',
        boatId: 'MN1234AB',
        officerId: 'OFF-42',
        officerName: 'Officer K. Paulson',
        checkpointLocation: 'Lake Minnetonka — Grays Bay Ramp',
        destinationWaterBody: 'Lake Minnetonka',
        decontaminationCompleted: false,
        decision: 'hold',
        notes: 'Came from Mille Lacs. Operator refused decon. Held at checkpoint.',
        timestamp: '2025-09-14T10:22:00Z',
      },
      {
        id: 'insp-002',
        boatId: 'MN1234AB',
        officerId: 'OFF-42',
        officerName: 'Officer K. Paulson',
        checkpointLocation: 'Lake Minnetonka — Grays Bay Ramp',
        destinationWaterBody: 'Lake Minnetonka',
        decontaminationCompleted: false,
        decision: 'deny',
        notes: 'Operator returned following day. Still refused decon. Denied launch.',
        timestamp: '2025-09-15T09:05:00Z',
      },
    ],
  },
  'MN5678CD': {
    id: 'MN5678CD',
    registrationNumber: 'MN5678CD',
    ownerName: 'Beth Larson',
    ownerPhone: '651-555-0198',
    make: 'Alumacraft',
    model: 'Competitor 165',
    year: 2021,
    lastWaterBody: 'Lake Superior',
    lastLaunchDate: '2025-10-01',
    deconStatus: 'clean',
    deconDate: '2025-10-01',
    deconLocation: 'Two Harbors Station',
    isStolen: false,
    inspections: [
      {
        id: 'insp-003',
        boatId: 'MN5678CD',
        officerId: 'OFF-17',
        officerName: 'Officer T. Berg',
        checkpointLocation: 'Two Harbors — Public Ramp',
        destinationWaterBody: 'Lake Superior',
        decontaminationCompleted: true,
        decision: 'pass',
        notes: '',
        timestamp: '2025-10-01T08:45:00Z',
      },
    ],
  },
  'MN9999XX': {
    id: 'MN9999XX',
    registrationNumber: 'MN9999XX',
    ownerName: 'Dale Morrison',
    ownerPhone: '763-555-0311',
    make: 'Ranger',
    model: 'RT188P',
    year: 2020,
    lastWaterBody: 'Unknown',
    lastLaunchDate: '2025-08-22',
    deconStatus: 'unknown',
    deconDate: null,
    deconLocation: null,
    isStolen: true,
    inspections: [],
  },
  'MN2222EF': {
    id: 'MN2222EF',
    registrationNumber: 'MN2222EF',
    ownerName: 'Carol Sandvik',
    ownerPhone: '507-555-0077',
    make: 'Crestliner',
    model: 'VT 17',
    year: 2022,
    lastWaterBody: 'Rainy Lake',
    lastLaunchDate: '2025-09-28',
    deconStatus: 'clean',
    deconDate: '2025-09-28',
    deconLocation: 'International Falls Station',
    isStolen: false,
    inspections: [
      {
        id: 'insp-004',
        boatId: 'MN2222EF',
        officerId: 'OFF-09',
        officerName: 'Officer R. Dahl',
        checkpointLocation: 'International Falls — Lake Ramp',
        destinationWaterBody: 'Rainy Lake',
        decontaminationCompleted: true,
        decision: 'pass',
        notes: 'Decon confirmed. Boat and trailer dry. Clear to launch.',
        timestamp: '2025-09-28T07:30:00Z',
      },
    ],
  },
  'MN3333GH': {
    id: 'MN3333GH',
    registrationNumber: 'MN3333GH',
    ownerName: 'Pete Ostrowski',
    ownerPhone: '218-555-0444',
    make: 'Tracker',
    model: 'Pro 170',
    year: 2016,
    lastWaterBody: 'Lake Minnetonka',
    lastLaunchDate: '2025-07-04',
    deconStatus: 'unknown',
    deconDate: null,
    deconLocation: null,
    isStolen: false,
    inspections: [],
  },
};

export function lookupBoat(id: string): Boat | null {
  // Normalize: uppercase, strip spaces/dashes/dots so real barcodes match
  const normalized = id.toUpperCase().replace(/[\s\-\.]/g, '');
  return MOCK_BOATS[normalized] ?? null;
}
