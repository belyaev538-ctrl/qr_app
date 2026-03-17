import type { OrderPriorityStatus } from '../types/order';

export interface PriorityBadgeProps {
  priority: OrderPriorityStatus;
}

const priorityConfig: Record<
  OrderPriorityStatus,
  { label: string; className: string }
> = {
  urgent: { label: 'СРОЧНЫЙ', className: 'bg-red-500 text-white' },
  collect_now: { label: 'ПОРА СОБИРАТЬ', className: 'bg-amber-500 text-white' },
  can_start: { label: 'МОЖНО НАЧАТЬ', className: 'bg-blue-500 text-white' },
  plenty_of_time: {
    label: 'ВРЕМЯ ЕСТЬ',
    className: 'bg-blue-500 text-white',
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority] ?? {
    label: priority,
    className: 'bg-gray-500 text-white',
  };
  return (
    <span
      className={`inline-flex h-[21px] items-center rounded-[3px] px-2.5 text-[10px] font-normal ${config.className}`}
    >
      {config.label}
    </span>
  );
}
