export interface User {
    userId: string
    name: string
    phone: string
    email: string
    username: string
    password: string
    status: "Active" | "Inactive"
  }
  
  export const users: User[] = [
    {
      userId: "staffA3",
      name: "Staff 3",
      phone: "+1-678-901-2345",
      email: "tbarry@example.com",
      username: "Staff123",
      password: "password123",
      status: "Active",
    },
    {
      userId: "staffA2",
      name: "Staff 2",
      phone: "+1-678-901-2345",
      email: "tbarry@example.com",
      username: "Staff123",
      password: "password123",
      status: "Inactive",
    },
    {
      userId: "staffA1",
      name: "Staff 1",
      phone: "+1-678-901-2345",
      email: "tbarry@example.com",
      username: "Staff123",
      password: "password123",
      status: "Active",
    },
    {
      userId: "staffA4",
      name: "Staff 4",
      phone: "+1-678-901-2345",
      email: "jsmith@example.com",
      username: "Staff456",
      password: "password456",
      status: "Active",
    },
    {
      userId: "staffA5",
      name: "Staff 5",
      phone: "+1-678-901-2345",
      email: "mjohnson@example.com",
      username: "Staff789",
      password: "password789",
      status: "Inactive",
    },
    {
      userId: "staffA6",
      name: "Staff 6",
      phone: "+1-678-901-2345",
      email: "rwilliams@example.com",
      username: "StaffABC",
      password: "passwordABC",
      status: "Active",
    },
  ]
  