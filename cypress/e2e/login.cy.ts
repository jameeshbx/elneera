/// <reference types="cypress" />

describe('Login Page Tests', () => {
    beforeEach(() => {
      // Set base URL in cypress.config.js or here
      cy.visit('http://localhost:3000/login')
    })
  
    context('Desktop View', () => {
      beforeEach(() => {
        cy.viewport(1280, 720)
      })
  
      it('should display the desktop layout correctly', () => {
        // Check main structure
        cy.get('.bg-custom-green').should('exist')
        cy.get('.md\\:flex-row').should('exist')
        cy.get('.md\\:w-1\\/2').should('have.length', 2)
  
        // Check green section content
        cy.contains('Start your remarkable journey with us!').should('be.visible')
        cy.contains('Seamless Access to Your Travel Business Hub').should('be.visible')
        cy.get('img[alt="Trekking Miles Logo"]').should('be.visible')
  
        // Check form section
        cy.contains('Welcome Back 👋').should('be.visible')
        cy.get('form').should('be.visible')
      })
  
      it('should have a functional login form', () => {
        // Wait for form to be interactive
        cy.get('form').should('be.visible')
  
        // Test username field
        cy.get('#username')
          .should('be.visible')
          .and('have.attr', 'placeholder', 'Enter username')
          .and('have.attr', 'required')
  
        // Test password field with separate assertions
        const passwordField = cy.get('#password')
        passwordField.should('be.visible')
        passwordField.should('have.attr', 'placeholder', 'Enter password')
        passwordField.should('have.attr', 'required')
        passwordField.should('have.attr', 'type', 'password')
  
        // Test password toggle
        cy.get('button[aria-label="Toggle password visibility"]').click()
        cy.get('#password').should('have.attr', 'type', 'text')
        cy.get('button[aria-label="Toggle password visibility"]').click()
        cy.get('#password').should('have.attr', 'type', 'password')
  
        // Test remember me checkbox
        cy.get('#remember-me')
          .should('not.be.checked')
          .check()
          .should('be.checked')
  
        // Test marketing opt-out
        cy.get('#marketing-opt-out')
          .should('not.be.checked')
          .check()
          .should('be.checked')
  
        // Test links
        cy.contains('Forgot Password?')
          .should('have.attr', 'href', '/forgot-password')
        
        cy.contains('Signup')
          .should('have.attr', 'href', '/signup')
  
        // Test login button
        cy.get('button[type="submit"]')
          .contains('Login')
          .should('be.visible')
          .and('not.be.disabled')
      })
  
      it('should validate required fields', () => {
        cy.get('button[type="submit"]').click()
        
        // Check HTML5 validation
        cy.get('#username:invalid').should('exist')
        cy.get('#password:invalid').should('exist')
        
        // Fill fields and verify validation passes
        cy.get('#username').type('testuser')
        cy.get('#password').type('password123')
        cy.get('#username:invalid').should('not.exist')
        cy.get('#password:invalid').should('not.exist')
      })
  
      it('should navigate back to home when back button is clicked', () => {
        cy.get('a[href="/"]').first().click()
        cy.url().should('eq', 'http://localhost:3000/')
      })
    })
  
    context('Mobile View', () => {
      beforeEach(() => {
        cy.viewport('iphone-6')
      })
  
      it('should display the mobile layout correctly', () => {
        // Check mobile-specific elements
        cy.get('.max-w-md').should('exist')
        cy.get('a[href="/"] svg').should('not.exist') // No back arrow
        cy.get('.h-5.w-5').should('exist') // X icon exists
  
        // Check content
        cy.contains('Start your remarkable journey with us!').should('be.visible')
        cy.contains('Seamless Access to Your Travel Business Hub').should('be.visible')
        cy.get('img[alt="Trekking Miles Logo"]').should('be.visible')
        cy.contains('Welcome Back 👋').should('be.visible')
      })
  
      it('should have a functional mobile login form', () => {
        // Wait for form
        cy.get('form').should('be.visible')
  
        // Test username field
        cy.get('#username-mobile')
          .should('be.visible')
          .and('have.attr', 'placeholder', 'Enter username')
          .and('have.attr', 'required')
  
        // Test password field with more reliable assertions
        cy.get('#password-mobile').as('passwordField')
        cy.get('@passwordField').should('be.visible')
        cy.get('@passwordField').should('have.attr', 'placeholder', 'Enter password')
        cy.get('@passwordField').should('have.attr', 'required')
        cy.get('@passwordField').should('have.attr', 'type', 'password')
  
        // Test password toggle
        cy.get('button[aria-label="Toggle password visibility"]').click()
        cy.get('@passwordField').should('have.attr', 'type', 'text')
        cy.get('button[aria-label="Toggle password visibility"]').click()
        cy.get('@passwordField').should('have.attr', 'type', 'password')
  
        // Test checkboxes
        cy.get('#remember-me-mobile')
          .should('not.be.checked')
          .check()
          .should('be.checked')
  
        cy.get('#marketing-opt-out-mobile')
          .should('not.be.checked')
          .check()
          .should('be.checked')
  
        // Test links
        cy.contains('Forgot Password?')
          .should('have.attr', 'href', '/forgot-password')
        
        cy.contains('Signup')
          .should('have.attr', 'href', '/signup')
      })
  
      it('should validate required fields in mobile view', () => {
        cy.get('button[type="submit"]').click()
        
        // Check validation messages
        cy.get('#username-mobile:invalid').should('exist')
        cy.get('#password-mobile:invalid').should('exist')
        
        // Fill fields to clear validation
        cy.get('#username-mobile').type('mobileuser')
        cy.get('#password-mobile').type('mypassword')
        cy.get('#username-mobile:invalid').should('not.exist')
        cy.get('#password-mobile:invalid').should('not.exist')
      })
  
      it('should navigate back to home when close button is clicked', () => {
        cy.get('a[href="/"]').first().click()
        cy.url().should('eq', 'http://localhost:3000/')
      })
    })
  
    context('Responsive Behavior', () => {
      it('should switch between desktop and mobile layouts', () => {
        // Test desktop layout
        cy.viewport(1280, 720)
        cy.get('.md\\:flex-row').should('exist')
        cy.get('.md\\:w-1\\/2').should('have.length', 2)
  
        // Test mobile layout
        cy.viewport('iphone-6')
        cy.get('.max-w-md').should('exist')
        cy.get('.md\\:flex-row').should('not.exist')
  
        // Back to desktop
        cy.viewport(1280, 720)
        cy.get('.md\\:flex-row').should('exist')
      })
    })
  })