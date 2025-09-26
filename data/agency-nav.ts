export interface BreadcrumbItem {
    label: string
    href: string
    active?: boolean
  }
  
  export interface NavigationData {
    breadcrumbs: BreadcrumbItem[]
    title: string
    subtitle?: string
  }
  
  export function getNavigationData(pathname: string): NavigationData {
    // Define route mappings
    const routeData: Record<string, NavigationData> = {
      // Dashboard routes
      '/agency-admin/dashboard': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Dashboard', href: '/agency-admin/dashboard', active: true }
        ],
        title: 'Dashboard',
        subtitle: 'Welcome to your agency dashboard'
      },
      '/agency-admin/dashboard/profile': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Profile', href: '/agency-admin/dashboard/profile', active: true }
        ],
        title: 'Profile Management',
        subtitle: 'Manage your agency profile and settings'
      },
      // Agency form routes
      '/agency-form': {
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Agency Registration', href: '/agency-form', active: true }
        ],
        title: 'Agency Registration',
        subtitle: 'Complete your agency registration'
      },
      // Bookings routes
      '/agency-admin/dashboard/bookings': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Bookings', href: '/agency-admin/dashboard/bookings', active: true }
        ],
        title: 'Bookings Management',
        subtitle: 'View and manage all bookings'
      },
      '/agency-admin/dashboard/bookings/create': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Bookings', href: '/agency-admin/dashboard/bookings' },
          { label: 'Create Booking', href: '/agency-admin/dashboard/bookings/create', active: true }
        ],
        title: 'Create New Booking',
        subtitle: 'Add a new booking to the system'
      },
      // Customers routes
      '/agency-admin/dashboard/customers': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Customers', href: '/agency-admin/dashboard/customers', active: true }
        ],
        title: 'Customer Management',
        subtitle: 'View and manage customer information'
      },
      '/agency-admin/dashboard/customers/create': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Customers', href: '/agency-admin/dashboard/customers' },
          { label: 'Add Customer', href: '/agency-admin/dashboard/customers/create', active: true }
        ],
        title: 'Add New Customer',
        subtitle: 'Create a new customer profile'
      },
      // Packages routes
      '/agency-admin/dashboard/packages': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Packages', href: '/agency-admin/dashboard/packages', active: true }
        ],
        title: 'Package Management',
        subtitle: 'Manage travel packages and tours'
      },
      '/agency-admin/dashboard/packages/create': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Packages', href: '/agency-admin/dashboard/packages' },
          { label: 'Create Package', href: '/agency-admin/dashboard/packages/create', active: true }
        ],
        title: 'Create New Package',
        subtitle: 'Design a new travel package'
      },
      // Settings routes
      '/agency-admin/dashboard/settings': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Settings', href: '/agency-admin/dashboard/settings', active: true }
        ],
        title: 'Settings',
        subtitle: 'Configure your agency settings'
      },
      '/agency-admin/dashboard/settings/billing': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Settings', href: '/agency-admin/dashboard/settings' },
          { label: 'Billing', href: '/agency-admin/dashboard/settings/billing', active: true }
        ],
        title: 'Billing Settings',
        subtitle: 'Manage billing and payment settings'
      },
      // Reports routes
      '/agency-admin/dashboard/reports': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Reports', href: '/agency-admin/dashboard/reports', active: true }
        ],
        title: 'Reports & Analytics',
        subtitle: 'View detailed reports and analytics'
      },
      // Team routes
      '/agency-admin/dashboard/team': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Team', href: '/agency-admin/dashboard/team', active: true }
        ],
        title: 'Team Management',
        subtitle: 'Manage your team members and permissions'
      },
      '/agency-admin/dashboard/team/invite': {
        breadcrumbs: [
          { label: 'Home', href: '/agency-admin/dashboard' },
          { label: 'Team', href: '/agency-admin/dashboard/team' },
          { label: 'Invite Member', href: '/agency-admin/dashboard/team/invite', active: true }
        ],
        title: 'Invite Team Member',
        subtitle: 'Send an invitation to join your team'
      }
    }
  
    // Try exact match first
    if (routeData[pathname]) {
      return routeData[pathname]
    }
  
    // Handle dynamic routes with parameters
    for (const [route, data] of Object.entries(routeData)) {
      if (pathname.startsWith(route) && route !== '/') {
        // For routes like /customers/[id], /packages/[id]/edit, etc.
        const segments = pathname.split('/').filter(Boolean)
        const routeSegments = route.split('/').filter(Boolean)
        
        if (segments.length > routeSegments.length) {
          // This might be a dynamic route, return the base route data
          return data
        }
      }
    }
  
    // Fallback for unmatched routes
    return {
      breadcrumbs: [
        { label: 'Home', href: '/agency-admin/dashboard' },
        { label: 'Page', href: pathname, active: true }
      ],
      title: 'Page',
      subtitle: 'Navigate through your agency portal'
    }
  }