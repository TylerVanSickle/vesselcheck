'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { lookupBoat, getRiskLevel, type Boat, type InspectionDecision } from '@/lib/mockData';
import BoatRecord from '@/components/BoatRecord';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

export interface OfficerSession {
  officerName: string;
  badgeNumber: string;
  checkpointLocation: string;
}

interface RecentScan {
  id: string;
  ownerName: string;
  vessel: string;
  riskLevel: ReturnType<typeof getRiskLevel>;
  scannedAt: Date;
}

type PageState = 'setup' | 'scanning' | 'found' | 'not-found';

const RISK_COLOR: Record<ReturnType<typeof getRiskLevel>, string> = {
  critical: 'bg-red-700 text-white',
  high:     'bg-amber-600 text-white',
  caution:  'bg-yellow-400 text-yellow-950',
  clear:    'bg-green-700 text-white',
};

export default function InspectPage() {
  const [pageState, setPageState] = useState<PageState>('setup');
  const [boat, setBoat] = useState<Boat | null>(null);
  const [scannedId, setScannedId] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [scannerKey, setScannerKey] = useState(0);
  const [session, setSession] = useState<OfficerSession | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [now, setNow] = useState<Date | null>(null);

  // Live clock — null until after mount to avoid SSR/client mismatch
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persist session to localStorage
  useEffect(() => {
    const stored = localStorage.getItem('vesselcheck-session');
    if (stored) {
      try {
        setSession(JSON.parse(stored));
        setPageState('scanning');
      } catch {
        localStorage.removeItem('vesselcheck-session');
      }
    }
  }, []);

  const handleScan = useCallback((raw: string) => {
    setScannedId(raw);
    const found = lookupBoat(raw);
    if (found) {
      setBoat(found);
      setPageState('found');
      setRecentScans((prev) => {
        const entry: RecentScan = {
          id: found.id,
          ownerName: found.ownerName,
          vessel: `${found.year} ${found.make} ${found.model}`,
          riskLevel: getRiskLevel(found),
          scannedAt: new Date(),
        };
        return [entry, ...prev.filter((s) => s.id !== found.id)].slice(0, 5);
      });
    } else {
      setBoat(null);
      setPageState('not-found');
    }
  }, []);

  function handleManualLookup() {
    const id = manualInput.trim();
    if (!id) return;
    handleScan(id);
  }

  function resetToScanner() {
    setBoat(null);
    setScannedId('');
    setManualInput('');
    setPageState('scanning');
    setScannerKey((k) => k + 1);
  }

  function handleNewInspection(data: {
    destination: string;
    deconCompleted: boolean;
    decision: InspectionDecision;
    notes: string;
  }) {
    // TODO: Supabase insert
    console.log('Inspection submitted:', { boatId: boat?.id, officer: session, ...data });
  }

  function saveSession(form: OfficerSession) {
    localStorage.setItem('vesselcheck-session', JSON.stringify(form));
    setSession(form);
    setPageState('scanning');
  }

  function clearSession() {
    localStorage.removeItem('vesselcheck-session');
    setSession(null);
    setPageState('setup');
    resetToScanner();
  }

  const timeStr = now?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '';
  const dateStr = now?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) ?? '';

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-[#1b3a2d] text-white shadow-lg">
        <div className="mx-auto max-w-lg px-4">
          {/* Top strip: date/time */}
          <div className="flex items-center justify-between border-b border-white/10 py-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-300">{dateStr}</p>
            <p className="font-mono text-[11px] font-bold text-green-300">{timeStr}</p>
          </div>
          {/* Main row */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" className="shrink-0">
                <circle cx="16" cy="16" r="15" fill="#2d5a3d" stroke="#6aaa7a" strokeWidth="1.5"/>
                <circle cx="16" cy="10" r="2.5" fill="none" stroke="#6aaa7a" strokeWidth="1.5"/>
                <line x1="16" y1="12.5" x2="16" y2="24" stroke="#6aaa7a" strokeWidth="1.5"/>
                <path d="M10 17h12" stroke="#6aaa7a" strokeWidth="1.5"/>
                <path d="M10 24c0-3 2.5-4 6-4s6 1 6 4" stroke="#6aaa7a" strokeWidth="1.5" fill="none"/>
              </svg>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">Aquatic Invasive Species</p>
                <h1 className="text-base font-black uppercase tracking-wide">VesselCheck</h1>
              </div>
            </div>
            {pageState === 'found' || pageState === 'not-found' ? (
              <button
                onClick={resetToScanner}
                className="rounded border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest hover:bg-white/20 transition"
              >
                ← Scan
              </button>
            ) : session ? (
              <button
                onClick={clearSession}
                className="rounded border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-300 hover:bg-white/10 transition"
              >
                End Session
              </button>
            ) : null}
          </div>
          {/* Officer strip */}
          {session && (
            <div className="border-t border-white/10 py-2">
              <p className="text-[10px] text-green-200">
                <span className="font-black uppercase tracking-widest">Officer:</span>{' '}
                {session.officerName}
                {session.badgeNumber && <span className="ml-2 text-green-400">#{session.badgeNumber}</span>}
                <span className="mx-2 text-white/30">|</span>
                <span className="font-black uppercase tracking-widest">Checkpoint:</span>{' '}
                {session.checkpointLocation}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Sub-strip */}
      <div className="bg-[#2d5a3d] px-4 py-1">
        <p className="mx-auto max-w-lg text-[9px] font-bold uppercase tracking-[0.2em] text-green-300">
          Watercraft Inspection &amp; Decontamination Program
        </p>
      </div>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">

        {/* ── SETUP ── */}
        {pageState === 'setup' && (
          <SetupForm onSave={saveSession} />
        )}

        {/* ── SCANNING ── */}
        {pageState === 'scanning' && (
          <>
            <div className="border-l-4 border-[#1b3a2d] bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 1 of 2</p>
              <p className="mt-0.5 text-sm font-black uppercase tracking-wide text-slate-900">Scan Vessel Registration</p>
              <p className="text-xs text-slate-500">Aim camera at the barcode or QR code on the registration decal.</p>
            </div>

            <BarcodeScanner key={scannerKey} onScan={handleScan} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-100 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Manual Entry
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                placeholder="Registration No. — e.g. MN1234AB"
                className="flex-1 border border-slate-400 bg-white px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#1b3a2d] focus:outline-none"
              />
              <button
                onClick={handleManualLookup}
                disabled={!manualInput.trim()}
                className="bg-[#1b3a2d] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:bg-[#2d5a3d] disabled:opacity-40 transition"
              >
                Look Up
              </button>
            </div>

            {/* Recent scans this session */}
            {recentScans.length > 0 && (
              <div className="border border-slate-300 bg-white shadow-sm">
                <div className="bg-slate-700 px-4 py-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Recent — This Session</p>
                </div>
                {recentScans.map((scan) => (
                  <button
                    key={scan.id}
                    onClick={() => handleScan(scan.id)}
                    className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 transition"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900">{scan.id}</p>
                      <p className="text-xs text-slate-500">{scan.ownerName} — {scan.vessel}</p>
                    </div>
                    <span className={`rounded-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${RISK_COLOR[scan.riskLevel]}`}>
                      {scan.riskLevel}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── NOT FOUND ── */}
        {pageState === 'not-found' && (
          <div className="border border-amber-500 bg-white shadow-sm">
            <div className="bg-amber-500 px-4 py-2">
              <p className="text-xs font-black uppercase tracking-widest text-white">No Record Found</p>
            </div>
            <div className="px-4 py-4 space-y-2">
              <p className="font-black text-slate-900">Vessel &ldquo;{scannedId}&rdquo; is not in the system.</p>
              <p className="text-sm text-slate-700">
                Conduct a full verbal inspection. Do not allow launch without officer clearance. Document findings manually.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetToScanner}
                  className="bg-[#1b3a2d] px-5 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-[#2d5a3d] transition"
                >
                  ← Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FOUND ── */}
        {pageState === 'found' && boat && (
          <BoatRecord boat={boat} session={session} onNewInspection={handleNewInspection} />
        )}
      </div>
    </main>
  );
}

// ── Session setup form ──────────────────────────────────────────────────────

function SetupForm({ onSave }: { onSave: (s: OfficerSession) => void }) {
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('');
  const [location, setLocation] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    onSave({ officerName: name.trim(), badgeNumber: badge.trim(), checkpointLocation: location.trim() });
  }

  return (
    <div className="border border-slate-300 bg-white shadow-sm">
      <div className="bg-slate-700 px-4 py-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Start Inspection Session</p>
      </div>
      <form onSubmit={submit} className="px-4 py-5 space-y-4">
        <p className="text-xs text-slate-600">Enter your information before beginning inspections. This will be attached to all records submitted during this session.</p>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Officer Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First Last"
            className="w-full border border-slate-400 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#1b3a2d] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Badge / ID Number
          </label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Optional"
            className="w-full border border-slate-400 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#1b3a2d] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Checkpoint Location <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Lake Minnetonka — Grays Bay Ramp"
            className="w-full border border-slate-400 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#1b3a2d] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !location.trim()}
          className="w-full bg-[#1b3a2d] py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#2d5a3d] disabled:opacity-40 transition"
        >
          Begin Session →
        </button>
      </form>
    </div>
  );
}
