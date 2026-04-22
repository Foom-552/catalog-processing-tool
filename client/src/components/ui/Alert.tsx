import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

const config: Record<AlertVariant, { icon: React.ElementType; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'bg-green-50 border-green-200 text-green-800' },
  error: { icon: XCircle, cls: 'bg-red-50 border-red-200 text-red-800' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-800' },
  info: { icon: Info, cls: 'bg-blue-50 border-blue-200 text-blue-800' },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
  const { icon: Icon, cls } = config[variant];
  return (
    <div className={`flex gap-3 rounded-lg border p-4 ${cls}`} role="alert">
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
