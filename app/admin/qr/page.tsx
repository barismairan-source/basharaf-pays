'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { BodyClass } from '@/components/BodyClass';

/**
 * QR generator for the public menu.
 *
 * Defaults to the current site's origin (so on Vercel it's automatically
 * the deployed URL). The admin can override the URL — useful if you want
 * the QR to point at a custom domain or a specific path.
 *
 * Renders to a <canvas> at high resolution so the downloaded PNG is crisp
 * when printed as a table tent.
 */
export default function QrPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');
  const [size, setSize] = useState(1024);
  const [ready, setReady] = useState(false);

  // Default the URL to this site's origin once mounted.
  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  const draw = useCallback(async () => {
    if (!canvasRef.current || !url) return;
    try {
      await QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: { dark: '#1c1917', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setReady(true);
    } catch {
      setReady(false);
    }
  }, [url, size]);

  useEffect(() => {
    void draw();
  }, [draw]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'safasiti-menu-qr.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <>
      <BodyClass className="is-admin" />
      <div dir="rtl" lang="fa" className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
          <header className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h1 className="text-2xl text-foreground">کد QR منو</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                برای چاپ و گذاشتن سر میز
              </p>
            </div>
            <a
              href="/admin"
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              بازگشت به پنل
            </a>
          </header>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm text-foreground">آدرس منو</span>
              <input
                type="text"
                dir="ltr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                placeholder="https://..."
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                به‌صورت پیش‌فرض آدرس همین سایت است. می‌توانی دامنهٔ دلخواه بگذاری.
              </span>
            </label>

            <label className="block">
              <span className="text-sm text-foreground">
                اندازهٔ تصویر: {size}px
              </span>
              <input
                type="range"
                min={512}
                max={2048}
                step={256}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="mt-2 block w-full"
              />
            </label>

            {/* QR preview — capped on screen, full-res in the canvas. */}
            <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-white p-6">
              <canvas
                ref={canvasRef}
                className="h-auto w-full max-w-[280px]"
                style={{ imageRendering: 'pixelated' }}
              />
              <button
                type="button"
                onClick={handleDownload}
                disabled={!ready}
                className="rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                دانلود PNG
              </button>
            </div>

            <div className="rounded-lg bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">راهنما</p>
              <p className="mt-1">
                این کد را دانلود کن، چاپ کن و روی میزها بگذار. مشتری با
                دوربین گوشی اسکن می‌کند و منو باز می‌شود — بدون نیاز به نصب
                هیچ اپلیکیشنی.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
