interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={className} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={className} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return <h3 className={className} {...props} />;
}

export function CardDescription({ className, ...props }: CardProps) {
  return <p className={className} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={className} {...props} />;
}
