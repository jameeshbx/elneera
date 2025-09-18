describe("Forgot Password Page", () => {
    beforeEach(() => {
      cy.visit("/forgot-password")
    })
  
    it("should display the forgot password form correctly", () => {
      // Check if the logo is visible
      cy.get('[data-cy="logo"]').should("be.visible")
  
      // Check if the title is correct
      cy.get('[data-cy="reset-title"]').should("contain", "Reset Your Password")
  
      // Check if the form elements are present
      cy.get('[data-cy="reset-form"]').should("be.visible")
      cy.get('[data-cy="email-input"]').should("be.visible")
      cy.get('[data-cy="reset-button"]').should("be.visible")
      cy.get('[data-cy="back-link"]').should("be.visible")
    })
  
    it("should validate email input", () => {
      // Try submitting without an email
      cy.get('[data-cy="email-input"]').clear()
      cy.get('[data-cy="reset-button"]').click()
  
      // HTML5 validation should prevent submission
      cy.get('[data-cy="success-message"]').should("not.exist")
  
      // Try with invalid email
      cy.get('[data-cy="email-input"]').type("invalid-email")
      cy.get('[data-cy="reset-button"]').click()
  
      // HTML5 validation should prevent submission
      cy.get('[data-cy="success-message"]').should("not.exist")
    })
  
    it("should submit the form and show success message", () => {
      // Enter valid email and submit
      cy.get('[data-cy="email-input"]').type("test@example.com")
      cy.get('[data-cy="reset-button"]').click()
  
      // Button should show loading state
      cy.get('[data-cy="reset-button"]').should("be.disabled")
  
      // Wait for the success message (after the 1.5s timeout in the component)
      cy.get('[data-cy="success-message"]', { timeout: 2000 }).should("be.visible")
      cy.get('[data-cy="success-message"]').should("contain", "Password reset link has been sent")
  
      // Form should no longer be visible
      cy.get('[data-cy="reset-form"]').should("not.exist")
    })
  
    it("should navigate back to login page", () => {
      cy.get('[data-cy="back-link"]').click()
      cy.url().should("include", "/login")
    })
  
    it("should be responsive on different screen sizes", () => {
      // Test on mobile
      cy.viewport("iphone-6")
      cy.get('[data-cy="reset-title"]').should("be.visible")
      cy.get('[data-cy="email-input"]').should("be.visible")
  
      // Test on tablet
      cy.viewport("ipad-2")
      cy.get('[data-cy="reset-title"]').should("be.visible")
      cy.get('[data-cy="email-input"]').should("be.visible")
  
      // Test on desktop
      cy.viewport(1280, 800)
      cy.get('[data-cy="reset-title"]').should("be.visible")
      cy.get('[data-cy="email-input"]').should("be.visible")
    })
  })
  
  