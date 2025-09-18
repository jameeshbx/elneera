describe("TopBar Component", () => {
    beforeEach(() => {
      // Visit the dashboard page before each test
      cy.visit("/admin/dashboard")
    })
  
    it("should display the correct breadcrumbs", () => {
      // Check if breadcrumbs are displayed correctly
      cy.get('[role="navigation"]').within(() => {
        cy.contains("Pages").should("be.visible")
        cy.contains("Dashboard").should("be.visible")
      })
    })
  
    it("should have a working search input", () => {
      // Test the search input
      cy.get('input[placeholder="Type here..."]')
        .should("be.visible")
        .type("test search")
        .should("have.value", "test search")
    })
  
    it("should display the correct title and subtitle", () => {
      // Check if title and subtitle are displayed correctly
      cy.contains("h1", "Manage Users").should("be.visible")
      cy.contains("p", "Add or manage details").should("be.visible")
    })
  
    it("should be responsive", () => {
      // Test on mobile viewport
      cy.viewport("iphone-6")
      cy.get('[role="navigation"]').should("be.visible")
      cy.get('input[placeholder="Type here..."]').should("be.visible")
  
      // Test on tablet viewport
      cy.viewport("ipad-2")
      cy.get('[role="navigation"]').should("be.visible")
      cy.get('input[placeholder="Type here..."]').should("be.visible")
  
      // Test on desktop viewport
      cy.viewport(1280, 720)
      cy.get('[role="navigation"]').should("be.visible")
      cy.get('input[placeholder="Type here..."]').should("be.visible")
    })
  
    it("should navigate when breadcrumb links are clicked", () => {
      // Click on the "Pages" breadcrumb and check navigation
      cy.contains("Pages").click()
      cy.url().should("include", "/")
  
      // Navigate back to dashboard
      cy.visit("/dashboard")
  
      // Verify we're back at dashboard
      cy.contains("h1", "Manage Users").should("be.visible")
    })
  })
  