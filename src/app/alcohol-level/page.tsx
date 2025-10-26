"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { Play, Camera, Square } from "lucide-react"; // ← ICONOS

type Facing = "environment" | "user";
type UploadStatus = "idle" | "uploading" | "ok" | "error";

type PredictionLabel = "full" | "medium" | "empty";
type ActionLabel = "keep" | "discard";

type PhotoItem = {
  id: number;
  url: string;       // Object URL for preview
  blob: Blob;        // Image data
  createdAt: number;
  status: UploadStatus;
  error?: string | null;
  // Campos con resultados del servidor
  prediction?: PredictionLabel;
  action?: ActionLabel;
};

// === Tipos del backend (contrato) ===
type BottlePrediction = {
  filename: string;                 // p.ej. "bottle-3.jpg"
  prediction: PredictionLabel;      // "full" | "medium" | "empty"
  action: ActionLabel;              // "keep" | "discard"
};

type ServerResponse = { results: BottlePrediction[] } | BottlePrediction[];

// ======================== Componente ========================
export default function AlcoholLevelPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const idCounterRef = useRef(1);

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<Facing>("environment");

  // Latest preview (no "upload latest")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);

  // Gallery list
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // ===== Helpers visuales =====
  const bgClassesForAction = (action?: ActionLabel) => {
    if (action === "keep") return "bg-emerald-900/30 ring-emerald-700/50";
    if (action === "discard") return "bg-rose-900/30 ring-rose-700/50";
    return "bg-slate-800/40 ring-slate-700/60"; // neutro si aún no hay resultado
  };

  // Texto para prediction/action
  const labelPrediction = (p?: PredictionLabel) =>
    p ? (p === "full" ? "full" : p === "medium" ? "medium" : "empty") : "—";
  const labelAction = (a?: ActionLabel) =>
    a ? (a === "keep" ? "keep" : "discard") : "—";

  // ===== Camera control =====
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

  const startCamera = async (mode: Facing = facingMode) => {
    try {
      setLoading(true);
      setError(null);
      stopCamera();

      const strict: MediaStreamConstraints = {
        video: { facingMode: { exact: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      const ideal: MediaStreamConstraints = {
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(strict);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(ideal);
      }

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
                video: { deviceId: { exact: rear.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
              });
            }
          } catch {
            /* ignore */
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

      // reset latest preview
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

        // latest preview
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
        setPhotoBlob(blob);

        // add to gallery
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

  // Helper to convert Blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        if (typeof base64 === "string") {
          resolve(base64.split(",")[1]); // remove data:*/*;base64,
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // You may want to get airlineName from state or props; for now, hardcode or add as needed
  const airlineName = "Aeroméxico"; // TODO: Replace with dynamic value as needed

  const uploadBlobs = async (items: { blob: string; id: number }[]) => {
    // Items are already in base64 format
    console.groupCollapsed("[uploadBlobs] Enviando imágenes");

    console.groupCollapsed("[uploadBlobs] Enviando imágenes");
    console.log("IDs:", items.map((i) => i.id));
    console.log("Endpoint:", '/api/actions');
    console.groupEnd();

    const res = await fetch('/api/actions', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, airlineName }),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
    // New API output: { success, airline, actions }
    const raw = (await res.json().catch(() => null)) as { success: boolean, airline: string, actions: BottlePrediction[] } | null;
    const actions = raw && Array.isArray(raw.actions) ? raw.actions : [];
    return { results: actions };
  };

  const uploadAll = async () => {
    const pending = photos.filter((p) => p.status === "idle" || p.status === "error");
    if (pending.length === 0) {
      console.info("[uploadAll] No hay fotos pendientes por subir.");
      return;
    }

    // marcar todas como "uploading"
    setPhotos((prev) =>
      prev.map((p) =>
        pending.find((x) => x.id === p.id) ? { ...p, status: "uploading", error: null } : p
      )
    );

    console.time("[uploadAll] Tiempo de subida]");
    try {
        // First convert all blobs to base64
    const itemsToUpload = await Promise.all(
      pending.map(async (p) => ({ 
        blob: await blobToBase64(p.blob), 
        id: p.id, 
        action: p.action 
      }))
    );
    const { results } = await uploadBlobs(itemsToUpload);

    // Logs
    console.group("[uploadAll] Respuesta del servidor");
    console.log("Objeto completo (normalizado):", results);
    if (Array.isArray(results)) {
      console.table(
        results.map((r) => ({
          filename: r.filename,
          prediction: r.prediction,
          action: r.action,
        }))
      );
    }
      console.groupEnd();

      // Actualizar estado por filename
      setPhotos((prev) =>
        prev.map((p) => {
          const filename = `bottle-${p.id}.jpg`;
          const match = results.find((r) => r.filename === filename);
          if (match) {
            return {
              ...p,
              status: "ok",
              prediction: match.prediction,
              action: match.action,
            };
          }
          return p;
        })
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("[uploadAll] Error al subir:", e);
      setPhotos((prev) =>
        prev.map((p) =>
          pending.find((x) => x.id === p.id)
            ? { ...p, status: "error", error: e?.message || "Upload failed" }
            : p
        )
      );
    } finally {
      console.timeEnd("[uploadAll] Tiempo de subida]");
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
            <h2 className="text-3xl font-semibold">Alcohol Level Detection</h2>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6 ring-1 ring-black/5">
          {/* Controles: una sola fila + íconos */}
          <div className="flex flex-row flex-wrap items-stretch gap-3">
            <button
              onClick={() => startCamera("environment")}
              disabled={loading}
              className="flex-1 rounded-2xl bg-sky-700 px-6 py-4 text-lg font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
              aria-label={loading ? "Opening…" : active ? "Restart (rear)" : ""}
            >
              <span className="flex items-center justify-center gap-2">
                <Play className="h-5 w-5" aria-hidden="true" />
                <span>{loading ? "Opening…" : active ? "" : ""}</span>
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
                <span></span>
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
                <span></span>
              </span>
            </button>
          </div>

          {/* Live video */}
          <div className="mt-6 rounded-xl border border-slate-700 bg-black/40 p-3">
            <video
              ref={videoRef}
              className="mx-auto aspect-video w-full max-w-3xl rounded-lg bg-black object-cover"
              muted
              playsInline
            />
          </div>

          {/* Latest preview */}
          {photoUrl && (
            <div className="mt-6">
              <p className="mb-2 text-sm text-slate-300">Latest capture:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="capture"
                className="mx-auto max-h-96 w-auto rounded-xl border border-slate-700 object-contain"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={retake}
                  className="flex-1 rounded-xl bg-slate-700 px-4 py-3 font-semibold text-white hover:bg-slate-600"
                >
                  Retake (clear preview)
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

        {/* Gallery with per-item upload */}
        <section className="mt-8 rounded-2xl bg-slate-900 p-6 ring-1 ring-black/5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              Captured bottle photos
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
                  {/* Bloque de fondo que cambia según action */}
                  <div
                    className={`relative rounded-lg ring-1 p-1 transition-colors ${bgClassesForAction(p.action)}`}
                    aria-label={
                      p.action
                        ? (p.action === "keep" ? "Resultado: mantener" : "Resultado: descartar")
                        : "Sin resultado"
                    }
                  >
                    {/* Imagen */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={`capture-${p.id}`}
                      className="h-48 w-full rounded-md object-cover"
                    />
                  </div>

                  <div className="mt-2 text-xs text-slate-300">
                    <div>{new Date(p.createdAt).toLocaleString()}</div>

                    {p.status === "ok" && (
                      <div className="text-emerald-300">
                        Uploaded ✓
                        {(p.prediction || p.action) && (
                          <>
                            {" · "}
                            <span className="font-semibold">prediction:</span> {labelPrediction(p.prediction)}
                            {" · "}
                            <span className="font-semibold">action:</span> {labelAction(p.action)}
                          </>
                        )}
                      </div>
                    )}

                    {p.status === "uploading" && (
                      <div className="text-indigo-300">Uploading…</div>
                    )}

                    {p.status === "error" && (
                      <div className="text-rose-300">Upload failed</div>
                    )}
                  </div>

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
