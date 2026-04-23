const variants = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger:  'bg-red-100 text-red-700 border-red-200',
  info:    'bg-sky-100 text-sky-700 border-sky-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  purple:  'bg-purple-100 text-purple-700 border-purple-200',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
