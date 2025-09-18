describe('Signup Page', () => {
    beforeEach(() => {
      cy.visit('/signup') // Adjust the URL as needed
    })
  
    it('should load the signup page successfully', () => {
      cy.contains('Sign up with free trail').should('be.visible')
      cy.get('form').should('exist')
    })
  
    it('should display mobile back button on small screens', () => {
      cy.viewport('iphone-6')
      cy.get('[href="/"]').should('be.visible')
      cy.get('svg[xmlns="http://www.w3.org/2000/svg"]').should('exist') // X icon
    })
  
    it('should display desktop back button on larger screens', () => {
      cy.viewport('macbook-13')
      cy.get('[href="/"]').should('be.visible')
      cy.get('svg[xmlns="http://www.w3.org/2000/svg"]').should('exist') // ArrowLeft icon
    })
  
    it('should validate required fields', () => {
      cy.get('button[type="submit"]').click()
      
      // Check for validation errors with proper type casting
      cy.get('input[id="name"]').then(($input) => {
        const input = $input[0] as HTMLInputElement
        expect(input.validationMessage).to.not.be.empty
      })
      
      cy.get('input[id="phone"]').then(($input) => {
        const input = $input[0] as HTMLInputElement
        expect(input.validationMessage).to.not.be.empty
      })
      
      cy.get('input[id="email"]').then(($input) => {
        const input = $input[0] as HTMLInputElement
        expect(input.validationMessage).to.not.be.empty
      })
      
      cy.get('input[id="company"]').then(($input) => {
        const input = $input[0] as HTMLInputElement
        expect(input.validationMessage).to.not.be.empty
      })
    })
  
    it('should validate email format', () => {
      const invalidEmail = 'invalid-email'
      cy.get('input[id="email"]').type(invalidEmail)
      cy.get('button[type="submit"]').click()
      
      cy.get('input[id="email"]').then(($input) => {
        const input = $input[0] as HTMLInputElement
        expect(input.validationMessage).to.include('email')
      })
    })
  
    it('should allow selecting country code', () => {
      cy.get('select').first().select('+91').should('have.value', '+91')
    })
  
    it('should allow selecting business type', () => {
      cy.get('select[id="business-type"]').select('AGENCY').should('have.value', 'AGENCY')
      cy.get('select[id="business-type"]').select('DMSC').should('have.value', 'DMSC')
    })
  
    it('should navigate to login page when login link is clicked', () => {
      cy.contains('Already have an account?').find('a').click()
      cy.url().should('include', '/login')
    })
  
    it('should navigate to home page when back button is clicked', () => {
      cy.get('[href="/"]').first().click()
      cy.url().should('include', '/')
    })
  
    it('should submit the form with valid data', () => {
      // Mock the API response
      cy.intercept('POST', '/api/signup', {
        statusCode: 200,
        body: { success: true }
      }).as('signupRequest')
  
      // Fill out the form
      cy.get('input[id="name"]').type('Test User')
      cy.get('input[id="phone"]').type('9876543210')
      cy.get('input[id="email"]').type('test@example.com')
      cy.get('input[id="company"]').type('Test Company')
      cy.get('select[id="business-type"]').select('AGENCY')
  
      // Submit the form
      cy.get('button[type="submit"]').click()
  
      // Wait for the API call
      cy.wait('@signupRequest').then((interception) => {
        expect(interception.request.body).to.deep.equal({
          name: 'Test User',
          phone: '9876543210',
          email: 'test@example.com',
          company: 'Test Company',
          businessType: 'AGENCY'
        })
      })
  
      // Add assertions for successful submission behavior
      // For example, if it redirects to another page:
      // cy.url().should('include', '/success')
    })
  
    it('should display error message when submission fails', () => {
      // Mock a failed API response
      cy.intercept('POST', '/api/signup', {
        statusCode: 400,
        body: { error: 'Registration failed' }
      }).as('failedSignup')
  
      // Fill out the form
      cy.get('input[id="name"]').type('Test User')
      cy.get('input[id="phone"]').type('9876543210')
      cy.get('input[id="email"]').type('test@example.com')
      cy.get('input[id="company"]').type('Test Company')
      cy.get('select[id="business-type"]').select('AGENCY')
  
      // Submit the form
      cy.get('button[type="submit"]').click()
  
      // Wait for the API call
      cy.wait('@failedSignup')
  
      // Add assertions for error message display
      // For example:
      // cy.contains('Registration failed').should('be.visible')
    })
  })