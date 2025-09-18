describe("Manager Section", () => {
    beforeEach(() => {
      cy.visit("/")
    })
  
    it("should display the manager form and table", () => {
      // Check form elements
      cy.get('label[for="name"]').should("exist")
      cy.get('input[name="name"]').should("exist")
      cy.get('label[for="phone"]').should("exist")
      cy.get('input[name="phone"]').should("exist")
      cy.get('label[for="email"]').should("exist")
      cy.get('input[name="email"]').should("exist")
      cy.get('label[for="username"]').should("exist")
      cy.get('input[name="username"]').should("exist")
      cy.get('label[for="password"]').should("exist")
      cy.get('input[name="password"]').should("exist")
      cy.get('label[for="profile"]').should("exist")
      cy.get("button").contains("Upload").should("exist")
      cy.get("button").contains("Submit").should("exist")
  
      // Check table headers
      cy.get("table th").should("have.length", 9)
      cy.get("table th").eq(1).should("contain", "User ID")
      cy.get("table th").eq(2).should("contain", "Name")
      cy.get("table th").eq(3).should("contain", "Phone no.")
      cy.get("table th").eq(4).should("contain", "Email")
      cy.get("table th").eq(5).should("contain", "Username")
      cy.get("table th").eq(6).should("contain", "Password")
      cy.get("table th").eq(7).should("contain", "Status")
  
      // Check if table has data
      cy.get("table tbody tr").should("have.length.at.least", 3)
    })
  
    it("should be able to fill and submit the form", () => {
      const testData = {
        name: "Test Manager",
        phone: "9876543210",
        email: "test@example.com",
        username: "testadmin",
        password: "testpassword",
      }
  
      cy.get('input[name="name"]').type(testData.name)
      cy.get('input[name="phone"]').type(testData.phone)
      cy.get('input[name="email"]').type(testData.email)
      cy.get('input[name="username"]').type(testData.username)
      cy.get('input[name="password"]').type(testData.password)
  
      // Mock file upload
      cy.get("button").contains("Upload").click()
  
      // Submit the form
      cy.get("button").contains("Submit").click()
  
      // Form should be reset after submission
      cy.get('input[name="name"]').should("have.value", "")
      cy.get('input[name="phone"]').should("have.value", "")
      cy.get('input[name="email"]').should("have.value", "")
      cy.get('input[name="username"]').should("have.value", "")
      cy.get('input[name="password"]').should("have.value", "")
    })
  
    it("should toggle password visibility", () => {
      // Toggle form password visibility
      cy.get('input[name="password"]').type("testpassword")
      cy.get('input[name="password"]').should("have.attr", "type", "password")
      cy.get("button").find("svg").eq(0).click() // Click the eye icon
      cy.get('input[name="password"]').should("have.attr", "type", "text")
  
      // Toggle table password visibility
      cy.get("table tbody tr").eq(0).find("button").eq(0).click() // Click the eye icon in the first row
      cy.get("table tbody tr").eq(0).find("td").eq(6).should("not.contain", "•••••••")
    })
  
    it("should filter managers by search query", () => {
      // Search for a specific manager
      cy.get('input[placeholder="Search for..."]').type("Admin 1")
      cy.get("table tbody tr").should("have.length", 1)
      cy.get("table tbody tr").eq(0).should("contain", "Admin 1")
  
      // Clear search and check if all managers are displayed
      cy.get('input[placeholder="Search for..."]').clear()
      cy.get("table tbody tr").should("have.length.at.least", 3)
    })
  
    it("should have working pagination", () => {
      // Check if pagination elements exist
      cy.get("button").contains("1").should("exist")
      cy.get("button").contains("4").should("exist")
      cy.get("button").contains("5").should("exist")
      cy.get("button").contains("10").should("exist")
  
      // Check if page 4 is active
      cy.get("button").contains("4").should("have.class", "bg-emerald-500")
    })
  
    it("should have working dropdown menu for each manager", () => {
      // Open dropdown menu for the first manager
      cy.get("table tbody tr").eq(0).find("button").last().click()
  
      // Check if dropdown menu items exist
      cy.get('div[role="menu"]').should("be.visible")
      cy.get('div[role="menu"]').contains("Edit").should("exist")
      cy.get('div[role="menu"]').contains("Delete").should("exist")
      cy.get('div[role="menu"]').contains("Change Status").should("exist")
    })
  })
  