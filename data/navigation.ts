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
        { label: "Dashboard", href: "/admin/dashboard", active: true },
      ],
      title: "Dashboard",
      subtitle: "Overview and summary",
    },
    "/admin/dashboard/booking-details": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Booking Details", href: "/admin/dashboard/booking-details", active: true },
      ],
      title: "Booking Details",
      subtitle: "Add or manage details",
    },
    "/admin/dashboard/booking-details/booking": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Booking Details", href: "/admin/dashboard/booking-details" },
        { label: "Booking", href: "/admin/dashboard/booking-details/booking", active: true },
      ],
      title: "Booking",
      subtitle: "View booking information",
    },
    "/admin/dashboard/booking-details/progress": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Booking Details", href: "/admin/dashboard/booking-details" },
        { label: "Progress", href: "/admin/dashboard/booking-details/progress", active: true },
      ],
      title: "Progress",
      subtitle: "Track booking progress",
    },
    "/admin/dashboard/booking-details/feedback": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Booking Details", href: "/admin/dashboard/booking-details" },
        { label: "Feedback", href: "/admin/dashboard/booking-details/feedback", active: true },
      ],
      title: "Feedback",
      subtitle: "View customer feedback",
    },
    "/admin/dashboard/booking-details/reminder": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Booking Details", href: "/admin/dashboard/booking-details" },
        { label: "Reminder", href: "/admin/dashboard/booking-details/reminder", active: true },
      ],
      title: "Reminder",
      subtitle: "Set and manage reminders",
    },
    "/admin/dashboard/enquiry": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Enquiry", href: "/admin/dashboard/enquiry", active: true },
      ],
      title: "Enquiry",
      subtitle: "View and manage enquiries",
    },
    "/admin/dashboard/enquiry/view-leads": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Enquiry", href: "/admin/dashboard/enquiry" },
        { label: "View Leads", href: "/admin/dashboard/enquiry/view-leads", active: true },
      ],
      title: "View Leads",
      subtitle: "Browse all enquiry leads",
    },
    "/admin/dashboard/enquiry/view-leads/exist-Itenary-view": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Enquiry", href: "/admin/dashboard/enquiry" },
        { label: "View Leads", href: "/admin/dashboard/enquiry/view-leads" },
        { label: "Itinerary", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view", active: true },
      ],
      title: "Itinerary View",
      subtitle: "View existing itinerary details",
    },
    "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Enquiry", href: "/admin/dashboard/enquiry" },
        { label: "View Leads", href: "/admin/dashboard/enquiry/view-leads" },
        { label: "Itinerary", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view" },
        { label: "Booking Details", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details", active: true },
      ],
      title: "Booking Details",
      subtitle: "View and manage booking information",
    },
    "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Enquiry", href: "/admin/dashboard/enquiry" },
        { label: "View Leads", href: "/admin/dashboard/enquiry/view-leads" },
        { label: "Itinerary", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view" },
        { label: "Booking Details", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details" },
        { label: "Progress", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress", active: true },
      ],
      title: "Progress",
      subtitle: "Track booking progress",
    },
    "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress/feedback": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Enquiry", href: "/admin/dashboard/enquiry" },
        { label: "View Leads", href: "/admin/dashboard/enquiry/view-leads" },
        { label: "Itinerary", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view" },
        { label: "Booking Details", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details" },
        { label: "Progress", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress" },
        { label: "Feedback", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress/feedback", active: true },
      ],
      title: "Feedback",
      subtitle: "View customer feedback",
    },
    "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress/feedback/reminder": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Enquiry", href: "/admin/dashboard/enquiry" },
        { label: "View Leads", href: "/admin/dashboard/enquiry/view-leads" },
        { label: "Itinerary", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view" },
        { label: "Booking Details", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details" },
        { label: "Progress", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress" },
        { label: "Feedback", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress/feedback" },
        { label: "Reminder", href: "/admin/dashboard/enquiry/view-leads/exist-Itenary-view/booking-details/progress/feedback/reminder", active: true },
      ],
      title: "Reminder",
      subtitle: "Set and manage reminders",
    },
    "/admin/dashboard/manage-subscription": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Manage Subscriptions", href: "/admin/dashboard/manage-subscription", active: true },
      ],
      title: "Manage Subscriptions",
      subtitle: "Add or manage subscription details",
    },
    "/admin/dashboard/add-managers": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Add Managers", href: "/admin/dashboard/add-managers", active: true },
      ],
      title: "Manage Users",
      subtitle: "Add or manage user details",
    },
    "/admin/dashboard/Manage-DMC": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Manage DMC", href: "/admin/dashboard/Manage-DMC", active: true },
      ],
      title: "Manage DMC Signups",
      subtitle: "View and manage DMC registrations",
    },
    "/admin/dashboard/profile": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Profile", href: "/admin/dashboard/profile", active: true },
      ],
      title: "Profile",
      subtitle: "View and edit your profile",
    },
    "/admin/dashboard/add-dmc": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Add DMC", href: "/admin/dashboard/add-dmc", active: true },
      ],
      title: "Manage DMC",
      subtitle: "Add or manage DMC details",
    },
    "/admin/dashboard/manage-agency": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Manage Agency", href: "/admin/dashboard/manage-agency", active: true },
      ],
      title: "Manage Agency Signups",
      subtitle: "View and manage agency registrations",
    },
    "/admin/dashboard/manage-DMC": {
      breadcrumbs: [
        { label: "Pages", href: "/admin" },
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Manage DMC", href: "/admin/dashboard/manage-DMC", active: true },
      ],
      title: "Manage DMC Signups",
      subtitle: "View and manage DMC registrations",
    },
    "/agency-admin/dashboard/add-users": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/agency/dashboard" },
        { label: "Add Users", href: "/agency-admin/dashboard/add-users", active: true },
      ],
      title: "Manage Users",
      subtitle: "Add or manage user details",
    },
    "/agency/dashboard/add-dmc": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/agency/dashboard" },
        { label: "Add DMC", href: "/agency/dashboard/add-dmc", active: true },
      ],
      title: "Manage DMC",
      subtitle: "Add or manage DMC details",
    },
    "/agency/dashboard/profile": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/agency/dashboard" },
        { label: "Profile", href: "/agency/dashboard/profile", active: true },
      ],
      title: "Profile",
      subtitle: "View and edit your profile",
    },
    "/agency/dashboard/enquiry": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/agency/dashboard" },
        { label: "Enquiry", href: "/agency/dashboard/enquiry", active: true },
      ],
      title: "Enquiries",
      subtitle: "Manage enquiries and followup",
    },
    "/agency/dashboard/enquiry/view-leads/exist-Itenary-view": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/agency/dashboard" },
        { label: "Enquiry", href: "/agency/dashboard/enquiry" },
        { label: "View Leads", href: "/agency/dashboard/enquiry/view-leads" },
        { label: "Itinerary", href: "/agency/dashboard/enquiry/view-leads/exist-Itenary-view", active: true },
      ],
      title: "Itineraries",
      subtitle: "View and Share",
    },
    "/agency/dashboard/enquiry/view-leads": {
      breadcrumbs: [
        { label: "Pages", href: "/agency" },
        { label: "Dashboard", href: "/agency/dashboard" },
        { label: "Enquiry", href: "/agency/dashboard/enquiry" },
        { label: "View Leads", href: "/agency/dashboard/enquiry/view-leads", active: true },
      ],
      title: "Manage Enquiries",
      subtitle: "View all enquiries",
    },
    
  }
  
