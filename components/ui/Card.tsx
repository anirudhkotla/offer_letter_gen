import { cn } from "@/lib/utils";

export default function Card({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 shadow-sm", className)}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
