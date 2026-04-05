'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { lookupBoat, type Boat, type InspectionDecision } from '@/lib/mockData';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });
import BoatRecord from '@/components/BoatRecord';

type PageState = 'scanning' | 'found' | 'not-found';

export default function InspectPage() {
  const [pageState, setPageState] = useState<PageState>('scanning');
  const [boat, setBoat] = useState<Boat | null>(null);
  const [scannedId, setScannedId] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [scannerKey, setScannerKey] = useState(0);

  const handleScan = useCallback((raw: string) => {
    setScannedId(raw);
    const found = lookupBoat(raw);
    if (found) {
      setBoat(found);
      setPageState('found');
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

  function reset() {
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
    // TODO: replace with Supabase insert
    console.log('Inspection submitted:', { boatId: boat?.id, ...data });
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-[#1b3a2d] text-white shadow-lg">
        <div className="mx-auto max-w-lg px-4 py-0">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {/* Anchor icon */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="shrink-0">
                <circle cx="16" cy="16" r="15" fill="#2d5a3d" stroke="#6aaa7a" strokeWidth="1.5"/>
                <circle cx="16" cy="10" r="2.5" fill="none" stroke="#6aaa7a" strokeWidth="1.5"/>
                <line x1="16" y1="12.5" x2="16" y2="24" stroke="#6aaa7a" strokeWidth="1.5"/>
                <path d="M10 17h12" stroke="#6aaa7a" strokeWidth="1.5"/>
                <path d="M10 24c0-3 2.5-4 6-4s6 1 6 4" stroke="#6aaa7a" strokeWidth="1.5" fill="none"/>
              </svg>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-300">
                  Aquatic Invasive Species
                </p>
                <h1 className="text-base font-black uppercase tracking-wide">
                  VesselCheck
                </h1>
              </div>
            </div>
            {pageState !== 'scanning' && (
              <button
                onClick={reset}
                className="rounded border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-white/20 transition"
              >
                ← New Scan
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="bg-[#2d5a3d] px-4 py-1.5">
        <p className="mx-auto max-w-lg text-[10px] font-semibold uppercase tracking-[0.15em] text-green-200">
          Watercraft Inspection &amp; Decontamination Program
        </p>
      </div>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">

        {/* Scanner state */}
        {pageState === 'scanning' && (
          <>
            <div className="border-l-4 border-[#1b3a2d] bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 1</p>
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Scan Vessel Registration</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Point camera at the barcode or QR code on the registration decal.
              </p>
            </div>

            <BarcodeScanner key={scannerKey} onScan={handleScan} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-100 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
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
                placeholder="Registration No. (e.g. MN1234AB)"
                className="flex-1 rounded border border-slate-400 bg-white px-3 py-2 text-sm font-bold uppercase tracking-wide text-slate-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-[#1b3a2d] focus:outline-none"
              />
              <button
                onClick={handleManualLookup}
                disabled={!manualInput.trim()}
                className="rounded bg-[#1b3a2d] px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-[#2d5a3d] disabled:opacity-40 transition"
              >
                Look Up
              </button>
            </div>
          </>
        )}

        {/* Not found */}
        {pageState === 'not-found' && (
          <div className="border border-amber-500 bg-amber-50">
            <div className="bg-amber-500 px-4 py-2">
              <p className="text-xs font-black uppercase tracking-widest text-white">
                Warning — No Record Found
              </p>
            </div>
            <div className="px-4 py-4">
              <p className="font-bold text-slate-900">
                Vessel &ldquo;{scannedId}&rdquo; is not in the system.
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Conduct verbal inspection. Document findings manually. Do not allow launch without officer clearance.
              </p>
              <button
                onClick={reset}
                className="mt-4 rounded bg-[#1b3a2d] px-5 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-[#2d5a3d] transition"
              >
                Scan New Vessel
              </button>
            </div>
          </div>
        )}

        {/* Found */}
        {pageState === 'found' && boat && (
          <BoatRecord boat={boat} onNewInspection={handleNewInspection} />
        )}
      </div>
    </main>
  );
}
