function Skeleton({ className = '', variant = 'rect', width, height, rounded = 'lg' }) {
  const baseClasses = 'animate-shimmer';
  const roundedClass = rounded === 'full' ? 'rounded-full' : `rounded-${rounded}`;
  const variantClass = variant === 'circle' ? 'rounded-full' : '';

  return (
    <div
      className={`${baseClasses} ${roundedClass} ${variantClass} ${className}`}
      style={{ width, height }}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
      <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-3" />
      <div className="w-32 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse mb-2" />
      <div className="w-20 h-3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
    </div>
  );
}

function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex-1 h-4 bg-slate-100 dark:bg-slate-700/50 rounded animate-pulse" style={{ animationDelay: `${r * 0.1}s` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = '300px' }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-40 h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="w-20 h-5 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
      <div
        className="bg-slate-100 dark:bg-slate-700/50 rounded-lg animate-pulse"
        style={{ height, width: '100%' }}
      />
    </div>
  );
}

export { Skeleton, CardSkeleton, TableSkeleton, ChartSkeleton };
export default Skeleton;

