"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { Play, Camera, Square } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "ok" | "error";

type PhotoItem = {
  id: number;
  url: string;
  blob: Blob;
  createdAt: number;
  status: UploadStatus;
  error?: string | null;
};

export default function FoodExpiryPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const idCounterRef = useRef(1);

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // ===== Cámara =====
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
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      stopCamera();

      const ideal: MediaStreamConstraints = {
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(ideal);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => {});
      }
      setActive(true);

      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
        setPhotoUrl(null);
        setPhotoBlob(null);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        const item: PhotoItem = {
          id: idCounterRef.current++,
          url,
          blob,
          createdAt: Date.now(),
          status: "idle",
          error: null,
        };
        setPhotos((prev) => [item, ...prev]);
      },
      "image/jpeg",
      0.9
    );
  };

  const retake = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoBlob(null);
  };

  const deleteFromList = (id: number) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearAll = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
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
            <h2 className="text-3xl font-semibold">Food Expiry</h2>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6 ring-1 ring-black/5">
          {/* === Botones: mismas clases/tamaño que Alcohol Level === */}
          <div className="flex flex-row flex-wrap items-stretch gap-3">
            <button
              onClick={startCamera}
              disabled={loading}
              className="flex-1 rounded-2xl bg-sky-700 px-6 py-4 text-lg font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
              aria-label={loading ? "Opening…" : "Open"}
              title={loading ? "Opening…" : "Open"}
            >
              <span className="flex items-center justify-center gap-2">
                <Play className="h-5 w-5" aria-hidden="true" />
              </span>
            </button>

            <button
              onClick={capturePhoto}
              disabled={!active}
              className="flex-1 rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              aria-label="Capture"
              title="Capture"
            >
              <span className="flex items-center justify-center gap-2">
                <Camera className="h-5 w-5" aria-hidden="true" />
              </span>
            </button>

            <button
              onClick={stopCamera}
              disabled={!active}
              className="flex-1 rounded-2xl bg-rose-800 px-6 py-4 text-lg font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              aria-label="Stop"
              title="Stop"
            >
              <span className="flex items-center justify-center gap-2">
                <Square className="h-5 w-5" aria-hidden="true" />
              </span>
            </button>
          </div>

          {/* Video en vivo */}
          <div className="mt-6 rounded-xl border border-slate-700 bg-black/40 p-3">
            <video
              ref={videoRef}
              className="mx-auto aspect-video h-auto w-full max-w-3xl rounded-lg bg-black object-contain"
              muted
              playsInline
            />
          </div>

          <p className="mt-3 text-center text-sm text-slate-300">
            Note: on iOS/Safari, the camera can only start after a user gesture (click/tap).
          </p>
        </div>

        {/* Galería simple */}
        <section className="mt-8 rounded-2xl bg-slate-900 p-6 ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Captured photos
              <span className="ml-2 rounded bg-slate-700 px-2 py-0.5 text-sm">{photos.length}</span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                disabled={photos.length === 0}
                className="rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
          </div>

          {photos.length === 0 ? (
            <p className="text-slate-400">No photos captured yet.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {photos.map((p) => (
                <li key={p.id} className="rounded-xl border border-slate-700 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={`capture-${p.id}`}
                    className="h-48 w-full rounded-md object-cover"
                  />
                  <div className="mt-2 text-xs text-slate-300">
                    <div>{new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => deleteFromList(p.id)}
                      className="flex-1 rounded-md bg-rose-800 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
