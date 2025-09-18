describe("Hero Section", () => {
    beforeEach(() => {
      cy.visit("/"); // Visit the landing page
    });
  
    it("should display the hero section with correct elements", () => {
      // Check if the hero section exists
      cy.get("section").should("have.class", "relative min-h-[80vh] md:min-h-screen");
  
      // Check if the heading is visible
      cy.contains("Your Travel Agency's").should("be.visible");
  
      // Check if the description text is visible
      cy.contains("Smart Tools for Smarter Agencies").should("be.visible");
  
      // Check if the button is visible and clickable
      cy.contains("Start 14 Days Trial").should("be.visible").click();
    });
  
    it("should have a background image", () => {
      // Check if the background pattern image exists
      cy.get("img[alt='Background pattern']").should("exist");
    });
  
    it("should have a properly visible dashboard image", () => {
      // Check if the dashboard image exists
      cy.get("img[alt='Travel agency dashboard']").should("be.visible");
    });
  
    it("should redirect on clicking the button", () => {
      // Simulate button click and check if it triggers navigation (adjust based on actual behavior)
      cy.contains("Start 14 Days Trial").click();
      cy.url().should("include", "/signup"); // Change this based on actual redirection
    });
  });
  