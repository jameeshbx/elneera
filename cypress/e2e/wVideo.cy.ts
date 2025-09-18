describe("See It In Action Section", () => {
    beforeEach(() => {
      cy.visit("/")
      cy.get('[data-test="see-it-in-action-section"]').should("be.visible")
    })
  
    it("should display the section with correct content", () => {
      // Check if the section title is displayed
      cy.get('[data-test="content-container"]')
        .should("be.visible")
        .within(() => {
          cy.contains("h2", "See It in Action").should("be.visible")
          cy.contains("p", "Watch how our smart itinerary builder simplifies travel planning").should("be.visible")
        })
  
      // Check if the video container is displayed
      cy.get('[data-test="video-container"]').should("be.visible")
      cy.get('[data-test="video-thumbnail"]').should("be.visible")
      cy.get('[data-test="play-button"]').should("be.visible")
    })
  
    it("should play the video when the play button is clicked", () => {
      // Click the play button
      cy.get('[data-test="play-button"]').click()
  
      // Check if the video is displayed and the thumbnail is hidden
      cy.get('[data-test="video-player"]').should("be.visible")
      cy.get('[data-test="video-thumbnail"]').should("not.be.visible")
  
      // Verify the video is playing (this is a bit tricky in Cypress)
      // We can check if the play button is no longer visible
      cy.get('[data-test="play-button"]').should("not.exist")
    })
  
    it("should be responsive", () => {
      // Test on mobile viewport
      cy.viewport("iphone-6")
      cy.get('[data-test="see-it-in-action-section"]').should("be.visible")
      cy.get('[data-test="content-container"]').should("be.visible")
      cy.get('[data-test="video-container"]').should("be.visible")
  
      // Test on tablet viewport
      cy.viewport("ipad-2")
      cy.get('[data-test="see-it-in-action-section"]').should("be.visible")
  
      // Test on desktop viewport
      cy.viewport(1280, 720)
      cy.get('[data-test="see-it-in-action-section"]').should("be.visible")
    })
  })
  
  