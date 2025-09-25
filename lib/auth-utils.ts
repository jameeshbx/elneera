import { UserRole, UserType } from "@/types/next-auth";


export function getRoleBasedPath(role: UserRole, userType?: UserType): string {
  console.log('🔄 Getting role-based path for:', { role, userType });

  // First check if we have a userType and use that for more specific routing
  if (userType) {
    switch (userType.toUpperCase()) {
      case 'SUPER_ADMIN':
        return '/super-admin/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      case 'AGENCY_ADMIN':
        return '/agency-admin/dashboard';
      case 'MANAGER':
        return '/agency/dashboard';
      case 'EXECUTIVE':
        return '/executive/dashboard';
      case 'TEAM_LEAD':
        return '/teamlead/dashboard';
      case 'TL':
        return '/telecaller/dashboard';
      case 'AGENT_USER':
        return '/agent/dashboard';
    }
  }
  switch (role) {
    
    case 'SUPER_ADMIN':
      return '/super-admin/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
    case 'AGENCY_ADMIN':
      return '/agency-admin/dashboard';
    
   
    case 'MANAGER':
      return '/agency/dashboard';
    case 'EXECUTIVE':
      return '/executive/dashboard';
    case 'TEAM_LEAD':
      return '/teamlead/dashboard';
      case 'TL':
        return '/telecaller/dashboard';
      case 'AGENT_USER':
      default:
        return '/dashboard';
    }
  }
  
  export function getUserRoleFromType(userType: string): UserRole {
    switch (userType) {
      case 'MANAGER':
        return 'MANAGER';
      case 'EXECUTIVE':
        return 'EXECUTIVE';
      case 'TEAM_LEAD':
      case 'TL':
        return 'TEAM_LEAD';
      default:
        return 'AGENT_USER';
    }
  }
  
  export function isAuthorizedForRoute(userRole: UserRole, routePath: string): boolean {
    const allowedPaths = getAllowedPathsForRole(userRole);
    return allowedPaths.some(path => routePath.startsWith(path));
  }
  
  export function getAllowedPathsForRole(role: UserRole): string[] {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          '/super-admin',
          '/admin',
          '/agency-admin',
          '/agency-manager',
          '/agency-executive',
          '/agency-team-lead',
          '/agency-user'
        ];
  
      case 'ADMIN':
        return [
          '/admin',
          '/agency-admin',
          '/agency-manager',
          '/agency-executive',
          '/agency-team-lead',
          '/agency-user'
        ];
  
      case 'AGENT_ADMIN':
      case 'AGENCY_ADMIN':
        return [
          '/agency-admin',
          '/agency-manager',
          '/agency-executive',
          '/agency-team-lead',
          '/agency-user'
        ];
  
      case 'MANAGER':
        return [
          '/agency-manager',
          '/agency-executive',
          '/agency-team-lead',
          '/agency-user'
        ];
  
      case 'EXECUTIVE':
        return [
          '/agency-executive',
          '/agency-user'
        ];
  
      case 'TEAM_LEAD':
      case 'TL':
        return [
          '/agency-team-lead',
          '/agency-user'
        ];
  
      case 'AGENT_USER':
    default:

      return ['/agency-user'];
    }
  }
  
  // Helper function to redirect users based on their role after login
  export function getPostLoginRedirect(role: UserRole, userType?: UserType,
     agencyFormSubmitted?: boolean): string {
    // Special case for AGENCY_ADMIN who haven't submitted agency form
    if ((role === 'AGENT_ADMIN' || role === 'AGENCY_ADMIN') && agencyFormSubmitted === false) {
      return '/agency-admin/agency-form';
    }

return getRoleBasedPath(role, userType);
}