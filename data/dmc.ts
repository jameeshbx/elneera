export type DMCRequest = {
    id: string
    name: string
    phoneNumber: string
    email: string
    dmcName: string
    status: string
    requestStatus: string
    requestDate: string
  }
  
  export const dmcRequests: DMCRequest[] = [
    {
      id: "REQ-001",
      name: "John Doe",
      phoneNumber: "+1 (123) 456-7890",
      email: "john.doe@example.com",
      dmcName: "DMC Alpha",
      status: "Active",
      requestStatus: "Approved",
      requestDate: "2025-03-29",
    },
    {
      id: "REQ-002",
      name: "Jane Smith",
      phoneNumber: "+1 (987) 654-3210",
      email: "jane.smith@example.com",
      dmcName: "DMC Beta",
      status: "Inactive",
      requestStatus: "Pending",
      requestDate: "2025-04-01",
    },
    {
      id: "REQ-003",
      name: "Robert Jones",
      phoneNumber: "+1 (555) 123-4567",
      email: "robert.jones@example.com",
      dmcName: "DMC Gamma",
      status: "Active",
      requestStatus: "Rejected",
      requestDate: "2025-04-05",
    },
    {
      id: "REQ-004",
      name: "Emily White",
      phoneNumber: "+1 (111) 222-3333",
      email: "emily.white@example.com",
      dmcName: "DMC Delta",
      status: "Inactive",
      requestStatus: "Approved",
      requestDate: "2025-04-08",
    },
    {
      id: "REQ-005",
      name: "Michael Brown",
      phoneNumber: "+1 (444) 555-6666",
      email: "michael.brown@example.com",
      dmcName: "DMC Epsilon",
      status: "Active",
      requestStatus: "Pending",
      requestDate: "2025-04-10",
    },
    {
      id: "REQ-006",
      name: "Alice Green",
      phoneNumber: "+1 (777) 888-9999",
      email: "alice.green@example.com",
      dmcName: "DMC Zeta",
      status: "Inactive",
      requestStatus: "Rejected",
      requestDate: "2025-04-12",
    },
    {
      id: "REQ-007",
      name: "David Black",
      phoneNumber: "+1 (333) 444-5555",
      email: "david.black@example.com",
      dmcName: "DMC Eta",
      status: "Active",
      requestStatus: "Approved",
      requestDate: "2025-04-15",
    },
    {
      id: "REQ-008",
      name: "Linda Gray",
      phoneNumber: "+1 (666) 777-8888",
      email: "linda.gray@example.com",
      dmcName: "DMC Theta",
      status: "Inactive",
      requestStatus: "Pending",
      requestDate: "2025-04-18",
    },
    {
      id: "REQ-009",
      name: "Christopher Blue",
      phoneNumber: "+1 (222) 333-4444",
      email: "christopher.blue@example.com",
      dmcName: "DMC Iota",
      status: "Active",
      requestStatus: "Rejected",
      requestDate: "2025-04-20",
    },
    {
      id: "REQ-010",
      name: "Susan Red",
      phoneNumber: "+1 (888) 999-0000",
      email: "susan.red@example.com",
      dmcName: "DMC Kappa",
      status: "Inactive",
      requestStatus: "Approved",
      requestDate: "2025-04-22",
    },
    {
      id: "REQ-011",
      name: "Thomas Wilson",
      phoneNumber: "+1 (123) 987-6543",
      email: "thomas.wilson@example.com",
      dmcName: "DMC Lambda",
      status: "Active",
      requestStatus: "Pending",
      requestDate: "2025-04-25",
    },
    {
      id: "REQ-012",
      name: "Jennifer Lee",
      phoneNumber: "+1 (456) 789-0123",
      email: "jennifer.lee@example.com",
      dmcName: "DMC Mu",
      status: "Inactive",
      requestStatus: "Approved",
      requestDate: "2025-04-28",
    },
    {
      id: "REQ-013",
      name: "Richard Clark",
      phoneNumber: "+1 (789) 012-3456",
      email: "richard.clark@example.com",
      dmcName: "DMC Nu",
      status: "Active",
      requestStatus: "Rejected",
      requestDate: "2025-05-01",
    },
    {
      id: "REQ-014",
      name: "Patricia Adams",
      phoneNumber: "+1 (234) 567-8901",
      email: "patricia.adams@example.com",
      dmcName: "DMC Xi",
      status: "Inactive",
      requestStatus: "Pending",
      requestDate: "2025-05-05",
    },
    {
      id: "REQ-015",
      name: "Daniel Scott",
      phoneNumber: "+1 (567) 890-1234",
      email: "daniel.scott@example.com",
      dmcName: "DMC Omicron",
      status: "Active",
      requestStatus: "Approved",
      requestDate: "2025-05-08",
    },
    {
      id: "REQ-016",
      name: "Nancy King",
      phoneNumber: "+1 (890) 123-4567",
      email: "nancy.king@example.com",
      dmcName: "DMC Pi",
      status: "Inactive",
      requestStatus: "Rejected",
      requestDate: "2025-05-12",
    },
    {
      id: "REQ-017",
      name: "George Wright",
      phoneNumber: "+1 (345) 678-9012",
      email: "george.wright@example.com",
      dmcName: "DMC Rho",
      status: "Active",
      requestStatus: "Pending",
      requestDate: "2025-05-15",
    },
    {
      id: "REQ-018",
      name: "Karen Hall",
      phoneNumber: "+1 (678) 901-2345",
      email: "karen.hall@example.com",
      dmcName: "DMC Sigma",
      status: "Inactive",
      requestStatus: "Approved",
      requestDate: "2025-05-18",
    },
    {
      id: "REQ-019",
      name: "Steven Young",
      phoneNumber: "+1 (901) 234-5678",
      email: "steven.young@example.com",
      dmcName: "DMC Tau",
      status: "Active",
      requestStatus: "Rejected",
      requestDate: "2025-05-22",
    },
    {
      id: "REQ-020",
      name: "Lisa Allen",
      phoneNumber: "+1 (234) 567-8901",
      email: "lisa.allen@example.com",
      dmcName: "DMC Upsilon",
      status: "Inactive",
      requestStatus: "Pending",
      requestDate: "2025-05-25",
    }
  ]
  
  export function getStatusColor(status: string): string {
    switch (status) {
      case "Active":
        return "bg-green-800 text-white"
      case "Inactive":
        return "bg-gray-200 text-gray-800"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }
  
  export function getRequestStatusColor(status: string): string {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  export function getEmailHighlight(email: string): string {
    // Example logic: wrap email in strong tag
    return `<strong>${email}</strong>`;
  }
  