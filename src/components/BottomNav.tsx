"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ⬇️ Componente declarado FUERA del render de BottomNav
type NavItemProps = {
  href: string;
  label: string;
  icon: string;
  currentPath: string;
};

function NavItem({ href, label, icon, currentPath }: NavItemProps) {
  const active = currentPath === href;

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center rounded-2xl px-6 py-3 text-sm font-medium
      ${active ? "bg-slate-700 text-white" : "text-slate-300 hover:text-white"}`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="mt-1">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const path = usePathname() ?? "/";

  return (
    <nav className="sticky bottom-0 z-50 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 p-3">
        <NavItem href="/" label="Dashboard" icon="" currentPath={path} />
        <NavItem href="/food-expiry" label="Food Expiry" icon="" currentPath={path} />
        <NavItem href="/alcohol-level" label="Alcohol Level" icon="" currentPath={path} />
      </div>
    </nav>
  );
}
