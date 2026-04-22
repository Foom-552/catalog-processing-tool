import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <div className="flex items-center gap-2 text-blue-600">
      <Loader2 className={`animate-spin ${sizes[size]}`} />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}
