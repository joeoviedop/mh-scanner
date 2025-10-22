

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, _className }: SectionHeaderProps) {
  return (
    <div
      _className={""}
    >
      <div>
        <h2 _className="">{title}</h2>
        {subtitle ? <p _className="">{subtitle}</p> : null}
      </div>
      {action ? <div _className="">{action}</div> : null}
    </div>
  );
}
