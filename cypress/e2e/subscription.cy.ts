describe("Subscription Table", () => {
    beforeEach(() => {
      cy.visit("/manage-subscription")
    })
  
    it("should display the subscription table with correct columns", () => {
      // Check table headers
      cy.get("table thead tr")
        .first()
        .within(() => {
          cy.get("th").should("have.length", 12)
          cy.get("th").eq(1).should("contain", "Subscription ID")
          cy.get("th").eq(2).should("contain", "Agency/DMC")
          cy.get("th").eq(3).should("contain", "Contact Name")
          cy.get("th").eq(4).should("contain", "Phone no.")
          cy.get("th").eq(5).should("contain", "Email")
          cy.get("th").eq(6).should("contain", "Plan")
          cy.get("th").eq(7).should("contain", "Payment Status")
          cy.get("th").eq(8).should("contain", "Subscription status")
          cy.get("th").eq(9).should("contain", "Trial Status")
          cy.get("th").eq(10).should("contain", "Trial Start date")
        })
  
      // Check table data
      cy.get("table tbody tr").should("have.length.at.least", 1)
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get("td").should("have.length", 12)
        })
    })
  
    it("should filter subscriptions by search term", () => {
      // Search for a specific subscription ID
      cy.get("#search-input").type("SUB012")
      cy.get("table tbody tr").should("have.length", 1)
      cy.get("table tbody tr").first().should("contain", "SUB012")
  
      // Clear search and check all subscriptions are displayed
      cy.get("#search-input").clear()
      cy.get("table tbody tr").should("have.length.at.least", 8)
    })
  
    it("should filter subscriptions by payment status", () => {
      // Open payment status filter
      cy.contains("Payment Status").click()
  
      // Uncheck all statuses except Paid
      cy.get("#pending").uncheck()
      cy.get("#failed").uncheck()
  
      // Apply filter
      cy.contains("button", "Apply").click()
  
      // Check only Paid subscriptions are displayed
      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).should("contain", "Paid")
      })
    })
  
    it("should open and close the date range picker", () => {
      // Open date picker
      cy.get("button").contains("28 Mar - 10 Apr").click()
  
      // Calendar should be visible
      cy.get(".react-calendar").should("be.visible")
  
      // Select a date range
      cy.get(".react-calendar__tile").contains("15").click()
      cy.get(".react-calendar__tile").contains("20").click()
  
      // Apply date range
      cy.contains("button", "Apply").click()
  
      // Calendar should be closed
      cy.get(".react-calendar").should("not.exist")
    })
  
    it("should sort subscriptions", () => {
      // Open sort dropdown
      cy.contains("Sort by").click()
  
      // Sort by name
      cy.contains("Name").click()
  
      // Check sorting is applied
      cy.get("table tbody tr").should("have.length.at.least", 1)
    })
  
    it("should paginate through subscriptions", () => {
      // Check pagination controls exist
      cy.get('button[aria-label="Next page"]').should("exist")
      cy.get('button[aria-label="Previous page"]').should("exist")
  
      // Go to next page
      cy.get('button[aria-label="Next page"]').click()
  
      // Check page number is updated
      cy.get('button[aria-label="Current page"]').should("contain", "2")
  
      // Go back to first page
      cy.get('button[aria-label="First page"]').click()
  
      // Check page number is updated
      cy.get('button[aria-label="Current page"]').should("contain", "1")
    })
  
    it("should show subscription details in dropdown menu", () => {
      // Click on the three dots menu
      cy.get("button").find(".lucide-more-vertical").first().click()
  
      // Check dropdown menu items
      cy.contains("View Details").should("exist")
      cy.contains("Edit").should("exist")
      cy.contains("Delete").should("exist")
      cy.contains("Data captured on").should("exist")
    })
  
    it("should be responsive on mobile devices", () => {
      // Set viewport to mobile size
      cy.viewport("iphone-6")
  
      // Check mobile view is displayed
      cy.get("table thead tr th").should("have.length", 5)
      cy.get("table thead tr th").eq(1).should("contain", "Subscription ID")
      cy.get("table thead tr th").eq(2).should("contain", "Name")
      cy.get("table thead tr th").eq(3).should("contain", "Payment Status")
    })
  })
  