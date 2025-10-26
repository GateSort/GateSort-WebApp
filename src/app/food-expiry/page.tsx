"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { Play, Camera, Square } from "lucide-react"; // ← ICONOS

type Facing = "environment" | "user";
type UploadStatus = "idle" | "uploading" | "ok" | "error";

type PhotoItem = {
  id: number;
  url: string;       // Object URL for preview
  blob: Blob;        // Image data
  createdAt: number;
  status: UploadStatus;
  error?: string | null;
  // Analysis results
  expired?: {
    total: number;
    details: Array<{
      shape: string;
      color: string;
      count: number;
    }>;
  };
  not_expired?: {
    total: number;
    details: Array<{
      shape: string;
      color: string;
      count: number;
    }>;
  };
};

/* =========================================================
   AEROLÍNEAS (SOLO NOMBRES) + helpers de búsqueda
   ========================================================= */
const AIRLINES: string[] = [
  "Aeroméxico",
  "Volaris",
  "Viva Aerobus",
  "American Airlines",
];

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const nText = normalize(text);
  const nQuery = normalize(query);
  const idx = nText.indexOf(nQuery);
  if (idx < 0) return text;

  let alnumCount = 0;
  let startOrig = 0;
  let endOrig = text.length;
  const start = idx;
  const end = idx + nQuery.length;

  for (let i = 0; i < text.length; i++) {
    if (/[a-z0-9]/i.test(text[i])) {
      if (alnumCount === start) startOrig = i;
      if (alnumCount === end) {
        endOrig = i;
        break;
      }
      alnumCount++;
    }
  }
  if (endOrig === text.length && alnumCount === end) endOrig = text.length;

  return (
    <>
      {text.slice(0, startOrig)}
      <span className="bg-yellow-300/30 rounded px-0.5">{text.slice(startOrig, endOrig)}</span>
      {text.slice(endOrig)}
    </>
  );
}

// ======================== Componente ========================

