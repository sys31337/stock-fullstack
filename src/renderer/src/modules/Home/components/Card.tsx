import React from 'react'
import { ReactElement } from 'react'
import { cn } from '@web/shared/utils/cn'

interface CardProps {
  label: string;
  keyBind: string;
  icon: ReactElement;
  href: string;
  bg?: string;
}

const Card: React.FC<CardProps> = ({
  label, keyBind, icon, href, bg,
}) => (
  <a
    href={href}
    className={cn(
      "group relative block w-full rounded-xl border border-border bg-card p-6",
      "shadow-sm transition-all duration-200",
      "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    )}
  >
    <div className="absolute top-3 right-3">
      <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground border border-border">
        {keyBind}
      </span>
    </div>
    <div className="flex items-center gap-4">
      <div className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg",
        bg || "bg-primary/10"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {label}
        </h3>
      </div>
    </div>
  </a>
)

export default Card
