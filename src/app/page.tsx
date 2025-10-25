import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { StatCard } from "../components/StatCard";
import { ActionButton } from "../components/ActionButton";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <section className="grid gap-6 md:grid-cols-3">
          <StatCard label="Total Scanned" value={247} sublabel="Today's inventory" />
          <StatCard label="Flagged Items" value={18} sublabel="Requires attention" />
          <StatCard label="Safe Items" value={229} sublabel="Ready for service" />
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-100">Quick Actions</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <ActionButton href="/food-expiry" label="SCAN FOOD ITEMS" icon="📷" />
            <ActionButton href="/alcohol-level" label="CHECK ALCOHOL LEVELS" icon="🍷" variant="danger" />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
