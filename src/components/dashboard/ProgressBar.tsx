interface Props {
  percent: number; // 0~100
  className?: string;
  color?: string; // tailwind bg class
}

export default function ProgressBar({ percent, className = '', color = 'bg-primary' }: Props) {
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
