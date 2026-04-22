import { Check } from 'lucide-react';

const STEPS = [
  { label: 'Upload', sublabel: 'Select catalog file' },
  { label: 'Validate', sublabel: 'Check for errors' },
  { label: 'Convert', sublabel: 'Choose output format' },
  { label: 'Result', sublabel: 'Download or post' },
];

interface StepIndicatorProps {
  current: number; // 1-based
}

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <ol className="flex items-center gap-0">
          {STEPS.map((step, idx) => {
            const num = idx + 1;
            const isCompleted = num < current;
            const isActive = num === current;
            return (
              <li key={num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all ${
                    isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                    isActive ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : num}
                  </div>
                  <div className="mt-1.5 text-center">
                    <p className={`text-xs font-semibold ${isActive ? 'text-blue-600' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-400 hidden sm:block">{step.sublabel}</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 mb-5 transition-all ${num < current ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
