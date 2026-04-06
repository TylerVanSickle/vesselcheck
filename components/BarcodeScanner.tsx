'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
}

type ScannerState = 'starting' | 'ready' | 'denied' | 'error';

const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.AZTEC,
];

// Container height in px — explicit so the overlay has a known size to anchor to
const CONTAINER_H = 380;

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [scannerState, setScannerState] = useState<ScannerState>('starting');
  const [errorMsg, setErrorMsg]         = useState('');
  const [torchOn, setTorchOn]           = useState(false);
  const [supportsTorch, setSupportsTorch] = useState(false);
  const [flash, setFlash]               = useState(false);
  const [lineY, setLineY]               = useState(0); // 0–100% within the scan zone
  const lineDir                         = useRef(1);
  const scannerRef                      = useRef<Html5Qrcode | null>(null);
  const containerId                     = 'qr-scanner-container';

  // Smooth JS-driven scan line
  useEffect(() => {
    if (scannerState !== 'ready') return;
    let raf: number;
    let last = performance.now();
    function tick(now: number) {
      const dt = now - last;
      last = now;
      setLineY((y) => {
        const next = y + lineDir.current * (dt * 0.055);
        if (next >= 100) { lineDir.current = -1; return 100; }
        if (next <= 0)   { lineDir.current =  1; return 0; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scannerState]);

  useEffect(() => {
    // Wipe any leftover DOM from a previous mount
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
    if (scannerRef.current?.isScanning) return;

    const scanner = new Html5Qrcode(containerId, {
      verbose: false,
      formatsToSupport: FORMATS,
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 20,
          videoConstraints: {
            facingMode: 'environment',
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        (decoded) => {
          navigator.vibrate?.(120);
          setFlash(true);
          setTimeout(() => setFlash(false), 400);
          onScan(decoded.trim());
        },
        () => {}
      )
      .then(() => {
        setScannerState('ready');
        try {
          const caps = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & { torch?: boolean };
          setSupportsTorch(!!caps.torch);
        } catch { /* torch not available */ }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        setScannerState(msg.toLowerCase().includes('permission') ? 'denied' : 'error');
        setErrorMsg(msg);
      });

    return () => {
      const video = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
      if (video) { video.pause(); video.srcObject = null; }
      if (scanner.isScanning) scanner.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleTorch() {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as MediaTrackConstraintSet],
      });
      setTorchOn((v) => !v);
    } catch { setSupportsTorch(false); }
  }

  if (scannerState === 'denied') {
    return (
      <div className="border border-red-400 bg-red-50 p-5">
        <p className="text-xs font-black uppercase tracking-widest text-red-700">Camera Access Denied</p>
        <p className="mt-1 text-sm text-red-600">Allow camera access in your browser settings and reload.</p>
      </div>
    );
  }
  if (scannerState === 'error') {
    return (
      <div className="border border-amber-400 bg-amber-50 p-5">
        <p className="text-xs font-black uppercase tracking-widest text-amber-700">Camera Unavailable</p>
        <p className="mt-1 text-sm text-amber-600">{errorMsg || 'Could not start camera. Use manual entry below.'}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden border border-slate-400 bg-black shadow-sm">

      {/* ── Camera + overlay ─────────────────────────────────────────────
          Explicit height is the key: the overlay uses absolute inset-0,
          which requires the parent to have a defined height to anchor to.
          The CSS in globals.css forces the library's divs and video to
          fill this container completely.
      ──────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full bg-black" style={{ height: CONTAINER_H }}>

        {/* html5-qrcode mounts its video inside here (CSS forces it to fill) */}
        <div id={containerId} className="absolute inset-0" />

        {/* ── Scan zone — box-shadow creates the surrounding vignette ──── */}
        {/* Positioned to cover 84% width and 50% height, centred */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: '8%', bottom: '8%',
            left: '8%', right: '8%',
            // box-shadow spreads outward from the zone edges, darkening
            // everything outside it in a single element — no strips needed
            boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)',
          }}
        >
          {/* Corner brackets */}
          <span className="absolute left-0  top-0    h-7 w-7 border-l-[3px] border-t-[3px] border-white" />
          <span className="absolute right-0 top-0    h-7 w-7 border-r-[3px] border-t-[3px] border-white" />
          <span className="absolute left-0  bottom-0 h-7 w-7 border-b-[3px] border-l-[3px] border-white" />
          <span className="absolute right-0 bottom-0 h-7 w-7 border-b-[3px] border-r-[3px] border-white" />

          {/* Animated sweep line */}
          {scannerState === 'ready' && (
            <div
              className="absolute left-2 right-2 h-0.5"
              style={{
                top: `${lineY}%`,
                background: 'linear-gradient(90deg, transparent, #4ade80 20%, #bbf7d0 50%, #4ade80 80%, transparent)',
                boxShadow: '0 0 8px 2px rgba(74,222,128,0.55)',
              }}
            />
          )}
        </div>

        {/* Instruction label — centred below the scan zone */}
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center">
          <span className="rounded bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {scannerState === 'starting'
              ? 'Starting camera…'
              : 'Align barcode or QR code within frame'}
          </span>
        </div>

        {/* Success flash */}
        {flash && <div className="flash-success pointer-events-none absolute inset-0 bg-green-400" />}
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${scannerState === 'ready' ? 'bg-green-400' : 'bg-yellow-400'}`}
            style={scannerState === 'ready' ? { boxShadow: '0 0 6px #4ade80' } : {}}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {scannerState === 'ready' ? 'Scanner Active' : 'Starting…'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">20 fps · HD</span>
          {supportsTorch && (
            <button
              onClick={toggleTorch}
              className={`rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest transition ${
                torchOn ? 'bg-yellow-400 text-yellow-950' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {torchOn ? '⚡ On' : '⚡ Flash'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
