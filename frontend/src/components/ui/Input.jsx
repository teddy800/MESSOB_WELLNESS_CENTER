export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <input
        className={`w-full px-3 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <select
        className={`w-full px-3 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 resize-none
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
