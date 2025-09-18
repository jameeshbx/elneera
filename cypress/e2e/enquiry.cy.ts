// enquiry.spec.js

describe('Enquiry Management', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000/agency/Dashboard/Enquiry') // Adjust the URL to match your application's route
      cy.clearLocalStorage() // Clear any existing data before each test
    })
  
    it('should load the enquiry page successfully', () => {
      cy.get('h3').contains('Enquiry').should('exist')
      cy.get('[data-testid="search-input"]').should('exist')
      cy.get('button').contains('Sort by').should('exist')
      cy.get('button').contains('Add enquiry').should('exist')
    })
  
    it('should display all default columns', () => {
      const expectedColumns = [
        'Enquiry',
        'Itinerary Creation',
        'Customer Feedback',
        'Itinerary Confirmed',
        'DMC Quotation',
        'Price Finalization',
        'Booking Request',
        'Booking Progress',
        'Payment Forex',
        'Trip In Progress',
        'Completed'
      ]
  
      expectedColumns.forEach(column => {
        cy.contains('h3', column).should('exist')
      })
    })
  
    it('should open and close the add enquiry dialog', () => {
      cy.get('button').contains('Add enquiry').click()
      cy.get('[role="dialog"]').should('be.visible')
      cy.get('h2').contains('Add Enquiry').should('exist')
      cy.get('button[aria-label="Close"]').click()
      cy.get('[role="dialog"]').should('not.exist')
    })
  
    it('should add a new enquiry', () => {
      const testEnquiry = {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        locations: 'Paris, London',
        tourType: 'Cultural'
      }
  
      cy.get('button').contains('Add enquiry').click()
      
      // Fill out the form
      cy.get('input[name="name"]').type(testEnquiry.name)
      cy.get('input[name="phone"]').type(testEnquiry.phone)
      cy.get('input[name="email"]').type(testEnquiry.email)
      cy.get('input[name="locations"]').type(testEnquiry.locations)
      
      // Select tour type
      cy.get('button[role="combobox"]').first().click()
      cy.get('[role="option"]').contains(testEnquiry.tourType).click()
      
      // Submit the form
      cy.get('button').contains('Add Enquiry').click()
  
      // Verify the enquiry was added to the first column
      cy.contains('div', testEnquiry.name).should('exist')
      cy.contains('div', testEnquiry.phone).should('exist')
      cy.contains('div', testEnquiry.email).should('exist')
    })
  
    it('should validate required fields in the enquiry form', () => {
      cy.get('button').contains('Add enquiry').click()
      
      // Try to submit without filling required fields
      cy.get('button').contains('Add Enquiry').click()
      
      // Check for validation errors
    })
  
    it('should drag and drop an enquiry between columns', () => {
      // First add a test enquiry
      const testEnquiry = {
        name: 'Test Drag Enquiry',
        phone: '1234567890',
        email: 'drag@test.com'
      }
  
      cy.get('button').contains('Add enquiry').click()
      cy.get('input[name="name"]').type(testEnquiry.name)
      cy.get('input[name="phone"]').type(testEnquiry.phone)
      cy.get('input[name="email"]').type(testEnquiry.email)
      cy.get('button').contains('Add Enquiry').click()
  
      // Perform drag and drop
      cy.contains('div', testEnquiry.name).trigger('mousedown', { which: 1 })
      cy.contains('h3', 'Itinerary Creation').trigger('mousemove').trigger('mouseup', { force: true })
  
      // Verify the enquiry moved
      cy.contains('h3', 'Itinerary Creation').parent().contains('div', testEnquiry.name).should('exist')
    })
  
    it('should search for enquiries', () => {
      // Add a test enquiry
      const testEnquiry = {
        name: 'Search Test Enquiry',
        phone: '1122334455'
      }
  
      cy.get('button').contains('Add enquiry').click()
      cy.get('input[name="name"]').type(testEnquiry.name)
      cy.get('input[name="phone"]').type(testEnquiry.phone)
      cy.get('button').contains('Add Enquiry').click()
  
      // Search for the enquiry
      cy.get('[data-testid="search-input"]').type(testEnquiry.name)
      
      // Verify the enquiry is visible and others are not
      cy.contains('div', testEnquiry.name).should('exist')
      cy.contains('div', 'John Doe').should('not.exist')
    })
  
    it('should scroll columns horizontally', () => {
      // Verify scroll buttons exist
      cy.get('[aria-label="Scroll right"]').should('exist')
      
      // Scroll right
      cy.get('[aria-label="Scroll right"]').click()
      
      // Scroll left
      cy.get('[aria-label="Scroll left"]').should('exist').click()
    })
  
    it('should display hover information for enquiries', () => {
      // Add a test enquiry
      const testEnquiry = {
        name: 'Hover Test Enquiry',
        phone: '9988776655'
      }
  
      cy.get('button').contains('Add enquiry').click()
      cy.get('input[name="name"]').type(testEnquiry.name)
      cy.get('input[name="phone"]').type(testEnquiry.phone)
      cy.get('button').contains('Add Enquiry').click()
  
      // Trigger hover
      cy.contains('div', testEnquiry.name).trigger('mouseenter')
      
      // Verify hover card appears
      cy.contains('div', 'Awaiting Agency response').should('be.visible')
      cy.contains('div', 'Assigned: Unassigned').should('be.visible')
    })
  })