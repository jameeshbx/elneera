describe("Notifications Popup", () => {
    beforeEach(() => {
      // Visit the page where notifications popup can be triggered
      // Assuming there's a dashboard page with a notification bell
      cy.visit("/dashboard")
  
      // Click the notification bell to open the popup
      cy.get('[data-cy="notification-button"]').click()
    })
  
    it("should render the notifications popup correctly", () => {
      // Check if the popup is visible
      cy.contains("h3", "Notifications").should("be.visible")
  
      // Check if the close button is visible
      cy.get('button[aria-label="Close notifications"]').should("be.visible")
  
      // Check if the "Previous notifications" link is visible
      cy.contains("a", "Previous notifications").should("be.visible")
    })
  
    it("should display the correct number of notifications", () => {
      // There should be 3 notification items based on the sample data
      cy.get(".max-h-\\[60vh\\] > a").should("have.length", 3)
    })
  
    it("should display notification content correctly", () => {
      // Check first notification content
      cy.contains("Global DMC Solutions").should("be.visible")
      cy.contains("Alex Johnson : Price marked.").should("be.visible")
      cy.contains("0 min").should("be.visible")
  
      // Check second notification content
      cy.contains("Holiday Planners").should("be.visible")
      cy.contains("Maria Lee : Itinerary received. Will update soon.").should("be.visible")
      cy.contains("6 min").should("be.visible")
  
      // Check third notification content
      cy.contains("TravelEase").should("be.visible")
      cy.contains("Chris Martin : Okayy").should("be.visible")
      cy.contains("16 min").should("be.visible")
    })
  
    it("should show unread indicators for unread notifications", () => {
      // First two notifications should have unread indicators (red dots)
      cy.get(".max-h-\\[60vh\\] > a").eq(0).find(".h-2.w-2.rounded-full.bg-red-500").should("be.visible")
      cy.get(".max-h-\\[60vh\\] > a").eq(1).find(".h-2.w-2.rounded-full.bg-red-500").should("be.visible")
  
      // Third notification should not have an unread indicator
      cy.get(".max-h-\\[60vh\\] > a").eq(2).find(".h-2.w-2.rounded-full.bg-red-500").should("not.exist")
    })
  
    it("should close the popup when clicking the close button", () => {
      // Click the close button
      cy.get('button[aria-label="Close notifications"]').click()
  
      // Verify the popup is no longer visible
      cy.contains("h3", "Notifications").should("not.exist")
    })
  
    it("should navigate when clicking on a notification", () => {
      // Stub the navigation to prevent actual navigation during test
      cy.window().then((win) => {
        cy.stub(win, "open").as("windowOpen")
      })
  
      // Click on the first notification
      cy.get(".max-h-\\[60vh\\] > a").eq(0).click()
  
      // Since we're using href="#" in the sample data, we can check if the URL contains #
      cy.url().should("include", "#")
    })
  
    it('should navigate when clicking on "Previous notifications"', () => {
      // Stub the navigation to prevent actual navigation during test
      cy.window().then((win) => {
        cy.stub(win, "open").as("windowOpen")
      })
  
      // Click on the "Previous notifications" link
      cy.contains("a", "Previous notifications").click()
  
      // Since we're using href="#" in the sample data, we can check if the URL contains #
      cy.url().should("include", "#")
    })
  })
  