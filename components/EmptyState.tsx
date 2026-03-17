import Image from 'next/image';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export function EmptyState({
  title = 'Нет активных заказов',
  subtitle = 'Ожидайте поступления новых заказов.',
}: EmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <Image
          src="/icon/net-zakazov.svg"
          alt="Нет заказов"
          width={90}
          height={65}
          className="h-24 w-auto"
        />
        <h2 className="text-lg font-semibold text-[#5C73A1]">
          {title}
        </h2>
        <p className="text-sm text-[#5C73A1]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
