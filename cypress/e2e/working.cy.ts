describe('HowItWorks Component', () => {
  // Test desktop view
  context('Desktop View', () => {
    beforeEach(() => {
      // Set viewport to desktop size
      cy.viewport(1280, 800)
      // Visit the page containing the HowItWorks component
      cy.visit('/')
      // Scroll to the HowItWorks section
      cy.get('[data-testid="how-it-works-section"]').scrollIntoView()
    })

    it('should render the HowItWorks section', () => {
      cy.get('[data-testid="how-it-works-section"]').should('be.visible')
      cy.contains('How this Works').should('be.visible')
    })

    it('should display all 5 steps in desktop view', () => {
      // Check that all steps are visible
      cy.get('[data-testid="step-1"]').should('be.visible')
      cy.get('[data-testid="step-2"]').should('be.visible')
      cy.get('[data-testid="step-3"]').should('be.visible')
      cy.get('[data-testid="step-4"]').should('be.visible')
      cy.get('[data-testid="step-5"]').should('be.visible')
    })

    it('should display correct content for each step', () => {
      // Check step 1 content
      cy.get('[data-testid="step-1"]').within(() => {
        cy.contains('01').should('be.visible')
        cy.contains('Sign Up & Get').should('be.visible')
        cy.contains('Register your agency').should('be.visible')
      })

      // Check step 2 content
      cy.get('[data-testid="step-2"]').within(() => {
        cy.contains('02').should('be.visible')
        cy.contains('Customize Your').should('be.visible')
        cy.contains('Add your logo').should('be.visible')
      })

      // Check step 3 content
      cy.get('[data-testid="step-3"]').within(() => {
        cy.contains('03').should('be.visible')
        cy.contains('Manage Itinerary').should('be.visible')
        cy.contains('Receive inquiries').should('be.visible')
      })

      // Check step 4 content
      cy.get('[data-testid="step-4"]').within(() => {
        cy.contains('04').should('be.visible')
        cy.contains('Connect with DMCs').should('be.visible')
        cy.contains('Submit the finalized').should('be.visible')
      })

      // Check step 5 content
      cy.get('[data-testid="step-5"]').within(() => {
        cy.contains('05').should('be.visible')
        cy.contains('Confirm & Track').should('be.visible')
        cy.contains('Upon customer approval').should('be.visible')
      })
    })

    it('should not display mobile navigation buttons', () => {
      // Navigation buttons should not be visible in desktop view
      cy.get('[aria-label="Previous step"]').should('not.be.visible')
      cy.get('[aria-label="Next step"]').should('not.be.visible')
    })
  })

  // Test mobile view
  context('Mobile View', () => {
    beforeEach(() => {
      // Set viewport to mobile size
      cy.viewport(375, 667)
      // Visit the page containing the HowItWorks component
      cy.visit('/')
      // Scroll to the HowItWorks section
      cy.get('[data-testid="how-it-works-section"]').scrollIntoView()
    })

    it('should render the HowItWorks section in mobile view', () => {
      cy.get('[data-testid="how-it-works-section"]').should('be.visible')
      cy.contains('How this Works').should('be.visible')
    })

    it('should display only the first step initially', () => {
      // First step should be visible
      cy.get('[data-testid="step-1"]').should('be.visible')
      cy.contains('Sign Up & Get').should('be.visible')
      
      // Check that step 1 content is visible
      cy.contains('Register your agency').should('be.visible')
      
      // Other steps should not be visible (they exist in DOM but are not visible)
      cy.contains('Customize Your').should('not.be.visible')
      cy.contains('Manage Itinerary').should('not.be.visible')
      cy.contains('Connect with DMCs').should('not.be.visible')
      cy.contains('Confirm & Track').should('not.be.visible')
    })

    it('should display navigation buttons', () => {
      // Navigation buttons should be visible in mobile view
      cy.get('[aria-label="Previous step"]').should('be.visible')
      cy.get('[aria-label="Next step"]').should('be.visible')
    })

    it('should navigate to next step when clicking next button', () => {
      // First step should be visible initially
      cy.contains('Sign Up & Get').should('be.visible')
      
      // Click next button
      cy.get('[aria-label="Next step"]').click()
      
      // Second step should now be visible
      cy.contains('Customize Your').should('be.visible')
      
      // First step should no longer be visible
      cy.contains('Sign Up & Get').should('not.be.visible')
    })

    it('should navigate to previous step when clicking previous button', () => {
      // Navigate to second step first
      cy.get('[aria-label="Next step"]').click()
      cy.contains('Customize Your').should('be.visible')
      
      // Click previous button
      cy.get('[aria-label="Previous step"]').click()
      
      // First step should now be visible again
      cy.contains('Sign Up & Get').should('be.visible')
      
      // Second step should no longer be visible
      cy.contains('Customize Your').should('not.be.visible')
    })

    it('should cycle through all steps', () => {
      // Test cycling through all steps
      cy.get('[aria-label="Next step"]').click()
      cy.contains('Customize Your').should('be.visible')
      
      cy.get('[aria-label="Next step"]').click()
      cy.contains('Manage Itinerary').should('be.visible')
      
      cy.get('[aria-label="Next step"]').click()
      cy.contains('Connect with DMCs').should('be.visible')
      
      cy.get('[aria-label="Next step"]').click()
      cy.contains('Confirm & Track').should('be.visible')
      
      // Test cycling back to first step
      cy.get('[aria-label="Next step"]').click()
      cy.contains('Sign Up & Get').should('be.visible')
    })

    it('should cycle backwards through all steps', () => {
      // Click previous button from first step should go to last step
      cy.get('[aria-label="Previous step"]').click()
      cy.contains('Confirm & Track').should('be.visible')
      
      cy.get('[aria-label="Previous step"]').click()
      cy.contains('Connect with DMCs').should('be.visible')
      
      cy.get('[aria-label="Previous step"]').click()
      cy.contains('Manage Itinerary').should('be.visible')
      
      cy.get('[aria-label="Previous step"]').click()
      cy.contains('Customize Your').should('be.visible')
      
      cy.get('[aria-label="Previous step"]').click()
      cy.contains('Sign Up & Get').should('be.visible')
    })
  })

  // Test responsive behavior
  context('Responsive Behavior', () => {
    it('should switch from desktop to mobile view', () => {
      // Start with desktop view
      cy.viewport(1280, 800)
      cy.visit('/')
      cy.get('[data-testid="how-it-works-section"]').scrollIntoView()
      
      // All steps should be visible in desktop
      cy.get('[data-testid="step-1"]').should('be.visible')
      cy.get('[data-testid="step-2"]').should('be.visible')
      cy.get('[data-testid="step-3"]').should('be.visible')
      cy.get('[data-testid="step-4"]').should('be.visible')
      cy.get('[data-testid="step-5"]').should('be.visible')
      
      // Switch to mobile view
      cy.viewport(375, 667)
      
      // Only first step should be visible in mobile
      cy.contains('Sign Up & Get').should('be.visible')
      cy.contains('Customize Your').should('not.be.visible')
      
      // Navigation buttons should appear
      cy.get('[aria-label="Previous step"]').should('be.visible')
      cy.get('[aria-label="Next step"]').should('be.visible')
    })
  })

  // Test animation
  context('Animation', () => {
    it('should animate steps when they come into view', () => {
      // This test is more complex and might require custom commands
      // to check for CSS classes or transitions
      cy.viewport(1280, 800)
      cy.visit('/')
      
      // Scroll to just above the section
      cy.window().scrollTo(0, 0)
      
      // Scroll to the section
      cy.get('[data-testid="how-it-works-section"]').scrollIntoView()
      
      // Check that animation class is added
      // You might need to add a wait or custom logic depending on your implementation
      cy.get('.step-item').should('have.class', 'animate-fade-in')
    })
  })
})