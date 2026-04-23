export default function StatCard({ icon: Icon, label, value, sub, color = 'teal', trend }) {
  const colors = {
    teal:   'bg-teal-50 text-teal-600 border-teal-100',
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    red:    'bg-red-50 text-red-600 border-red-100',
    green:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl border ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
    </div>
  );
}
