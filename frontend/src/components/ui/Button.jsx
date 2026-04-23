const variants = {
  primary:   'bg-teal-600 hover:bg-teal-700 text-white shadow-sm',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-600',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export default function Button({
  children, variant = 'primary', size = 'md',
  className = '', disabled, loading, onClick, type = 'button', ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {children}
    </button>
  );
}
