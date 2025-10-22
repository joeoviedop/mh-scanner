import type { ReactNode } from "react";



type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, _className }: PageContainerProps) {
  return (
    <div _className={""}>
      {children}
    </div>
  );
}
