/// <reference types="cypress" />

describe('Profile Section Tests', () => {
    beforeEach(() => {

      
      // Visit the correct profile page URL
      cy.visit('/agency/Dashboard/profile')
    })
  
    it('should display the profile header correctly', () => {
      // Using class names and text content instead of test IDs
      cy.get('.bg-white.p-4.flex.items-center.justify-between.relative').should('exist')
      cy.get('img[alt="Profile"]').should('be.visible')
      cy.contains('h1', profileData.name).should('be.visible')
      cy.contains('p', profileData.email).should('be.visible')
      cy.contains('button', 'OVERVIEW').should('be.visible')
    })
  
    it('should display profile information correctly', () => {
      cy.contains('h2', 'Profile Information').should('be.visible')
      cy.contains('span', 'Full Name:').should('be.visible')
      cy.contains('span', profileData.fullName).should('be.visible')
      cy.contains('span', 'Mobile:').should('be.visible')
      cy.contains('span', profileData.mobile).should('be.visible')
      cy.contains('span', 'Email:').should('be.visible')
      cy.contains('span', profileData.email).should('be.visible')
      cy.contains('span', 'Location:').should('be.visible')
      cy.contains('span', profileData.location).should('be.visible')
      cy.get('[aria-label="Facebook"]').should('be.visible')
      cy.get('[aria-label="Twitter"]').should('be.visible')
      cy.get('[aria-label="Instagram"]').should('be.visible')
    })
  
    it('should display account information correctly', () => {
      cy.contains('h2', 'Account Information').should('be.visible')
      cy.contains('span', 'Username:').should('be.visible')
      cy.contains('span', accountData.username).should('be.visible')
      
      // Test password visibility toggle
      cy.contains('span', 'Password:').should('be.visible')
      cy.contains('span', accountData.password).should('be.visible')
      cy.get('button').contains('Show').click()
      cy.contains('span', 'password123').should('be.visible')
      cy.get('button').contains('Hide').click()
      cy.contains('span', accountData.password).should('be.visible')
      
      cy.contains('span', 'Role:').should('be.visible')
      cy.contains('span', accountData.role).should('be.visible')
      cy.contains('span', 'Location:').should('be.visible')
      cy.contains('span', accountData.location).should('be.visible')
      cy.contains('span', 'Account Status:').should('be.visible')
      cy.contains('span', accountData.status).should('be.visible')
      cy.contains('span', 'Last logged in:').should('be.visible')
  
    })
  
    it('should display team members correctly', () => {
      cy.contains('span', 'TEAM').should('be.visible')
      teamMembers.forEach(member => {
        cy.contains('p', member.name).should('be.visible')
      })
      
      // Test adding comment
      cy.contains('button', 'Add comment').first().click()
      
      // Verify comment dialog opens
      cy.contains('h2', 'Team Member Details').should('be.visible')
      cy.get('textarea').type('Test comment')
      cy.contains('button', 'Save Note').click()
    })
  
    it('should display company information correctly', () => {
      cy.contains('h2', 'Company Information').should('be.visible')
      cy.contains('span', 'Company name:').should('be.visible')

      
      // Test color picker functionality
      cy.get('div[style*="background-color: rgb(15, 157, 88)"]').click()
      cy.contains('h3', 'Choose Landing Page Color').should('be.visible')
      cy.get('input').clear().type('#FF0000')
      cy.contains('button', 'Apply').click()
    })
  
    it('should allow downloading business license', () => {
      cy.get('img[alt="Notes"]').parent().click()
      // Verify download (might need to stub the API response)
    })
  })