describe('FAQ Section', () => {
    beforeEach(() => {
        cy.visit("/"); //// Adjust this to your actual page URL
    })
  
    it('should display the FAQ section with correct heading and description', () => {
      cy.get('h1').should('contain', 'Got Questions? We\'ve Got Answers')
      cy.contains('p', 'Find everything you need to know about planning, booking, and managing travel effortlessly')
    })
  
    it('should display all FAQ items', () => {
      const faqItems = [
        "What is this web app for?",
        "Can I customize itineraries for my clients?",
        "Do you support direct bookings with suppliers and DMCs?",
        "What payment options are available?",
        "Is there a free trial available?"
      ]
  
      faqItems.forEach(question => {
        cy.contains('.border-gray-200', question).should('exist')
      })
    })
  
    it('should toggle FAQ items when clicked', () => {
      // Test first question
      cy.contains('.border-gray-200', 'What is this web app for?').within(() => {
        // Initially should be closed (Plus icon visible)
        cy.get('svg').should('exist') // Plus icon
        
        // Click to open
        cy.get('button').click()
        
        // Now should be open (Minus icon visible)
        cy.get('svg').should('exist') // Minus icon
        cy.contains('This platform helps travel agencies create, customize, and manage itineraries').should('be.visible')
        
        // Click to close
        cy.get('button').click()
        
        // Back to Plus icon
        cy.get('svg').should('exist') // Plus icon
        cy.contains('This platform helps travel agencies create, customize, and manage itineraries').should('not.be.visible')
      })
  
      // Test that only one FAQ can be open at a time
      const questions = [
        'What is this web app for?',
        'Can I customize itineraries for my clients?'
      ]
  
      // Open first question
      cy.contains('.border-gray-200', questions[0]).within(() => {
        cy.get('button').click()
        cy.get('svg').should('exist') // Minus icon
      })
  
      // Open second question - first should close
      cy.contains('.border-gray-200', questions[1]).within(() => {
        cy.get('button').click()
        cy.get('svg').should('exist') // Minus icon
      })
  
      // Verify first question is closed
      cy.contains('.border-gray-200', questions[0]).within(() => {
        cy.get('svg').should('exist') // Plus icon
      })
    })
  
    it('should display the "more questions" section on desktop', () => {
      cy.viewport('macbook-15')
      
      // Check envelope icon
      cy.get('img[alt="Envelope icon"]').should('be.visible')
      
      // Check content
      cy.contains('h2', 'Do you have more questions?').should('be.visible')
      cy.contains('Access Your Dashboard and Manage').should('be.visible')
      cy.contains('Seamless Travel Experiences').should('be.visible')
      cy.contains('button', 'Shoot a Direct Mail').should('be.visible')
    })
  
    it('should display the mobile version of "more questions" section on small screens', () => {
      cy.viewport('iphone-6')
      
      // Check envelope icon
      cy.get('img[alt="Envelope icon"]').should('be.visible')
      
      // Check content
      cy.contains('h2', 'Do you have more questions?').should('be.visible')
      cy.contains('Access Your Dashboard and Manage Seamless Travel Experiences').should('be.visible')
      cy.contains('button', 'Shoot a Direct Mail').should('be.visible').and('have.css', 'width', '343px') // Full width on mobile
    })
  
    it('should have a working "Shoot a Direct Mail" button', () => {
      // This would need to be adjusted based on your actual implementation
      cy.contains('button', 'Shoot a Direct Mail').click()
      // Add assertions for what happens when the button is clicked
      // For example, if it opens a mail client or a contact form
    })
  })