export interface QueuePositionProps {
  position: number;
}

export function QueuePosition({ position }: QueuePositionProps) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-sm">
      {position}
    </span>
  );
}
