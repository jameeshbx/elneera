// This is a mock database connection.
// In a real application, you would set up your actual database connection here,
// for example, using 'mysql2/promise' or another ORM/client.
interface MockQueryResult {
  // This interface can be generic or specific depending on the mock's needs.
  // For insert operations, it might contain insertId.
  insertId?: number
  // For select operations, it would contain the columns of the selected rows.
  // Since this is a generic mock, we keep it minimal.
  [key: string]: unknown // Changed from any to unknown for safer typing
}

interface MockDatabase {
  execute: <T extends MockQueryResult>(query: string, params?: unknown[]) => Promise<[T[], unknown]> // Changed any to unknown
}

export async function connectDB(): Promise<MockDatabase> {
  console.log("Connecting to mock database...")
  // Simulate a database connection
  return {
    execute: async <T extends MockQueryResult>(query: string, params?: unknown[]): Promise<[T[], unknown]> => {
      // Changed any to unknown
      console.log("Executing query:", query, params)
      // Simulate a successful insert operation
      if (query.includes("INSERT INTO")) {
        // Corrected: Wrap the single result object in an array
        return [[{ insertId: Math.floor(Math.random() * 1000) + 1 }] as T[], null]
      }
      // Simulate fetching data for SELECT queries
      // For a generic mock, returning an empty array is the safest default.
      // Consumers (like share-customer/route.ts) will need to cast this to their expected type.
      return [[] as T[], null]
    },
  }
}
