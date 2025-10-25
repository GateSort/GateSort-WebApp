"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <h1 className="text-2xl tracking-[0.25em] text-slate-200">
          <span className="font-extrabold">GATE</span>
          <span className="font-light">SORT</span>
        </h1>
        <span className="text-slate-300">Catering Inventory</span>
      </div>
    </header>
  );
}
