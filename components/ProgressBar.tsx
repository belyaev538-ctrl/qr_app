export interface ProgressBarProps {
  value: number;
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return '#90B94E';
  if (pct >= 75) return '#78E648';
  if (pct >= 50) return '#E6D648';
  if (pct >= 25) return '#0CCEFE';
  return '#0C58FE';
}

export function ProgressBar({ value }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  const color = getProgressColor(pct);
  return (
    <div className="h-[7px] w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
