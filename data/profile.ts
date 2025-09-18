
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
   
  }
  
  export const profileData: ProfileData = {
    name: "Super Admin",
    email: "superadmin@sample.com",
    bio: "Hi, I'm Alec Thompson. Decisions: If you can't decide, the answer is no. If two equally difficult paths, choose the one more painful in the short term (pain avoidance is creating an illusion of equality).",
    fullName: "Alec M. Thompson",
    mobile: "(44) 123 1234 123",
    location: "United States",
    avatarUrl: "/avatar/Credits to Unsplash.com.png",
    socialMedia: {
      facebook: "#",
      twitter: "#",
      instagram: "#",
    },
  }
  
  export const accountData: AccountData = {
    username: "Alec M. Thompson",
    password: "password123",
    role: "Superadmin",
    location: "India",
    status: "Active",
    lastLoggedIn: "11:30 am",
  }
  
  export const teamMembers: TeamMember[] = [
    {
      id: "ADMIN1",
      name: "ADMIN1",
      lastLoggedIn: "09:20 am",
      avatarColor: "bg-blue-100",
      avatarUrl: "/avatar/Credits to Unsplash.com (1).png",
    },
    {
      id: "ADMIN2",
      name: "ADMIN2",
      lastLoggedIn: "09:20 am",
      avatarColor: "bg-orange-100",
      avatarUrl: "/avatar/Credits to Unsplash.com (2).png",
    },
    {
      id: "ADMIN3",
      name: "ADMIN3",
      lastLoggedIn: "09:20 am",
      avatarColor: "bg-green-100",
      avatarUrl: "/avatar/Credits to Unsplash.com (3).png",
    },
  ]
  
  export const commentData: Comment = {
    author: "Super Admin",
    authorAvatar: "/avatar/Credits to Unsplash.com.png",

  }