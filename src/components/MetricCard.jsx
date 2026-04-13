export default function MetricCard({ label, value, valueColor }) {
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-5">
      <div className={`text-3xl font-semibold font-mono ${valueColor ?? 'text-[#CFCFCE]'}`}>{value}</div>
      <div className="text-xs text-[#6B6B6B] mt-1">{label}</div>
    </div>
  )
}
