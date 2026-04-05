export type DeconStatus = 'clean' | 'required' | 'unknown';
export type InspectionDecision = 'pass' | 'hold' | 'deny';

export interface Inspection {
  id: string;
  boatId: string;
  officerId: string;
  officerName: string;
  location: string;
  destinationWaterBody: string;
  decontaminationCompleted: boolean;
  decision: InspectionDecision;
  notes: string;
  timestamp: string;
}

export interface Boat {
  id: string; // hull ID / registration number (what's on the barcode)
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

// Mock data — replace with Supabase queries later
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
        location: 'Lake Minnetonka Boat Ramp',
        destinationWaterBody: 'Lake Minnetonka',
        decontaminationCompleted: false,
        decision: 'hold',
        notes: 'Came from Mille Lacs — decon required before launch.',
        timestamp: '2025-09-14T10:22:00Z',
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
    deconLocation: 'Two Harbors DNR Station',
    isStolen: false,
    inspections: [
      {
        id: 'insp-002',
        boatId: 'MN5678CD',
        officerId: 'OFF-17',
        officerName: 'Officer T. Berg',
        location: 'Two Harbors Ramp',
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
};

export function lookupBoat(id: string): Boat | null {
  return MOCK_BOATS[id.toUpperCase()] ?? null;
}
