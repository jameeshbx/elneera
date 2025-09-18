describe("DMC Registration Form", () => {
    beforeEach(() => {
      // Visit the page where the form is located
      cy.visit("http://localhost:3000/dmc-registration")
    })
  
    it("should display the form correctly", () => {
      // Check if the form is visible
      cy.get("form").should("be.visible")
  
      // Check if important fields are present
      cy.get('input[name="dmcName"]').should("be.visible")
      cy.get('input[name="email"]').should("be.visible")
      cy.get('input[name="phoneNumber"]').should("be.visible")
    })
  
    it("should validate required fields", () => {
      // Try to submit the form without filling required fields
      cy.get('button[type="submit"]').click()
  
      // HTML5 validation should prevent submission and focus on the first required field
      cy.get("input:invalid").should("exist")
    })
  
    it("should allow file upload", () => {
      // Create a test file and upload it
      cy.fixture("test-certificate.pdf", "base64").then((fileContent) => {
        cy.get("input#certificate-upload").then((input) => {
          const blob = Cypress.Blob.base64StringToBlob(fileContent, "application/pdf")
          const testFile = new File([blob], "test-certificate.pdf", { type: "application/pdf" })
          const dataTransfer = new DataTransfer()
  
          dataTransfer.items.add(testFile)
          const inputEl = input[0] as HTMLInputElement
          inputEl.files = dataTransfer.files
          cy.wrap(input).trigger("change", { force: true })
        })
      })
  
      // Check if the file name appears in the display field
      cy.get("input#certificate-display").should("have.value", "test-certificate.pdf")
    })
  
    it("should toggle GST number field based on GST registration selection", () => {
      // Check if GST No field is enabled by default (when "Yes" is selected)
      cy.get('input[name="gstNo"]').should("not.be.disabled")
  
      // Select "No" for GST Registration
      cy.get("#gst-no").click()
  
      // Check if GST No field is disabled
      cy.get('input[name="gstNo"]').should("be.disabled")
  
      // Select "Yes" again
      cy.get("#gst-yes").click()
  
      // Check if GST No field is enabled again
      cy.get('input[name="gstNo"]').should("not.be.disabled")
    })
  
    it("should submit the form with valid data", () => {
      // Fill in required fields
      cy.get('input[name="dmcName"]').type("Test DMC")
      cy.get('input[name="primaryContact"]').type("John Doe")
      cy.get('input[name="phoneNumber"]').type("9876543210")
      cy.get('input[name="designation"]').type("Manager")
      cy.get('input[name="ownerName"]').type("Jane Doe")
      cy.get('input[name="ownerPhoneNumber"]').type("9876543211")
      cy.get('input[name="email"]').type("test@example.com")
  
      // Submit the form
      cy.get('button[type="submit"]').click()
  
      // Check for success toast
      cy.contains("DMC has been registered successfully").should("be.visible")
  
      // Form should be reset after submission
      cy.get('input[name="dmcName"]').should("have.value", "")
    })
  })
  