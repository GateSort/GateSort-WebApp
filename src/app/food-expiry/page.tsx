"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";

type Facing = "environment" | "user";

export default function AlcoholLevelPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<Facing>("environment");

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async (mode: Facing = facingMode) => {
    try {
      setLoading(true);
      setError(null);
      stopCamera();

      // Strict attempt
      const strictConstraints: MediaStreamConstraints = {
        video: { facingMode: { exact: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      // Fallback attempt
      const idealConstraints: MediaStreamConstraints = {
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(strictConstraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
      }

      // If we asked for rear but got front, try choosing a "back/rear/environment" device explicitly
      if (mode === "environment" && stream) {
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        if (settings.facingMode !== "environment" && navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const candidates = devices.filter(
              (d) => d.kind === "videoinput" && /back|rear|environment/i.test(d.label || "")
            );
            if (candidates.length) {
              stream.getTracks().forEach((t) => t.stop());
              const alt = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: candidates[0].deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
              });
              stream = alt;
            }
          } catch {
            // Ignore if labels are not available yet or enumeration fails
          }
        }
      }

      streamRef.current = stream!;
      if (videoRef.current) {
        videoRef.current.srcObject = stream!;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => {});
      }
      setActive(true);
      setFacingMode(mode);

      // Reset previous photo
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
        setPhotoUrl(null);
        setPhotoBlob(null);
      }
    } catch (e: any) {
      const msg =
        e?.name === "NotAllowedError"
          ? "Permission denied. Please allow camera access."
          : e?.name === "NotFoundError"
          ? "No camera found."
          : "Failed to start the camera.";
      setError(`${msg}${e?.message ? ` (${e.message})` : ""}`);
      stopCamera();
    } finally {
      setLoading(false);
    }
  };

  const flipCamera = () => {
    const next: Facing = facingMode === "environment" ? "user" : "environment";
    startCamera(next);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
        setPhotoBlob(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  const downloadPhoto = () => {
    if (!photoBlob || !photoUrl) return;
    const a = document.createElement("a");
    a.href = photoUrl;
    a.download = `capture-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const retake = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoBlob(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700">
            ←
          </Link>
          <div>
            <h2 className="text-3xl font-semibold">Alcohol Level Detection</h2>
            <p className="text-slate-300">Rear camera with capture</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6 ring-1 ring-black/5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => startCamera("environment")}
              disabled={loading}
              className="flex-1 rounded-2xl bg-sky-700 px-6 py-4 text-lg font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
            >
              {loading ? "Opening…" : active ? "Restart (rear)" : "Open (rear)"}
            </button>

            <button
              onClick={flipCamera}
              disabled={!active}
              className="flex-1 rounded-2xl bg-slate-700 px-6 py-4 text-lg font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
            >
              Flip ({facingMode === "environment" ? "to front" : "to rear"})
            </button>

            <button
              onClick={capturePhoto}
              disabled={!active}
              className="flex-1 rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              Capture
            </button>

            <button
              onClick={stopCamera}
              disabled={!active}
              className="flex-1 rounded-2xl bg-rose-800 px-6 py-4 text-lg font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              Stop
            </button>
          </div>

          {/* Live video */}
          <div className="mt-6 rounded-xl border border-slate-700 bg-black/40 p-3">
            <video
              ref={videoRef}
              className="mx-auto aspect-video h-auto w-full max-w-3xl rounded-lg bg-black object-contain"
              muted
              playsInline
            />
          </div>

          {/* Captured photo preview */}
          {photoUrl && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-slate-300">Captured photo:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="capture"
                className="mx-auto max-h-96 w-auto rounded-xl border border-slate-700 object-contain"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={downloadPhoto}
                  className="flex-1 rounded-xl bg-slate-700 px-4 py-3 font-semibold text-white hover:bg-slate-600"
                >
                  Download
                </button>
                <button
                  onClick={retake}
                  className="flex-1 rounded-xl bg-slate-700 px-4 py-3 font-semibold text-white hover:bg-slate-600"
                >
                  Retake
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-rose-900/40 p-3 text-rose-200 ring-1 ring-rose-900/60">
              {error}
            </div>
          )}

          <p className="mt-3 text-center text-sm text-slate-300">
            Note: on iOS/Safari, the camera can only start after a user gesture (click/tap).
          </p>
        </div>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6 ring-1 ring-black/5">
          <h3 className="text-xl font-semibold">How to Use</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-300">
            <li>Click <strong>Open (rear)</strong> to start the rear camera.</li>
            <li>Use <strong>Capture</strong> to take a photo.</li>
            <li>Use <strong>Download</strong> or <strong>Retake</strong> as needed.</li>
          </ol>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
