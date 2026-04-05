'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export default function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-scanner-container';
  const [isStarted, setIsStarted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' }, // rear camera
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decodedText) => {
          onScan(decodedText.trim());
        },
        () => {
          // ignore per-frame decode errors
        }
      )
      .then(() => setIsStarted(true))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('permission')) {
          setPermissionDenied(true);
        }
        onError?.(msg);
      });

    return () => {
      scanner.isScanning &&
        scanner.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (permissionDenied) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-center text-sm text-red-700">
        Camera access was denied. Please allow camera permissions and reload.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        id={containerId}
        className="overflow-hidden rounded-xl border-2 border-dashed border-blue-400 bg-black"
        style={{ minHeight: 220 }}
      />
      {!isStarted && (
        <p className="mt-2 text-center text-sm text-gray-500">Starting camera…</p>
      )}
    </div>
  );
}
