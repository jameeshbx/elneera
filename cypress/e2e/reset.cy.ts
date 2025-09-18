/// <reference types="cypress" />

describe('Reset Password Page', () => {
    beforeEach(() => {
      // Visit the reset password page
      cy.visit('/reset-password')
    })
  
    context('Desktop View', () => {
      beforeEach(() => {
        // Set viewport to desktop size
        cy.viewport(1280, 720)
      })
  
      it('should display the desktop layout correctly', () => {
        // Check the main container
        cy.get('div.bg-custom-green').should('exist')
  
        // Check the background pattern
        cy.get('div.absolute.inset-0.-z-10 img').should('exist')
  
        // Check the two-column layout
        cy.get('div.flex-row').should('exist')
        cy.get('div.md\\:w-1\\/2').should('have.length', 2)
  
        // Check the left column content
        cy.get('div.bg-greenook').should('exist')
        cy.contains('Start your remarkable journey with us!').should('be.visible')
        cy.contains('Seamless Access to Your Travel Business Hub').should('be.visible')
        cy.get('img[alt="Trekking Miles Logo"]').should('be.visible')
  
        // Check the right column content
        cy.contains('Change your password').should('be.visible')
        cy.get('form').should('exist')
      })
  
      it('should have all form fields in desktop view', () => {
        // Username field
        cy.get('input#username')
          .should('exist')
          .and('have.attr', 'placeholder', 'Enter username')
          .and('have.attr', 'type', 'text')
          .and('have.attr', 'required')
  
        // New password field
        cy.get('input#new-password')
          .should('exist')
          .and('have.attr', 'placeholder', 'Enter new password')
          .and('have.attr', 'type', 'password')
          .and('have.attr', 'required')
  
        // Confirm password field
        cy.get('input#confirm-password')
          .should('exist')
          .and('have.attr', 'placeholder', 'Re-enter password')
          .and('have.attr', 'type', 'password')
          .and('have.attr', 'required')
  
        // Submit button
        cy.get('button[type="submit"]')
          .should('exist')
          .and('contain.text', 'Change')
          .and('have.class', 'bg-greenook')
      })
  
      it('should validate the reset password form', () => {
        // Test empty form submission
        cy.get('button[type="submit"]').click()
        cy.get('input#username:invalid').should('exist')
        cy.get('input#new-password:invalid').should('exist')
        cy.get('input#confirm-password:invalid').should('exist')
  
        // Test password mismatch
        cy.get('input#username').type('testuser')
        cy.get('input#new-password').type('Password123!')
        cy.get('input#confirm-password').type('DifferentPassword123!')
        cy.get('button[type="submit"]').click()
        // Add your error message assertion here if you show one
  
        // Test valid form submission
        cy.get('input#new-password').clear().type('Password123!')
        cy.get('input#confirm-password').clear().type('Password123!')
        cy.get('button[type="submit"]').click()
        // Add assertion for successful submission if needed
      })
  
      it('should toggle password visibility', () => {
        // Test new password toggle
        cy.get('input#new-password').should('have.attr', 'type', 'password')
        cy.get('button[aria-label="Toggle password visibility"]').first().click()
        cy.get('input#new-password').should('have.attr', 'type', 'text')
        cy.get('button[aria-label="Toggle password visibility"]').first().click()
        cy.get('input#new-password').should('have.attr', 'type', 'password')
  
        // Test confirm password toggle
        cy.get('input#confirm-password').should('have.attr', 'type', 'password')
        cy.get('button[aria-label="Toggle password visibility"]').last().click()
        cy.get('input#confirm-password').should('have.attr', 'type', 'text')
        cy.get('button[aria-label="Toggle password visibility"]').last().click()
        cy.get('input#confirm-password').should('have.attr', 'type', 'password')
      })
  
      it('should navigate to login page', () => {
        cy.get('a[href="/login"]').click()
        cy.url().should('include', '/login')
      })
    })
  
    context('Mobile View', () => {
      beforeEach(() => {
        // Set viewport to mobile size
        cy.viewport('iphone-6')
      })
  
      it('should display the mobile layout correctly', () => {
        // Check the mobile layout structure
        cy.get('div.flex-col').should('exist')
        cy.get('div.bg-greenook').should('exist')
        cy.get('div.bg-white').should('exist')
  
        // Check mobile header content
        cy.contains('Start your remarkable journey with us!').should('be.visible')
        cy.contains('Seamless Access to Your Travel Business Hub').should('be.visible')
        cy.get('img[alt="Trekking Miles Logo"]').should('be.visible')
  
        // Check form section
        cy.contains('Change your password').should('be.visible')
        cy.get('form').should('exist')
      })
  
      it('should have all form fields in mobile view', () => {
        // Username field
        cy.get('input#username-mobile')
          .should('exist')
          .and('have.attr', 'placeholder', 'Enter username')
          .and('have.attr', 'type', 'text')
          .and('have.attr', 'required')
  
        // New password field
        cy.get('input#new-password-mobile')
          .should('exist')
          .and('have.attr', 'placeholder', 'Enter new password')
          .and('have.attr', 'type', 'password')
          .and('have.attr', 'required')
  
        // Confirm password field
        cy.get('input#confirm-password-mobile')
          .should('exist')
          .and('have.attr', 'placeholder', 'Re-enter password')
          .and('have.attr', 'type', 'password')
          .and('have.attr', 'required')
  
        // Submit button
        cy.get('button[type="submit"]')
          .should('exist')
          .and('contain.text', 'Change')
          .and('have.class', 'bg-greenook')
      })
  
      it('should validate the mobile reset password form', () => {
        // Test empty form submission
        cy.get('button[type="submit"]').click()
        cy.get('input#username-mobile:invalid').should('exist')
        cy.get('input#new-password-mobile:invalid').should('exist')
        cy.get('input#confirm-password-mobile:invalid').should('exist')
  
        // Test password mismatch
        cy.get('input#username-mobile').type('testuser')
        cy.get('input#new-password-mobile').type('Password123!')
        cy.get('input#confirm-password-mobile').type('DifferentPassword123!')
        cy.get('button[type="submit"]').click()
        // Add your error message assertion here if you show one
  
        // Test valid form submission
        cy.get('input#new-password-mobile').clear().type('Password123!')
        cy.get('input#confirm-password-mobile').clear().type('Password123!')
        cy.get('button[type="submit"]').click()
        // Add assertion for successful submission if needed
      })
  
      it('should toggle password visibility in mobile view', () => {
        // Test new password toggle
        cy.get('input#new-password-mobile').should('have.attr', 'type', 'password')
        cy.get('button[aria-label="Toggle password visibility"]').first().click()
        cy.get('input#new-password-mobile').should('have.attr', 'type', 'text')
        cy.get('button[aria-label="Toggle password visibility"]').first().click()
        cy.get('input#new-password-mobile').should('have.attr', 'type', 'password')
  
        // Test confirm password toggle
        cy.get('input#confirm-password-mobile').should('have.attr', 'type', 'password')
        cy.get('button[aria-label="Toggle password visibility"]').last().click()
        cy.get('input#confirm-password-mobile').should('have.attr', 'type', 'text')
        cy.get('button[aria-label="Toggle password visibility"]').last().click()
        cy.get('input#confirm-password-mobile').should('have.attr', 'type', 'password')
      })
    })
  
    context('Form Submission', () => {
      // Mock API response for successful password reset
      beforeEach(() => {
        cy.intercept('POST', '/api/reset-password', {
          statusCode: 200,
          body: { success: true, message: 'Password reset successful' }
        }).as('resetRequest')
      })
  
      it('should submit the form successfully', () => {
        cy.viewport(1280, 720) // Desktop view
        cy.get('input#username').type('testuser')
        cy.get('input#new-password').type('NewPassword123!')
        cy.get('input#confirm-password').type('NewPassword123!')
        cy.get('button[type="submit"]').click()
  
        cy.wait('@resetRequest').then((interception) => {
          expect(interception.request.body).to.deep.equal({
            username: 'testuser',
            'new-password': 'NewPassword123!',
            'confirm-password': 'NewPassword123!'
          })
        })
  
        // Add assertions for success message or redirect if applicable
      })
  
      it('should handle API errors', () => {
        cy.intercept('POST', '/api/reset-password', {
          statusCode: 400,
          body: { success: false, message: 'Invalid username or token' }
        }).as('failedResetRequest')
  
        cy.viewport(1280, 720) // Desktop view
        cy.get('input#username').type('testuser')
        cy.get('input#new-password').type('NewPassword123!')
        cy.get('input#confirm-password').type('NewPassword123!')
        cy.get('button[type="submit"]').click()
  
        cy.wait('@failedResetRequest')
        // Add assertions for error message display
      })
    })
  
    context('Responsive Behavior', () => {
      it('should switch between mobile and desktop layouts', () => {
        // Start with mobile view
        cy.viewport('iphone-6')
        cy.get('div.flex-col').should('exist')
        cy.get('input#username-mobile').should('exist')
  
        // Switch to desktop view
        cy.viewport(1280, 720)
        cy.get('div.flex-row').should('exist')
        cy.get('input#username').should('exist')
  
        // Switch back to mobile view
        cy.viewport('iphone-6')
        cy.get('div.flex-col').should('exist')
        cy.get('input#username-mobile').should('exist')
      })
    })
  })