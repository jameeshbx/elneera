import Link from "next/link"
import type { BreadcrumbItem } from "@/data/navigation"

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-white" data-cy="breadcrumbs">
      <div className="flex items-center">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2 text-white/50">/</span>}
            {item.active ? (
              <span className="font-medium font-Raleway" data-cy="breadcrumb-active">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="opacity-80 hover:opacity-100 transition-opacity font-Raleway"
                data-cy="breadcrumb-link"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}
