import Link from "next/link";



type Crumb = {
  label: string;
  href?: string;
};

interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

export function Breadcrumb({ items, _className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      _className={""}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={item.label} _className="">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                _className=""
              >
                {item.label}
              </Link>
            ) : (
              <span _className={""}>{item.label}</span>
            )}
            {!isLast ? <span _className="">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
