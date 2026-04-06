'use client';

import { useState } from 'react';
import {
  getRiskLevel,
  formatDaysAgo,
  HIGH_RISK_WATER_BODIES,
  type Boat,
  type InspectionDecision,
  type RiskLevel,
} from '@/lib/mockData';
import type { OfficerSession } from '@/app/inspect/page';

interface BoatRecordProps {
  boat: Boat;
  session: OfficerSession | null;
  onNewInspection: (data: {
    destination: string;
    deconCompleted: boolean;
    decision: InspectionDecision;
    notes: string;
  }) => void;
}

// ── Risk configuration ──────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, {
  barClass: string;
  label: string;
  directive: string;
  textClass: string;
  subTextClass: string;
}> = {
  critical: {
    barClass: 'bg-red-700',
    label: 'CRITICAL — STOLEN VESSEL',
    directive: 'DO NOT ALLOW LAUNCH. Detain owner and contact law enforcement immediately.',
    textClass: 'text-white',
    subTextClass: 'text-red-200',
  },
  high: {
    barClass: 'bg-amber-600',
    label: 'HIGH RISK — ACTION REQUIRED',
    directive: 'Decontamination required before launch is permitted.',
    textClass: 'text-white',
    subTextClass: 'text-amber-100',
  },
  caution: {
    barClass: 'bg-yellow-400',
    label: 'CAUTION — STATUS UNVERIFIED',
    directive: 'Decontamination history unknown. Verify with operator before proceeding.',
    textClass: 'text-yellow-950',
    subTextClass: 'text-yellow-900',
  },
  clear: {
    barClass: 'bg-green-700',
    label: 'CLEAR — APPROVED TO LAUNCH',
    directive: 'Decontamination verified. Vessel may proceed.',
    textClass: 'text-white',
    subTextClass: 'text-green-200',
  },
};

const DECISION_STYLES: Record<InspectionDecision, string> = {
  pass: 'bg-green-700 hover:bg-green-800',
  hold: 'bg-amber-600 hover:bg-amber-700',
  deny: 'bg-red-700 hover:bg-red-800',
};

const DECISION_LABELS: Record<InspectionDecision, string> = {
  pass: 'Pass — Allow Launch',
  hold: 'Hold — Detain Vessel',
  deny: 'Deny — Refuse Entry',
};

// ── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-slate-700 px-4 py-1.5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">{title}</p>
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-b border-slate-100 py-2.5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-black ${accent ? 'text-blue-800' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: InspectionDecision }) {
  const colors = {
    pass: 'bg-green-100 text-green-800',
    hold: 'bg-amber-100 text-amber-800',
    deny: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${colors[decision]}`}>
      {decision}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function BoatRecord({ boat, session, onNewInspection }: BoatRecordProps) {
  const [destination, setDestination] = useState('');
  const [deconCompleted, setDeconCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const riskLevel = getRiskLevel(boat);
  const risk = RISK_CONFIG[riskLevel];
  const isHighRiskWater = HIGH_RISK_WATER_BODIES.includes(boat.lastWaterBody);
  const lastInspection = boat.inspections.at(-1);
  const historyToShow = showAllHistory ? boat.inspections : boat.inspections.slice(-3);

  function submit(decision: InspectionDecision) {
    if (!destination.trim()) return;
    onNewInspection({ destination: destination.trim(), deconCompleted, decision, notes });
    setSubmitted(true);
  }

  // On critical (stolen), disable pass and hold
  const disabledDecisions: InspectionDecision[] =
    riskLevel === 'critical' ? ['pass', 'hold'] : [];

  return (
    <div className="space-y-4">

      {/* ── Risk Banner ────────────────────────────────────────────────── */}
      <div className={`${risk.barClass} px-4 py-4`}>
        <p className={`text-sm font-black uppercase tracking-widest ${risk.textClass}`}>{risk.label}</p>
        <p className={`mt-1 text-xs font-bold ${risk.subTextClass}`}>{risk.directive}</p>
      </div>

      {/* ── Quick Stats Strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 border border-slate-300 bg-white shadow-sm">
        <div className="px-3 py-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Last Water Body</p>
          <p className={`mt-1 text-xs font-black leading-tight ${isHighRiskWater ? 'text-red-700' : 'text-slate-900'}`}>
            {boat.lastWaterBody}
          </p>
          {isHighRiskWater && (
            <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-red-600">AIS Confirmed</p>
          )}
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Last Launch</p>
          <p className="mt-1 text-xs font-black text-slate-900">{formatDaysAgo(boat.lastLaunchDate)}</p>
          <p className="mt-0.5 text-[9px] text-slate-400">
            {new Date(boat.lastLaunchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Inspections</p>
          <p className="mt-1 text-xs font-black text-slate-900">{boat.inspections.length} on record</p>
          {lastInspection && (
            <p className="mt-0.5 text-[9px] text-slate-400">Last: <DecisionBadge decision={lastInspection.decision} /></p>
          )}
        </div>
      </div>

      {/* ── Vessel + Owner ─────────────────────────────────────────────── */}
      <div className="border border-slate-300 bg-white shadow-sm">
        <SectionHeader title="Vessel Identification" />
        <div className="grid grid-cols-2 px-4">
          <div className="border-b border-slate-100 py-2.5 border-r pr-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Registration</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{boat.registrationNumber}</p>
          </div>
          <div className="border-b border-slate-100 py-2.5 pl-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Year</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{boat.year}</p>
          </div>
          <div className="py-2.5 border-r pr-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Make</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{boat.make}</p>
          </div>
          <div className="py-2.5 pl-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Model</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{boat.model}</p>
          </div>
        </div>
        <div className="border-t border-slate-200 px-4">
          <Field label="Registered Owner" value={boat.ownerName} />
          <Field label="Owner Phone" value={boat.ownerPhone} />
        </div>
      </div>

      {/* ── Water Body & Decon History ─────────────────────────────────── */}
      <div className="border border-slate-300 bg-white shadow-sm">
        <SectionHeader title="Water Body &amp; Decontamination History" />
        <div className="px-4">
          <Field
            label="Last Known Water Body"
            value={boat.lastWaterBody + (isHighRiskWater ? ' ⚠ AIS Confirmed Site' : '')}
            accent={isHighRiskWater}
          />
          <Field
            label="Last Launch Date"
            value={`${new Date(boat.lastLaunchDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${formatDaysAgo(boat.lastLaunchDate)})`}
          />
          <Field
            label="Decontamination Status"
            value={
              boat.deconStatus === 'clean' ? 'Verified — Decontaminated' :
              boat.deconStatus === 'required' ? 'Required — Not Completed' :
              'Unknown — Not on Record'
            }
          />
          {boat.deconDate && (
            <Field
              label="Last Decon Date"
              value={`${new Date(boat.deconDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (${formatDaysAgo(boat.deconDate)})`}
            />
          )}
          {boat.deconLocation && (
            <Field label="Decon Location" value={boat.deconLocation} />
          )}
        </div>
      </div>

      {/* ── Inspection History ─────────────────────────────────────────── */}
      {boat.inspections.length > 0 ? (
        <div className="border border-slate-300 bg-white shadow-sm">
          <SectionHeader title={`Inspection History (${boat.inspections.length} record${boat.inspections.length !== 1 ? 's' : ''})`} />
          <div className="divide-y divide-slate-100">
            {historyToShow.slice().reverse().map((insp) => (
              <div key={insp.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      {new Date(insp.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      <span className="ml-2 font-bold text-slate-400">
                        {new Date(insp.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600">{insp.checkpointLocation}</p>
                    <p className="text-[11px] text-slate-500">
                      {insp.officerName}
                      {insp.officerId && <span className="text-slate-400"> · #{insp.officerId}</span>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Destination: <span className="font-bold text-slate-700">{insp.destinationWaterBody}</span>
                    </p>
                    {insp.notes && (
                      <p className="mt-1 text-[11px] italic text-slate-500">&ldquo;{insp.notes}&rdquo;</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <DecisionBadge decision={insp.decision} />
                    {insp.decontaminationCompleted && (
                      <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-green-700">Decon ✓</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {boat.inspections.length > 3 && (
            <button
              onClick={() => setShowAllHistory((v) => !v)}
              className="w-full border-t border-slate-200 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition"
            >
              {showAllHistory ? '▲ Show Less' : `▼ Show All ${boat.inspections.length} Records`}
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-300 bg-white px-4 py-3 shadow-sm">
          <SectionHeader title="Inspection History" />
          <p className="px-4 py-3 text-xs text-slate-500 italic">No prior inspection records found for this vessel.</p>
        </div>
      )}

      {/* ── New Inspection Form ────────────────────────────────────────── */}
      {submitted ? (
        <div className="border border-green-700 bg-green-700 px-4 py-5 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-widest text-white">Inspection Record Submitted</p>
          <p className="mt-1 text-xs text-green-200">Entry logged. Vessel record updated.</p>
        </div>
      ) : (
        <div className="border border-slate-300 bg-white shadow-sm">
          <SectionHeader title="New Inspection Entry" />
          <div className="px-4 py-4 space-y-4">

            {/* Officer info (pre-filled from session) */}
            {session && (
              <div className="bg-slate-50 border border-slate-200 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Submitting Officer</p>
                <p className="mt-0.5 text-xs font-black text-slate-900">
                  {session.officerName}
                  {session.badgeNumber && <span className="ml-2 text-slate-500">#{session.badgeNumber}</span>}
                  <span className="mx-2 text-slate-300">·</span>
                  {session.checkpointLocation}
                </p>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Destination Water Body <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter water body name"
                className="w-full border border-slate-400 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#1b3a2d] focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deconCompleted}
                onChange={(e) => setDeconCompleted(e.target.checked)}
                className="mt-0.5 h-4 w-4 border-slate-400 accent-[#1b3a2d] shrink-0"
              />
              <div>
                <p className="text-sm font-black text-slate-900">Decontamination completed at this checkpoint</p>
                <p className="text-xs text-slate-500">Check only if decon was performed and personally verified</p>
              </div>
            </label>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Officer Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observations, compliance issues, or additional details…"
                className="w-full border border-slate-400 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1b3a2d] focus:outline-none resize-none"
              />
            </div>

            {/* Decision buttons */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Inspection Outcome <span className="text-red-600">*</span>
              </p>
              {!destination.trim() && (
                <p className="mb-2 text-[10px] text-slate-400 italic">Enter destination water body to enable outcome selection.</p>
              )}
              <div className="flex flex-col gap-2">
                {(['pass', 'hold', 'deny'] as InspectionDecision[]).map((d) => {
                  const isDisabled = !destination.trim() || disabledDecisions.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => submit(d)}
                      disabled={isDisabled}
                      title={disabledDecisions.includes(d) ? 'Not permitted for stolen vessels' : undefined}
                      className={`w-full py-3 text-xs font-black uppercase tracking-widest text-white transition disabled:cursor-not-allowed disabled:opacity-30 ${DECISION_STYLES[d]}`}
                    >
                      {DECISION_LABELS[d]}
                    </button>
                  );
                })}
              </div>
              {riskLevel === 'critical' && (
                <p className="mt-2 text-[10px] text-red-600 font-bold">
                  Pass and Hold are disabled for stolen vessels. Only Deny is permitted.
                </p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