export function getNavigationData(path: string) {
  // Try to find exact match first
  const exactMatch = navigationData[path]
  if (exactMatch) {
    return exactMatch
  }

  // If no exact match, find the closest parent path
  const pathSegments = path.split('/').filter(Boolean)
  let closestPath = ''

  // Build the path progressively to find the closest match
  for (let i = 0; i < pathSegments.length; i++) {
    const testPath = `/${pathSegments.slice(0, i + 1).join('/')}`
    if (navigationData[testPath]) {
      closestPath = testPath
    }
  }

  // Format the title from the last path segment
  const formatTitle = (str: string) => {
    if (!str) return 'Dashboard'
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const lastSegment = pathSegments[pathSegments.length - 1] || ''
  const title = formatTitle(lastSegment)

  if (closestPath) {
    const closestMatch = navigationData[closestPath]
    
    // If the path is just the dashboard, show a simpler breadcrumb
    if (pathSegments.length <= 2) { // Paths like /admin or /admin/dashboard
      return {
        breadcrumbs: [
          { label: 'Dashboard', href: '/admin/dashboard', active: true }
        ],
        title: 'Dashboard',
        subtitle: 'Overview and summary'
      }
    }

    return {
      breadcrumbs: [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { 
          label: title, 
          href: path,
          active: true 
        }
      ],
      title: title,
      subtitle: `${title} - Overview and management` // Updated subtitle to include page name
    }
  }

  // Default fallback for unknown paths
  return {
    breadcrumbs: [
      { label: 'Dashboard', href: '/agency-admin/dashboard' },
      { 
        label: title, 
        href: path,
        active: true 
      }
    ],
    title: title,
    subtitle: `${title} - Overview and management`
  }
}