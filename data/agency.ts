export type AgencyRequest = {
  id: string
  name: string
  email: string
  phoneNumber: string
  AgencyName: string
  status: "Active" | "Inactive"
  requestType: "Approved" | "Pending" | "Rejected"
  requestDate?: string
}

export const agencyData: AgencyRequest[] = [
  {
    id: "REQ-001",
    name: "John Doe",
    email: "john@example.com",
    phoneNumber: "+1 234 567 890",
    AgencyName: "ABC Agency",
    status: "Active",
    requestType: "Approved",
    requestDate: "2025-04-01T10:30:00Z",
  },
  {
    id: "REQ-002",
    name: "Jane Smith",
    email: "jane@example.com",
    phoneNumber: "+1 234 567 891",
    AgencyName: "XYZ Agency",
    status: "Active",
    requestType: "Pending",
    requestDate: "2025-04-02T11:30:00Z",
  },
  {
    id: "REQ-003",
    name: "Alice Johnson",
    email: "alice@example.com",
    phoneNumber: "+1 234 567 892",
    AgencyName: "123 Agency",
    status: "Inactive",
    requestType: "Rejected",
    requestDate: "2025-04-03T12:30:00Z",
  },
  {
    id: "REQ-004",
    name: "Bob Brown",
    email: "bob@example.com",
    phoneNumber: "+1 234 567 893",
    AgencyName: "DEF Agency",
    status: "Active",
    requestType: "Approved",
    requestDate: "2025-04-04T13:30:00Z",
  },
  {
    id: "REQ-005",
    name: "Charlie Davis",
    email: "charlie@example.com",
    phoneNumber: "+1 234 567 894",
    AgencyName: "GHI Agency",
    status: "Inactive",
    requestType: "Pending",
    requestDate: "2025-04-05T14:30:00Z",
  },
  {
    id: "REQ-006",
    name: "David Wilson",
    email: "david@example.com",
    phoneNumber: "+1 234 567 895",
    AgencyName: "JKL Agency",
    status: "Active",
    requestType: "Approved",
    requestDate: "2025-04-06T15:30:00Z",
  },
  {
    id: "REQ-007",
    name: "Eve Taylor",
    email: "eve@example.com",
    phoneNumber: "+1 234 567 896",
    AgencyName: "MNO Agency",
    status: "Active",
    requestType: "Rejected",
    requestDate: "2025-04-07T16:30:00Z",
  },
  {
    id: "REQ-008",
    name: "Frank Miller",
    email: "frank@example.com",
    phoneNumber: "+1 234 567 897",
    AgencyName: "PQR Agency",
    status: "Inactive",
    requestType: "Pending",
    requestDate: "2025-04-08T17:30:00Z",
  },
  {
    id: "REQ-009",
    name: "Grace Lee",
    email: "grace@example.com",
    phoneNumber: "+1 234 567 898",
    AgencyName: "STU Agency",
    status: "Active",
    requestType: "Approved",
    requestDate: "2025-04-09T18:30:00Z",
  },
  {
    id: "REQ-010",
    name: "Henry Clark",
    email: "henry@example.com",
    phoneNumber: "+1 234 567 899",
    AgencyName: "VWX Agency",
    status: "Active",
    requestType: "Pending",
    requestDate: "2025-04-10T19:30:00Z",
  },
]

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-emerald-50 text-emerald-600"
    case "inactive":
      return "bg-red-50 text-red-600"
    default:
      return "bg-gray-50 text-gray-600"
  }
}

export function getEmailHighlight(email: string) {
  if (email.includes("example.com")) {
    return "bg-blue-50"
  }
  return ""
}

export const getRequestTypeColor = (type: string) => {
  switch (type?.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-600"
    case "PENDING":
      return "bg-yellow-50 text-yellow-600"
    case "REJECTED":
      return "bg-red-50 text-red-600"
    default:
      return "bg-gray-50 text-gray-600"
  }
}

export const getRequestTypeDotColor = (type: string) => {
  switch (type?.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-600"
    case "PENDING":
      return "bg-yellow-600"
    case "REJECTED":
      return "bg-red-600"
    default:
      return "bg-gray-600"
  }
}
