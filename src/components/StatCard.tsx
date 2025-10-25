type StatCardProps = {
  label: string;
  value: string | number;
  sublabel: string;
};

export function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-slate-800 p-6 shadow-lg ring-1 ring-black/5">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-5xl font-bold tracking-tight text-slate-100">{value}</p>
      <div className="mt-6 flex items-center gap-2 text-slate-300">
        <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
        <span className="text-sm">{sublabel}</span>
      </div>
    </div>
  );
}
