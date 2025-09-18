export interface BreadcrumbItem {
    label: string
    href: string
    active?: boolean
  }
  
export interface NavigationData {
    [path: string]: {
      breadcrumbs: BreadcrumbItem[]
      title: string
      subtitle: string
    }
  }
  
  // Sample navigation data for different paths
  export const navigationData: NavigationData = {
    "/admin": {
      breadcrumbs: [{ label: "Pages", href: "/admin", active: true }],
      title: "Dashboard",
      subtitle: "Overview and summary",
    },
    "/admin/dashboard": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage Users",
      subtitle: "Add or manage details",
    },
    "/admin/dashboard/manage-subscription": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage Subscriptions",
      subtitle: "Add or manage details",
    },
    "/admin/dashboard/add-managers": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage Users",
      subtitle: "Add or manage details",
    },
    "/admin/dashboard/Manage-DMC": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage DMC Signups",
      subtitle: "Add or manage details",
    },
    "/admin/dashboard/profile": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Profile",
      subtitle: "Profile",
    },
    "/admin/dashboard/add-dmc": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage DMC",
      subtitle: "Add or manage details",
    },
    "/admin/dashboard/manage-agency": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage Agency Signups",
      subtitle: "Add or manage details",
    },
    "/admin/dashboard/manage-DMC": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage DMC Signups",
      subtitle: "Add or manage details",
    },
    "/agency-admin/dashboard/add-users": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage Users",
      subtitle: "Add or manage details",
    },
    "/agency/dashboard/add-dmc": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage DMC",
      subtitle: "Add or manage details",
    },
    "/agency/dashboard/profile": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Profile",
      subtitle: "Profile",
    },
    "/agency/dashboard/enquiry": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Enquiries",
      subtitle: "Manage enquiries and followup",
    },
    "/agency/dashboard/enquiry/view-leads/exist-Itenary-view": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Itineraries",
      subtitle: "View and Share",
    },
    "/agency/dashboard/enquiry/view-leads": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/dashboard", active: true },
      ],
      title: "Manage Enquiries",
      subtitle: "View all enquiries ",
    },
    
  }
  
  export function getNavigationData(path: string) {
    return (
      navigationData[path] || {
        breadcrumbs: [
          { label: "Pages", href: "/admin" },
          { label: path.split("/admin").filter(Boolean).join("/admin"), href: path, active: true },
        ],
        title: "Page",
        subtitle: "Page description",
      }
    )
  }
  