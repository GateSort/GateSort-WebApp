import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import Link from "next/link";

export default function AlcoholLevelPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700">←</Link>
          <div>
            <h2 className="text-3xl font-semibold">Alcohol Level Detection</h2>
            <p className="text-slate-300">Take photos and get AI recommendations</p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6 ring-1 ring-black/5">
          <button className="block w-full rounded-2xl bg-sky-700 px-6 py-10 text-lg font-semibold text-slate-100 hover:bg-sky-600">
            📷 TAKE PHOTO OF BOTTLE
          </button>
          <p className="mt-3 text-center text-sm text-slate-300">
            Take multiple photos to analyze different bottles
          </p>
        </div>

        <section className="mt-8 rounded-2xl bg-slate-900 p-6 ring-1 ring-black/5">
          <h3 className="text-xl font-semibold">How to Use</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-300">
            <li>Tap “Take Photo of Bottle” to capture an image.</li>
            <li>Repeat for each bottle you need to analyze.</li>
            <li>Revisa las recomendaciones y marca las botellas seguras.</li>
          </ol>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
