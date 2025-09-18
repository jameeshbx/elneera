/// <reference types="cypress" />

describe('Request Dashboard', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3000/Admin/Dashboard/Manage-DMC');
    });
  
    it('should load the dashboard with initial data', () => {
      cy.get('table').should('exist');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });
  
    it('should display mobile view on small screens', () => {
      cy.viewport('iphone-6');
      cy.get('.sm\\:hidden').should('be.visible');
      cy.get('.hidden.sm\\:block').should('not.be.visible');
    });
  
    it('should search and filter requests', () => {
      const searchTerm = 'test';
      cy.get('#search-input').type(searchTerm);
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).should('contain.text', searchTerm);
      });
    });
  
    it('should filter by request status', () => {
      cy.contains('button', 'Request Status').click();
      cy.get('[id="pending"]').uncheck();
      cy.contains('button', 'Apply').click();
      cy.get('tbody tr').should('not.contain', 'Pending');
    });
  
    it('should filter by date range', () => {
      cy.contains('button', /Select dates/).click();
      cy.get('[aria-label="April 1, 2025"]').click();
      cy.get('[aria-label="April 5, 2025"]').click();
      cy.contains('button', 'Apply').click();
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });
  
    it('should sort by date and status', () => {
      // Sort by date
      cy.contains('button', 'Sort by').click();
      cy.contains('Date').click();
      cy.get('tbody tr').first().should('contain', 'Mar 28');
  
      // Sort by status
      cy.contains('button', 'Sort by').click();
      cy.contains('Status').click();
      cy.get('tbody tr').first().should('contain', 'Active');
    });
  
    it('should handle pagination', () => {
      // Test next page
      cy.get('tbody tr').then(($rows) => {
        const firstPageItems = $rows.length;
        cy.get('[aria-label="Next page"]').click();
        cy.get('tbody tr').should('have.length', firstPageItems);
      });
  
      // Test page number click
      cy.get('[aria-label="Go to page 2"]').click();
      cy.get('[aria-label="Current page"]').should('contain', '2');
    });
  
    it('should select items and use bulk actions', () => {
      // Select all
      cy.get('thead [type="checkbox"]').click();
      cy.get('tbody [type="checkbox"]').each(($checkbox) => {
        cy.wrap($checkbox).should('be.checked');
      });
  
      // Deselect one
      cy.get('tbody [type="checkbox"]').first().uncheck();
      cy.get('thead [type="checkbox"]').should('not.be.checked');
    });
  
    it('should navigate to detail view', () => {
      cy.get('tbody tr').first().find('button').click();
      cy.contains('View Details').click();
      cy.url().should('include', '/request-dashboard/');
    });
  
    it('should change items per page', () => {
      cy.get('tbody tr').then(($rows) => {
        const initialCount = $rows.length;
        // This assumes you have a dropdown to change items per page
        // You may need to add this functionality to your component
        // cy.get('select').select('20');
        // cy.get('tbody tr').should('have.length', 20);
      });
    });
  
    it('should display empty state when no results', () => {
      cy.get('#search-input').type('nonexistentsearchterm');
      cy.contains('No records found').should('be.visible');
    });
  
    it('should reset filters', () => {
      // Apply some filters
      cy.get('#search-input').type('test');
      cy.contains('button', 'Request Status').click();
      cy.get('[id="pending"]').uncheck();
      cy.contains('button', 'Apply').click();
  
      // Reset
      cy.get('#search-input').clear();
      cy.contains('button', 'Request Status').click();
      cy.contains('button', 'Reset').click();
      cy.contains('button', 'Apply').click();
  
      // Verify all items are visible
      cy.get('tbody tr').should('have.length.greaterThan', 0);
    });
  });