export interface ProfileData {
    name: string
    email: string
    bio: string
    fullName: string
    mobile: string
    location: string
    avatarUrl: string
    socialMedia: {
      facebook: string
      twitter: string
      instagram: string
    }
  }
  
  export interface AccountData {
    username: string
    password: string
    role: string
    location: string
    status: string
    lastLoggedIn: string
  }
  
  export interface TeamMember {
    id: string
    name: string
    lastLoggedIn: string
    avatarColor: string
    avatarUrl: string
  }
  
  export interface Comment {
    author: string
    authorAvatar: string
    text?: string
    timestamp?: string
  }
  
  export interface CompanyInformation {
    name: string
    gstRegistration: string
    gstNo: string
    ownerName: string
    mobile: string
    email: string
    website: string
    logo: string
    landingPageSkin: string
    country: string
    businessLicense: string
    yearOfRegistration: string
    panNo: string
    panType: string
    headquarters: string
    yearsOfOperation: string
  }
  
  export const profileData: ProfileData = {
    name: "Lisa Ray",
    email: "superadmin@sample.com",
    bio: "Hi, I'm Alec Thompson. Decisions: If you can't decide, the answer is no. If two equally difficult paths, choose the one more painful in the short term (pain avoidance is creating an illusion of equality).",
    fullName: "Alec M. Thompson",
    mobile: "(44) 123 1234 123",
    location: "United States",
    avatarUrl: "/avatar/Image (3).png",
    socialMedia: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
    },
  }
  
  export const accountData: AccountData = {
    username: "Alec M. Thompson",
    password: "••••••••",
    role: "Superadmin",
    location: "India",
    status: "Active",
    lastLoggedIn: "11:30 am",
  }
  
  export const teamMembers: TeamMember[] = [
    {
      id: "MANAGER1",
      name: "MANAGER1",
      lastLoggedIn: "09:20 am",
      avatarColor: "bg-blue-100",
      avatarUrl: "/avatar/Credits to Unsplash.com (1).png",
    },
    {
      id: "MANAGER2",
      name: "MANAGER2",
      lastLoggedIn: "09:20 am",
      avatarColor: "bg-orange-100",
      avatarUrl: "/avatar/Credits to Unsplash.com (2).png",
    },
    {
      id: "MANAGER3",
      name: "MANAGER3",
      lastLoggedIn: "09:20 am",
      avatarColor: "bg-green-100",
      avatarUrl: "/avatar/Credits to Unsplash.com (3).png",
    },
  ]
  
  export const commentData: Comment = {
    author: "Lisa Ray",
    authorAvatar: "/avatar/Image (3).png",
    text: "",
    timestamp: "Just now",
  }
  
  export const companyInformation: CompanyInformation = {
    name: "ExploreX Travels",
    gstRegistration: "Yes",
    gstNo: "3429430",
    ownerName: "Alec M. Thompson",
    mobile: "(44) 123 1234 123",
    email: "alecthompson@mail.com",
    website: "website.in",
    logo: "/avatar/image 5.png",
    landingPageSkin: "#0F9D58",
    country: "Australia",
    businessLicense: "#",
    yearOfRegistration: "2007",
    panNo: "5252525",
    panType: "Company",
    headquarters: "123 xyz near abc",
    yearsOfOperation: "16 years",
  }
  