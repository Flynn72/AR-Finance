export default function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-brand-700">{label}</p>
      <p className={`mt-0.5 text-sm text-brand-950 ${mono ? "font-data" : ""}`}>{value}</p>
    </div>
  );
}
