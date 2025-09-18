describe("Visual Regression Testing", () => {
  it("should match the homepage snapshot", () => {
    cy.visit("/")
      .then(() => {
        // Ensure the page is fully loaded
        cy.get("body").should("be.visible");
      })
      .then(() => {
        // Capture the snapshot
        cy.screenshot("homepage");
        cy.matchImageSnapshot("homepage");
      });
  });
});
