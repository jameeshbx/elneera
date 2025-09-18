describe("Travel Features Page", () => {
    beforeEach(() => {
      cy.visit("/")
    })
  
    it("displays the main heading", () => {
      cy.contains("h1", "Smart Features for Effortless Travel").should("be.visible")
      cy.contains("Plan, book, and manage with ease—all in one place.").should("be.visible")
    })
  
    it("displays all feature cards", () => {
      // Check all card titles are visible
      cy.contains("Connect with partners, compare prices, and finalize deals.").should("be.visible")
      cy.contains("DMC & Supplier Integration").should("be.visible")
      cy.contains("Automated Notifications").should("be.visible")
      cy.contains("Get real-time updates on itinerary status and payments.").should("be.visible")
      cy.contains("Accept global payments with real-time exchange rates.").should("be.visible")
      cy.contains("Forex Support").should("be.visible")
      cy.contains("24/7 Support & Assistance").should("be.visible")
      cy.contains("Dedicated help for seamless operations.").should("be.visible")
    })
  
    it("has the correct number of cards", () => {
      // There should be 8 cards in total
      cy.get(".rounded-3xl").should("have.length", 8)
    })
  
    it("has arrow icons in the appropriate cards", () => {
      // Count the number of arrow icons
      cy.get(".rounded-full").should("have.length", 4)
    })
  
    it("is responsive", () => {
      // Test on mobile viewport
      cy.viewport("iphone-6")
      cy.contains("h1", "Smart Features for Effortless Travel").should("be.visible")
      cy.get(".rounded-3xl").should("have.length", 8)
  
      // Test on tablet viewport
      cy.viewport("ipad-2")
      cy.contains("h1", "Smart Features for Effortless Travel").should("be.visible")
      cy.get(".rounded-3xl").should("have.length", 8)
  
      // Test on desktop viewport
      cy.viewport(1920, 1080)
      cy.contains("h1", "Smart Features for Effortless Travel").should("be.visible")
      cy.get(".rounded-3xl").should("have.length", 8)
    })
  })
  
  