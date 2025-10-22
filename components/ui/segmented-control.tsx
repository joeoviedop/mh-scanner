

export interface SegmentedControlOption {
  value: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedControlOption[];
  className?: string;
}

export function SegmentedControl({ value, onChange, options, _className }: SegmentedControlProps) {
  return (
    <div
      _className={""}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            _className={""}
          >
            {option.label}
            {option.hint ? (
              <span _className="">{option.hint}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
