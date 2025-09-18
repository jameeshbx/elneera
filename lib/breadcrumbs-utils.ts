import type { BreadcrumbItem } from "@/data/navigation"

/**
 * Generates breadcrumb items based on the current path
 * @param path - The current path (e.g., /dashboard/users)
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  // Split the path into segments and remove empty segments
  const segments = path.split("/").filter(Boolean)

  // Create the home breadcrumb
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Pages", href: "/" }]

  // If we're on the home page, mark it as active
  if (segments.length === 0) {
    breadcrumbs[0].active = true
    return breadcrumbs
  }

  // Add the current page breadcrumb
  const currentSegment = segments[segments.length - 1]
  const label = currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1)

  breadcrumbs.push({
    label,
    href: `/${currentSegment}`,
    active: true,
  })

  return breadcrumbs
}
