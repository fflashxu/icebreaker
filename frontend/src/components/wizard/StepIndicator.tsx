interface Step {
  number: 1 | 2 | 3;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: 'Candidate Info' },
  { number: 2, label: 'Email Settings' },
  { number: 3, label: 'Generated Emails' },
];

interface Props {
  current: 1 | 2 | 3;
}

export function StepIndicator({ current }: Props) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const done = current > step.number;
        const active = current === step.number;
        return (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-sky-600 text-white'
                    : active
                    ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? '✓' : step.number}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block transition-colors ${
                  active ? 'text-sky-600' : done ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-3 h-px w-12 sm:w-20 transition-colors ${
                  done ? 'bg-sky-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
