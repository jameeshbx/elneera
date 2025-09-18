describe("Navbar", () => {
    beforeEach(() => {
      cy.visit("/")
    })
  
    it("should display the logo", () => {
      cy.get('[data-cy="navbar-logo"]').should("be.visible")
    })
  
    it("should display the logo in mobile view", () => {
      // Use a viewport size that represents mobile
      cy.viewport(375, 667)
      cy.get('[data-cy="navbar-logo"]').should("be.visible")
    })
  
    it("should display navigation links on desktop", () => {
      // Use a viewport size that represents desktop
      cy.viewport(1024, 768)
  
      cy.get('[data-cy="nav-about"]').should("be.visible")
      cy.get('[data-cy="nav-testimonial"]').should("be.visible")
      cy.get('[data-cy="nav-pricing"]').should("be.visible")
      cy.get('[data-cy="nav-login"]').should("be.visible")
      cy.get('[data-cy="nav-signup"]').should("be.visible")
    })
  
    it("should display mobile menu button on mobile", () => {
      // Use a viewport size that represents mobile
      cy.viewport(375, 667)
  
      cy.get('[data-cy="mobile-menu-button"]').should("be.visible")
      cy.get('[data-cy="nav-about"]').should("not.be.visible")
    })
  
    it("should open centered mobile menu when button is clicked", () => {
      // Use a viewport size that represents mobile
      cy.viewport(375, 667)
  
      cy.get('[data-cy="mobile-menu-button"]').click()
      cy.get('[data-cy="mobile-nav-about"]').should("be.visible")
      cy.get('[data-cy="mobile-nav-testimonial"]').should("be.visible")
      cy.get('[data-cy="mobile-nav-pricing"]').should("be.visible")
      cy.get('[data-cy="mobile-nav-login"]').should("be.visible")
      cy.get('[data-cy="mobile-nav-signup"]').should("be.visible")
    })
  
    it("should navigate to about page when About link is clicked", () => {
      cy.viewport(1024, 768)
      cy.get('[data-cy="nav-about"]').click()
      cy.url().should("include", "/about")
    })
  
    it("should navigate to login page when Login button is clicked", () => {
      cy.viewport(1024, 768)
      cy.get('[data-cy="nav-login"]').click()
      cy.url().should("include", "/login")
    })
  
    it("should navigate to signup page when Sign up button is clicked", () => {
      cy.viewport(1024, 768)
      cy.get('[data-cy="nav-signup"]').click()
      cy.url().should("include", "/signup")
    })
  
    it("should change background on scroll", () => {
      cy.get('[data-cy="navbar"]').should("not.have.class", "shadow-sm")
  
      // Scroll down
      cy.scrollTo(0, 100)
  
      // Check if navbar has shadow class after scrolling
      cy.get('[data-cy="navbar"]').should("have.class", "shadow-sm")
    })
  })
  
  