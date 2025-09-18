describe("DMC Registration Form", () => {
    beforeEach(() => {
      cy.visit("/dmc-registration")
    })
  
    it("should display the form correctly", () => {
      cy.contains("DMC name")
      cy.contains("Primary contact person")
      cy.contains("Phone number")
      cy.contains("Designation")
      cy.contains("GST Registration")
      cy.contains("Submit")
    })
  
    it("should allow filling out the form", () => {
      // Fill out basic information
      cy.get("#dmcName").type("Test DMC Company")
      cy.get("#primaryContact").type("John Doe")
      cy.get("#phoneNumber").type("9876543210")
      cy.get("#designation").type("Manager")
      cy.get("#ownerName").type("Jane Smith")
      cy.get("#ownerPhoneNumber").type("8765432109")
      cy.get("#email").type("test@example.com")
      cy.get("#website").type("www.testdmc.com")
  
      // Check radio buttons
      cy.get("#gst-yes").check()
      cy.get("#gstNo").should("be.enabled")
      cy.get("#gst-no").check()
      cy.get("#gstNo").should("be.disabled")
      cy.get("#gst-yes").check()
  
      // Fill out additional fields
      cy.get("#gstNo").type("GST12345678")
      cy.get("#yearOfRegistration").type("2020")
      cy.contains("Years").should("be.visible")
      cy.get("#panNo").type("ABCDE1234F")
      cy.get("#headquarters").type("Mumbai")
      cy.get("#yearOfExperience").type("5")
  
      // Test bank details modal
      cy.contains("Add bank details").click()
      cy.contains("Bank Name").should("be.visible")
      cy.contains("Cancel").click()
  
      // Submit the form
      cy.get('button[type="submit"]').click()
    })
  
    it("should validate required fields", () => {
      // Try to submit without filling required fields
      cy.get('button[type="submit"]').click()
  
      // Check for validation messages
      cy.get("#dmcName:invalid").should("exist")
      cy.get("#primaryContact:invalid").should("exist")
      cy.get("#phoneNumber:invalid").should("exist")
      cy.get("#email:invalid").should("exist")
    })
  
    it("should search and filter the DMC table", () => {
      // Search for a DMC
      cy.get('input[placeholder="Search for..."]').type("Euro")
      cy.contains("EuroVista Travels").should("be.visible")
      cy.contains("Asian Horizons").should("not.exist")
  
      // Clear search
      cy.get('input[placeholder="Search for..."]').clear()
  
      // Sort by name
      cy.get("button").contains("Sort by").click()
      cy.get('div[role="option"]').contains("Name").click()
  
      // Check for Join Source column
      cy.contains("Join Source").should("be.visible")
    })
  
    it("should handle dropdown menus correctly", () => {
      // Test country dropdown
      cy.contains("Primary country").parent().find("button").click()
      cy.get('div[role="option"]').contains("India").click()
  
      // Test destinations dropdown
      cy.contains("Destinations Covered").parent().find("button").click()
      cy.get('div[role="option"]').contains("Asia").click()
  
      // Test cities dropdown
      cy.contains("Cities").parent().find("button").click()
      cy.get('div[role="option"]').contains("Mumbai").click()
    })
  })
  