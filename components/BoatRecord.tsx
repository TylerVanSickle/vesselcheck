'use client';

import { useState } from 'react';
import type { Boat, InspectionDecision } from '@/lib/mockData';

interface BoatRecordProps {
  boat: Boat;
  onNewInspection: (data: {
    destination: string;
    deconCompleted: boolean;
    decision: InspectionDecision;
    notes: string;
  }) => void;
}

const deconBadge: Record<string, { label: string; barClass: string; textClass: string }> = {
  clean:    { label: 'DECONTAMINATED',  barClass: 'bg-green-700',  textClass: 'text-green-800' },
  required: { label: 'DECON REQUIRED',  barClass: 'bg-amber-600',  textClass: 'text-amber-800' },
  unknown:  { label: 'STATUS UNKNOWN',  barClass: 'bg-slate-500',  textClass: 'text-slate-700' },
};

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border-b border-slate-200 py-2.5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-black ${highlight ? 'text-blue-900' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-slate-700 px-4 py-1.5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">{title}</p>
    </div>
  );
}

export default function BoatRecord({ boat, onNewInspection }: BoatRecordProps) {
  const [destination, setDestination] = useState('');
  const [deconCompleted, setDeconCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit(decision: InspectionDecision) {
    if (!destination.trim()) return;
    onNewInspection({ destination: destination.trim(), deconCompleted, decision, notes });
    setSubmitted(true);
  }

  const badge = deconBadge[boat.deconStatus];
  const lastInspection = boat.inspections.at(-1);

  return (
    <div className="space-y-4">

      {/* Stolen alert — full-width red bar */}
      {boat.isStolen && (
        <div className="border-2 border-red-700 bg-red-700">
          <div className="flex items-center gap-3 px-4 py-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path d="M10 2L2 17h16L10 2zm0 3l5.5 10H4.5L10 5zm-1 4v3h2V9H9zm0 4v2h2v-2H9z"/>
            </svg>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Stolen Vessel — Do Not Launch</p>
              <p className="text-xs text-red-200">Detain owner. Contact law enforcement immediately. Do not allow water access.</p>
            </div>
          </div>
        </div>
      )}

      {/* Decon status strip */}
      <div className={`${badge.barClass} px-4 py-2`}>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white">{badge.label}</p>
      </div>

      {/* Vessel identification */}
      <div className="border border-slate-300 bg-white shadow-sm">
        <SectionHeader title="Vessel Identification" />
        <div className="px-4">
          <Field label="Registration Number" value={boat.registrationNumber} />
          <Field label="Vessel" value={`${boat.year} ${boat.make} ${boat.model}`} />
        </div>
      </div>

      {/* Owner info */}
      <div className="border border-slate-300 bg-white shadow-sm">
        <SectionHeader title="Registered Owner" />
        <div className="px-4">
          <Field label="Name" value={boat.ownerName} />
          <Field label="Phone" value={boat.ownerPhone} />
        </div>
      </div>

      {/* Water body history */}
      <div className="border border-slate-300 bg-white shadow-sm">
        <SectionHeader title="Water Body History" />
        <div className="px-4">
          <Field label="Last Water Body" value={boat.lastWaterBody} highlight />
          <Field label="Last Launch Date" value={new Date(boat.lastLaunchDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          {boat.deconDate && (
            <Field label="Last Decon Date" value={new Date(boat.deconDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          )}
          {boat.deconLocation && (
            <Field label="Decon Location" value={boat.deconLocation} />
          )}
        </div>
      </div>

      {/* Prior inspection */}
      {lastInspection && (
        <div className="border border-slate-300 bg-white shadow-sm">
          <SectionHeader title="Most Recent Inspection Record" />
          <div className="px-4">
            <Field label="Date / Time" value={new Date(lastInspection.timestamp).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })} />
            <Field label="Location" value={lastInspection.location} />
            <Field label="Inspecting Officer" value={lastInspection.officerName} />
            <Field label="Outcome" value={lastInspection.decision.toUpperCase()} />
            {lastInspection.notes && (
              <Field label="Officer Notes" value={lastInspection.notes} />
            )}
          </div>
        </div>
      )}

      {/* Inspection form */}
      {submitted ? (
        <div className="border border-green-700 bg-green-700">
          <div className="px-4 py-4 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-white">Inspection Record Submitted</p>
            <p className="mt-1 text-xs text-green-200">Entry has been logged successfully.</p>
          </div>
        </div>
      ) : (
        <div className="border border-slate-300 bg-white shadow-sm">
          <SectionHeader title="New Inspection Entry" />
          <div className="px-4 py-4 space-y-4">

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Destination Water Body <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter water body name"
                className="w-full border border-slate-400 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#1b3a2d] focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deconCompleted}
                onChange={(e) => setDeconCompleted(e.target.checked)}
                className="mt-0.5 h-4 w-4 border-slate-400 accent-[#1b3a2d]"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">Decontamination completed at this checkpoint</p>
                <p className="text-xs text-slate-500">Check only if decon was performed and verified by officer</p>
              </div>
            </label>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Officer Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observations, concerns, or additional details…"
                className="w-full border border-slate-400 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1b3a2d] focus:outline-none"
              />
            </div>

            {/* Decision buttons */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                Inspection Outcome <span className="text-red-600">*</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => submit('pass')}
                  disabled={!destination.trim()}
                  className="rounded-sm bg-green-700 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  Pass
                </button>
                <button
                  onClick={() => submit('hold')}
                  disabled={!destination.trim()}
                  className="rounded-sm bg-amber-600 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  Hold
                </button>
                <button
                  onClick={() => submit('deny')}
                  disabled={!destination.trim()}
                  className="rounded-sm bg-red-700 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40 transition"
                >
                  Deny
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
