describe('Sidebar Component', () => {
    beforeEach(() => {
      cy.viewport(1280, 720) // Desktop view by default
      cy.visit('http://localhost:3000/Admin') // Adjust to your actual route
    })
  
    describe('Desktop Behavior', () => {
      it('should be visible by default on desktop', () => {
        cy.get('[data-cy="sidebar"]').should('be.visible')
      })
  
      it('should not show the toggle button on desktop', () => {
        cy.get('[data-cy="sidebar-toggle"]').should('not.be.visible')
      })
  
      it('should display all menu items correctly', () => {
        const menuItems = [
          'Dashboard',
          'Login requests',
          'Subscription Details',
          'Manage Users',
          'Add DMC'
        ]
  
        menuItems.forEach(item => {
          cy.get('[data-cy="sidebar"]').should('contain', item)
        })
      })
  
      it('should highlight the active menu item', () => {
        cy.visit('/admin/dashboard') // Adjust to match your dashboard route
        cy.get('[data-cy="sidebar-item-dashboard"]')
          .should('have.class', 'bg-blue-100')
          .should('have.class', 'text-blue-600')
      })
  
      it('should expand and collapse the login requests dropdown', () => {
        cy.get('[data-cy="sidebar-item-login-requests"]').click()
        cy.get('[data-cy="sidebar-dropdown-item-dmc"]').should('be.visible')
        cy.get('[data-cy="sidebar-dropdown-item-other-agency"]').should('be.visible')
  
        cy.get('[data-cy="sidebar-item-login-requests"]').click()
        cy.get('[data-cy="sidebar-dropdown-item-dmc"]').should('not.exist')
      })
  
      it('should navigate to different pages when menu items are clicked', () => {
        cy.get('[data-cy="sidebar-item-manage-users"]').click()
        cy.url().should('include', '/admin/users')
      })
    })
  
    describe('Mobile Behavior', () => {
      beforeEach(() => {
        cy.viewport('iphone-6') // Switch to mobile view
      })
  
      it('should be hidden by default on mobile', () => {
        cy.get('[data-cy="sidebar"]').should('not.be.visible')
      })
  
      it('should show the toggle button on mobile', () => {
        cy.get('[data-cy="sidebar-toggle"]').should('be.visible')
      })
  
      it('should open when toggle button is clicked', () => {
        cy.get('[data-cy="sidebar-toggle"]').click()
        cy.get('[data-cy="sidebar"]').should('be.visible')
        cy.get('[data-cy="sidebar-overlay"]').should('be.visible')
      })
  
      it('should close when overlay is clicked', () => {
        cy.get('[data-cy="sidebar-toggle"]').click()
        cy.get('[data-cy="sidebar-overlay"]').click({ force: true })
        cy.get('[data-cy="sidebar"]').should('not.be.visible')
      })
  
      it('should close when a menu item is clicked', () => {
        cy.get('[data-cy="sidebar-toggle"]').click()
        cy.get('[data-cy="sidebar-item-dashboard"]').click()
        cy.get('[data-cy="sidebar"]').should('not.be.visible')
      })
    })
  
    describe('Account Section', () => {
      it('should display all account items', () => {
        const accountItems = ['Profile', 'Settings', 'Logout']
  
        accountItems.forEach(item => {
          cy.get('[data-cy="sidebar"]').should('contain', item)
        })
      })
  
      it('should navigate to account pages', () => {
        cy.get('[data-cy="sidebar-account-item-profile"]').click()
        cy.url().should('include', '/admin/profile')
      })
  
      it('should log out when logout is clicked', () => {
        cy.get('[data-cy="sidebar-account-item-logout"]').click()
        cy.url().should('eq', 'http://localhost:3000/') // Adjust to your base URL
      })
    })
  
    describe('Responsive Behavior', () => {
      it('should show sidebar when resizing to desktop', () => {
        cy.viewport('iphone-6')
        cy.get('[data-cy="sidebar"]').should('not.be.visible')
        
        cy.viewport(1280, 720)
        cy.get('[data-cy="sidebar"]').should('be.visible')
        cy.get('[data-cy="sidebar-toggle"]').should('not.be.visible')
      })
  
      it('should hide sidebar when resizing to mobile', () => {
        cy.viewport(1280, 720)
        cy.get('[data-cy="sidebar"]').should('be.visible')
        
        cy.viewport('iphone-6')
        cy.get('[data-cy="sidebar"]').should('not.be.visible')
        cy.get('[data-cy="sidebar-toggle"]').should('be.visible')
      })
    })
  
    describe('Help Section', () => {
      it('should display the help section', () => {
        cy.get('[data-cy="sidebar"]').should('contain', 'Need help?')
        cy.get('[data-cy="sidebar"]').should('contain', 'Please check our docs')
        cy.get('[data-cy="sidebar"]').should('contain', 'DOCUMENTATION')
      })
    })
  })