export default function AlcoholLevelPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const idCounterRef = useRef(1);

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<Facing>("environment");

  // Aspect ratio real del stream (ancho/alto)
  const [ar, setAr] = useState<number | null>(null);

  // Galería
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  /* ====== AUTOCOMPLETE AEROLÍNEAS (solo nombres) ====== */
  const [airlineQuery, setAirlineQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [openList, setOpenList] = useState(false);

  const filteredAirlines = useMemo(() => {
    const q = normalize(airlineQuery);
    const base = q ? AIRLINES.filter((name) => normalize(name).includes(q)) : AIRLINES;
    return base.slice(0, 8);
  }, [airlineQuery]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [airlineQuery]);

  const onSelectAirline = (name: string) => {
    setAirlineQuery(name); // solo nombre en el input
    setOpenList(false);
  };

  // ===== Camera helpers =====
  function isPortraitWindow() {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(orientation: portrait)")?.matches || window.innerHeight > window.innerWidth;
  }

  function buildConstraints(mode: Facing): MediaStreamConstraints {
    const portrait = isPortraitWindow();
    const size = portrait
      ? { width: { ideal: 720 }, height: { ideal: 1280 } } // alto > ancho
      : { width: { ideal: 1280 }, height: { ideal: 720 } };

    return {
      video: {
        facingMode: mode,
        ...size,
      },
      audio: false,
    };
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setAr(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      photos.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalcular AR al rotar o redimensionar
  useEffect(() => {
    const onResize = () => {
      const v = videoRef.current;
      if (v?.videoWidth && v?.videoHeight) {
        setAr(v.videoWidth / v.videoHeight);
      } else {
        setAr(null); // forzar fallback 9/16 o 16/9
      }
    };
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const startCamera = async (mode: Facing = facingMode) => {
    try {
      setLoading(true);
      setError(null);
      stopCamera();

      const strict: MediaStreamConstraints = { video: { facingMode: { exact: mode } }, audio: false };
      const ideal = buildConstraints(mode);

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(strict);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(ideal);
      }

      // Intento de forzar cámara trasera si pidió "environment" y no se logró
      if (mode === "environment" && stream) {
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        if (settings.facingMode !== "environment" && navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const rear = devices.find(
              (d) => d.kind === "videoinput" && /back|rear|environment/i.test(d.label || "")
            );
            if (rear) {
              stream.getTracks().forEach((t) => t.stop());
              stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: rear.deviceId }, ...(buildConstraints(mode).video as MediaTrackConstraints) },
                audio: false,
              });
            }
          } catch { /* ignore */ }
        }
      }

      streamRef.current = stream!;
      if (videoRef.current) {
        const v = videoRef.current;
        v.srcObject = stream!;
        v.playsInline = true;

        const onMeta = () => {
          if (v.videoWidth && v.videoHeight) setAr(v.videoWidth / v.videoHeight);
        };
        v.addEventListener("loadedmetadata", onMeta, { once: true });

        await v.play().catch(() => {});

        const track = stream!.getVideoTracks()[0];
        const s = track.getSettings();
        if (typeof s.aspectRatio === "number") {
          setAr(s.aspectRatio);
        } else if (v.videoWidth && v.videoHeight) {
          setAr(v.videoWidth / v.videoHeight);
        }
      }

      setActive(true);
      setFacingMode(mode);
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string } | undefined;
      const msg =
        err?.name === "NotAllowedError"
          ? "Permission denied. Please allow camera access."
          : err?.name === "NotFoundError"
          ? "No camera found."
          : "Failed to start the camera.";
      setError(`${msg}${err?.message ? ` (${err.message})` : ""}`);
      stopCamera();
    } finally {
      setLoading(false);
    }
  };

  // ===== Capture & list handling =====
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

        const url = URL.createObjectURL(blob);
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

  // Helper to convert Blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        if (typeof base64 === "string") {
          resolve(base64.split(",")[1]);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleImageUpload = async (photo: PhotoItem) => {
    try {
      const base64String = await blobToBase64(photo.blob);
      const analysis = await analyzeImage({ blob: base64String, id: photo.id });
      
      return {
        ...photo,
        status: "ok" as const,
        expired: analysis.expired,
        not_expired: analysis.not_expired
      };
    } catch (error) {
      console.error("Error analyzing image:", error);
      return {
        ...photo,
        status: "error" as const,
        error: error instanceof Error ? error.message : "Failed to analyze image"
      };
    }
  };

  const analyzeImage = async (item: { blob: string; id: number }) => {
    console.log("[analyzeImage] Sending image for sticker analysis");

    const res = await fetch("/api/stickers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: item }),
    });
    
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));

    const analysis = await res.json();
    if (!analysis.success) {
      throw new Error(analysis.message || 'Analysis failed');
    }
    console.log("details: ", analysis)
    return {
      expired: analysis.expired,
      not_expired: analysis.not_expired
    };
  };

  const uploadAll = async () => {
    const pending = photos.filter((p) => p.status === "idle" || p.status === "error");
    if (pending.length === 0) {
      console.info("[uploadAll] No pending photos to analyze.");
      return;
    }

    // Mark all as "uploading"
    setPhotos((prev) =>
      prev.map((p) =>
        pending.find((x) => x.id === p.id) ? { ...p, status: "uploading", error: null } : p
      )
    );

    console.time("[uploadAll] Upload time");
    try {
      // Process each image
      const results = await Promise.all(pending.map(handleImageUpload));
      
      // Update photos with results
      setPhotos((prev) =>
        prev.map((p) => {
          const result = results.find((r) => r.id === p.id);
          return result || p;
        })
      );

      console.group("[uploadAll] Analysis Results");
      console.table(
        results.map((r) => ({
          id: r.id,
          expired: r.expired?.total || 0,
          not_expired: r.not_expired?.total || 0,
          status: r.status,
        }))
      );
      console.groupEnd();

    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : "Upload failed";
      console.error("[uploadAll] Error al subir:", e);
      setPhotos((prev) =>
        prev.map((p) =>
          pending.find((x) => x.id === p.id) ? { ...p, status: "error", error: msg } : p
        )
      );
    } finally {
      console.timeEnd("[uploadAll] Upload time");
    }
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
            <h2 className="text-3xl font-semibold">Food expiration date verifier</h2>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6 ring-1 ring-black/5">
          {/* Controles: una sola fila + íconos */}
          <div className="flex flex-row flex-wrap items-stretch gap-3">
            <button
              onClick={() => startCamera("environment")}
              disabled={loading}
              className="flex-1 rounded-2xl bg-sky-700 px-6 py-4 text-lg font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
              aria-label={loading ? "Opening…" : "Open"}
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
            >
              <span className="flex items-center justify-center gap-2">
                <Square className="h-5 w-5" aria-hidden="true" />
              </span>
            </button>
          </div>

          {/* Live video: sin barras (portrait real) */}
          <div className="mt-6 rounded-xl border border-slate-700 bg-black/40 p-3">
            <div
              className="mx-auto w-full max-w-3xl"
              style={
                ar
                  ? { aspectRatio: ar as number }
                  : isPortraitWindow()
                  ? { aspectRatio: 9 / 16 }
                  : { aspectRatio: 16 / 9 }
              }
            >
              <video
                ref={videoRef}
                className="h-full w-full rounded-lg bg-black object-cover"
                muted
                playsInline
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-900/40 p-3 text-rose-200 ring-1 ring-rose-900/60">
              {error}
            </div>
          )}

          <p className="mt-3 text-center text-sm text-slate-300">
            Note: on iOS/Safari, the camera can only start after a user gesture (click/tap).
          </p>
        </div>

        {/* Gallery with per-item upload */}
        <section className="mt-8 rounded-2xl bg-slate-900 p-6 ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Captured items
              <span className="ml-2 rounded bg-slate-700 px-2 py-0.5 text-sm">{photos.length}</span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={uploadAll}
                disabled={photos.length === 0}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Upload all
              </button>
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
                  {/* Bloque de fondo que cambia según análisis */}
                  <div
                    className={`relative rounded-lg ring-1 p-1 transition-colors ${
                      p.expired?.total ? 'bg-red-100 ring-red-500' :
                      p.not_expired?.total ? 'bg-green-100 ring-green-500' :
                      'bg-gray-100 ring-gray-300'
                    }`}
                    aria-label={
                      p.status === "ok"
                        ? `Expired: ${p.expired?.total || 0}, Valid: ${p.not_expired?.total || 0}`
                        : p.status === "error"
                        ? "Error analyzing"
                        : "Pending analysis"
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={`capture-${p.id}`}
                      className="h-48 w-full rounded-md object-cover"
                    />

                    {/* Badge flotante opcional */}
                    {p.status === "ok" && (
                      <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
                        {p.expired?.total
                          ? `Expired: ${p.expired.total}`
                          : p.not_expired?.total
                          ? `Valid: ${p.not_expired.total}`
                          : "No items"}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-300">
                    <div>{new Date(p.createdAt).toLocaleString()}</div>

                    {p.status === "ok" && (
                      <div
                        className={
                          p.expired?.total
                            ? "text-rose-300 font-semibold"
                            : "text-emerald-300 font-semibold"
                        }
                      >
                        {p.expired?.total 
                          ? `Expired Items: ${p.expired.total}`
                          : p.not_expired?.total
                          ? `Valid Items: ${p.not_expired.total}`
                          : "No items detected"
                        }
                      </div>
                    )}

                    {p.status === "uploading" && <div className="text-indigo-300">Uploading…</div>}
                    {p.status === "error" && <div className="text-rose-300">Upload failed</div>}
                  </div>

                  {/* === Analysis blocks under the image === */}
                  {p.status === "ok" && (
                    <div className="mt-3 space-y-4">
                      {/* Expired section */}
                      {typeof p.expired?.total === "number" && (
                        <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-rose-200">
                              Expired
                            </h4>
                            <span className="rounded-md bg-rose-800/60 px-2 py-0.5 text-xs font-semibold text-rose-100">
                              Total: {p.expired.total}
                            </span>
                          </div>

                          {Array.isArray(p.expired.details) && p.expired.details.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {p.expired.details.map((d, idx) => (
                                <div
                                  key={`exp-${p.id}-${idx}`}
                                  className="rounded-lg border border-rose-800/40 bg-rose-900/30 px-3 py-2"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="space-x-2">
                                      <span className="rounded bg-rose-800/70 px-1.5 py-0.5 font-medium text-rose-100">
                                        {d.shape || "—"}
                                      </span>
                                      <span className="rounded bg-rose-800/40 px-1.5 py-0.5 text-rose-200/90">
                                        {d.color || "—"}
                                      </span>
                                    </div>
                                    <span className="rounded bg-rose-700/60 px-2 py-0.5 font-semibold text-rose-50">
                                      {d.count ?? 0}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Not expired section */}
                      {typeof p.not_expired?.total === "number" && (
                        <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-emerald-200">
                              Valid / Not expired
                            </h4>
                            <span className="rounded-md bg-emerald-800/60 px-2 py-0.5 text-xs font-semibold text-emerald-100">
                              Total: {p.not_expired.total}
                            </span>
                          </div>

                          {Array.isArray(p.not_expired.details) && p.not_expired.details.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {p.not_expired.details.map((d, idx) => (
                                <div
                                  key={`ok-${p.id}-${idx}`}
                                  className="rounded-lg border border-emerald-800/40 bg-emerald-900/30 px-3 py-2"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="space-x-2">
                                      <span className="rounded bg-emerald-800/70 px-1.5 py-0.5 font-medium text-emerald-100">
                                        {d.shape || "—"}
                                      </span>
                                      <span className="rounded bg-emerald-800/40 px-1.5 py-0.5 text-emerald-200/90">
                                        {d.color || "—"}
                                      </span>
                                    </div>
                                    <span className="rounded bg-emerald-700/60 px-2 py-0.5 font-semibold text-emerald-50">
                                      {d.count ?? 0}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => deleteFromList(p.id)}
                      className="flex-1 rounded-md bg-rose-800 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  </div>

                  {p.status === "error" && p.error && (
                    <div className="mt-2 rounded-md bg-rose-900/40 p-2 text-xs text-rose-200">
                      {p.error}
                    </div>
                  )}
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
