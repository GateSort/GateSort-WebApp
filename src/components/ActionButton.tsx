import Link from "next/link";

type Props = {
  href: string;
  variant?: "primary" | "danger";
  label: string;
  icon?: string; // uso de emoji para evitar dependencias
};

export function ActionButton({ href, variant = "primary", label, icon }: Props) {
  const base =
    "flex w-full items-center justify-center rounded-2xl py-6 text-lg font-semibold shadow-lg ring-1 ring-black/5";
  const styles =
    variant === "primary"
      ? "bg-sky-700 text-slate-100 hover:bg-sky-600"
      : "bg-rose-800 text-slate-100 hover:bg-rose-700";
  return (
    <Link href={href} className={`${base} ${styles}`}>
      <span className="mr-2">{icon}</span>
      {label}
    </Link>
  );
}
