export interface Manager {
    userId: string
    name: string
    phone: string
    email: string
    username: string
    password: string
    status: "Active" | "Inactive"
  }
  
  export const managers: Manager[] = [
    {
      userId: "adminA3",
      name: "Admin 3",
      phone: "+1-678-901-2345",
      email: "tbarry@example.com",
      username: "Admin123",
      password: "password123",
      status: "Active",
    },
    {
      userId: "adminA2",
      name: "Admin 2",
      phone: "+1-678-901-2345",
      email: "tbarry@example.com",
      username: "Admin123",
      password: "password123",
      status: "Inactive",
    },
    {
      userId: "adminA1",
      name: "Admin 1",
      phone: "+1-678-901-2345",
      email: "tbarry@example.com",
      username: "Admin123",
      password: "password123",
      status: "Active",
    },
    {
      userId: "adminA4",
      name: "Admin 4",
      phone: "+1-678-901-2345",
      email: "jsmith@example.com",
      username: "Admin456",
      password: "password456",
      status: "Active",
    },
    {
      userId: "adminA5",
      name: "Admin 5",
      phone: "+1-678-901-2345",
      email: "mjohnson@example.com",
      username: "Admin789",
      password: "password789",
      status: "Inactive",
    },
    {
      userId: "adminA6",
      name: "Admin 6",
      phone: "+1-678-901-2345",
      email: "rwilliams@example.com",
      username: "AdminABC",
      password: "passwordABC",
      status: "Active",
    },
  ]
  