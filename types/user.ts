export const USER_TYPES = ["USER", "AGENCY_ADMIN", "TEAM_LEAD", "ADMIN", "SUPER_ADMIN"] as const;
export type UserType = typeof USER_TYPES[number];

export function isUserType(userType: any): userType is UserType {
  return USER_TYPES.includes(userType);
}
