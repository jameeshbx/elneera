describe("Add Users Page", () => {
    beforeEach(() => {
      cy.visit("/add-users") // Adjust the path as needed for your application
    })
  
    it("should display the add users form", () => {
      cy.get("form").should("exist")
      cy.get('input[name="name"]').should("exist")
      cy.get('input[name="phone"]').should("exist")
      cy.get('input[name="email"]').should("exist")
      cy.get('input[name="username"]').should("exist")
      cy.get('input[name="password"]').should("exist")
      cy.get('button[type="submit"]').should("exist").and("contain", "Submit")
    })
  
    it("should display the users table with data", () => {
      cy.get("table").should("exist")
      cy.get('[data-testid^="user-row-"]').should("have.length.at.least", 1)
    })
  
    it("should allow searching for users", () => {
      cy.get('input[placeholder="Search for..."]').type("Staff 1")
      cy.get('[data-testid="user-row-staffA1"]').should("exist")
      cy.get('[data-testid="user-row-staffA2"]').should("not.exist")
    })
  
    it("should allow sorting users", () => {
      // Open sort dropdown
      cy.get("button").contains("Sort by").click()
  
      // Select name sorting
      cy.get('div[role="option"]').contains("Name").click()
  
      // Verify first user is Staff 1 (alphabetical order)
      cy.get('[data-testid^="user-row-"]').first().contains("Staff 1")
  
      // Click again to sort in reverse
      cy.get("button").contains("Sort by").click()
      cy.get('div[role="option"]').contains("Name").click()
  
      // Now should be in reverse order
      cy.get('[data-testid^="user-row-"]').first().contains("Staff 6")
    })
  
    it("should allow pagination through users", () => {
      // Check initial page
      cy.get('[data-testid="user-row-staffA3"]').should("exist")
  
      // Go to next page
      cy.get("button").find('svg[data-testid="ChevronRightIcon"]').click()
  
      // Should show different users
      cy.get('[data-testid="user-row-staffA4"]').should("exist")
      cy.get('[data-testid="user-row-staffA3"]').should("not.exist")
    })
  
    it("should allow toggling password visibility", () => {
      // Password should be hidden initially
      cy.get("table").contains("•••••••").should("exist")
  
      // Click eye icon to show password
      cy.get("button").find('svg[data-testid="EyeIcon"]').first().click()
  
      // Password should now be visible
      cy.get("table").contains("password123").should("exist")
    })
  
    it("should allow submitting the form", () => {
      // Fill out the form
      cy.get('input[name="name"]').type("Test User")
      cy.get('input[name="phone"]').type("1234567890")
      cy.get('input[name="email"]').type("test@example.com")
      cy.get('input[name="username"]').type("testuser")
      cy.get('input[name="password"]').type("password123")
  
      // Submit the form
      cy.get('button[type="submit"]').click()
  
      // Check for success toast
      cy.contains("User has been added successfully").should("be.visible")
  
      // Form should be reset
      cy.get('input[name="name"]').should("have.value", "")
    })
  
    it("should allow uploading a profile image", () => {
      // Simulate file upload
      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from("file contents"),
          fileName: "profile.jpg",
          lastModified: Date.now(),
        },
        { force: true },
      )
  
      // Check for success toast
      cy.contains("Successfully uploaded: profile.jpg").should("be.visible")
  
      // Input should show filename
      cy.get('input[id="profile-display"]').should("have.value", "profile.jpg")
    })
  })
  