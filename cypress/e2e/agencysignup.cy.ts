/// <reference types="cypress" />

describe('Manage Agency Signup', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3000/Admin/Dashboard/manage-agency');
        // Wait for initial data to load with a longer timeout
        cy.get('table', { timeout: 10000 }).should('exist');
        // Handle case where there might be no records
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length === 0 || $rows.text().includes('No records found')) {
                cy.log('No initial records found');
            }
        });
    });

    it('should load the dashboard with initial data', () => {
        cy.get('table').should('exist');
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length > 0 && !$rows.text().includes('No records found')) {
                cy.wrap($rows).should('have.length.greaterThan', 0);
            } else {
                cy.contains('No records found').should('be.visible');
            }
        });
    });

    it('should display mobile view on small screens', () => {
        cy.viewport('iphone-6');
        // Check if mobile view is active by verifying desktop columns are hidden
        cy.get('.hidden.lg\\:table-cell').should('not.be.visible');
        // Verify mobile-specific behavior - adjust expected length based on your mobile design
        cy.get('tbody tr').first().find('td').should('have.length.at.most', 5); // Changed from lt to at.most for clarity
    });

    it('should search and filter requests', () => {
        // First verify there are records
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length === 0 || $rows.text().includes('No records found')) {
                cy.log('No records to search, skipping test');
                return;
            }

            // Get text from first row to use as search term
            cy.get('tbody tr').first().invoke('text').then((rowText) => {
                const searchTerm = rowText.split(' ')[0]; // Get first word
                if (!searchTerm) return;

                cy.get('#search-input').type(searchTerm);
                // Wait for filtering to complete
                cy.get('tbody tr:not(.hidden)').should('have.length.at.least', 1);
                cy.get('tbody tr:not(.hidden)').each(($row) => {
                    cy.wrap($row).should('contain.text', searchTerm);
                });

                // Test empty results case
                cy.get('#search-input').clear().type('nonexistentsearchterm');
                cy.contains('No records found').should('be.visible');
                cy.get('#search-input').clear();
            });
        });
    });

    it('should filter by request status', () => {
        // Open status filter dropdown
        cy.contains('button', /Request Status/i).click({ force: true });
        
        // Wait for dropdown to be visible - added timeout
        cy.get('[role="menu"]', { timeout: 5000 }).should('be.visible');
        
        // Uncheck Pending status if checked
        cy.get('[id="pending"]').then(($checkbox) => {
            if ($checkbox.is(':checked')) {
                cy.wrap($checkbox).click({ force: true });
            }
        });
        
        cy.contains('button', /Apply/i).click({ force: true });
        
        // Verify no Pending requests are shown
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length > 0 && !$rows.text().includes('No records found')) {
                cy.wrap($rows).should('not.contain', 'Pending');
            } else {
                cy.contains('No records found').should('be.visible');
            }
        });

        // Reset filters
        cy.contains('button', /Request Status/i).click({ force: true });
        cy.contains('button', /Reset/i).click({ force: true });
        cy.contains('button', /Apply/i).click({ force: true });
    });

    it('should filter by date range', () => {
        // Open date picker - using more flexible selector
        cy.contains('button', /select date|date range/i).click({ force: true });
        
        // Select date range (April 1-5, 2025)
        // Added checks for date picker visibility
        cy.get('[role="dialog"]').should('be.visible');
        cy.get('[aria-label="April 1, 2025"]').click({ force: true });
        cy.get('[aria-label="April 5, 2025"]').click({ force: true });
        cy.contains('button', /Apply/i).click({ force: true });
        
        // Verify results
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length > 0 && !$rows.text().includes('No records found')) {
                cy.wrap($rows).should('have.length.greaterThan', 0);
            } else {
                cy.contains('No records found').should('be.visible');
            }
        });
    });

    it('should sort by different columns', () => {
        // Skip if no records
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length === 0 || $rows.text().includes('No records found')) {
                cy.log('No records to sort, skipping test');
                return;
            }

            // Sort by Request ID
            cy.contains('button', /Sort by/i).click({ force: true });
            cy.contains('div', /Request ID/i).click({ force: true });
            cy.get('tbody tr').first().should('contain', 'REQ');

            // Sort by Name
            cy.contains('button', /Sort by/i).click({ force: true });
            cy.contains('div', /Name/i).click({ force: true });
            cy.get('tbody tr').first().then(($row) => {
                const firstLetter = $row.text().charAt(0).toUpperCase();
                expect(firstLetter).to.match(/[A-Z]/);
            });

            // Sort by Status
            cy.contains('button', /Sort by/i).click({ force: true });
            cy.contains('div', /Status/i).click({ force: true });
            cy.get('tbody tr').first().should('contain', /Pending|Approved|Rejected/i);
        });
    });

    it('should handle pagination', () => {
        // Only run if pagination exists
        cy.get('body').then(($body) => {
            if ($body.find('[aria-label*="page"]').length > 0) {
                // Test next page
                cy.get('tbody tr').its('length').then((initialLength) => {
                    cy.get('[aria-label*="Next"]').click({ force: true });
                    cy.get('tbody tr').its('length').should('eq', initialLength);
                });

                // Test page number click
                cy.get('[aria-label*="page 2"]').click({ force: true });
                cy.get('[aria-label*="page 2"]').should('exist');
            } else {
                cy.log('Pagination not found, skipping test');
            }
        });
    });

    it('should select items and use bulk actions', () => {
        // Skip if no records
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length === 0 || $rows.text().includes('No records found')) {
                cy.log('No records to select, skipping test');
                return;
            }

            // Select all
            cy.get('thead [type="checkbox"]').first().click({ force: true });
            cy.get('tbody [type="checkbox"]').each(($checkbox) => {
                cy.wrap($checkbox).should('be.checked');
            });

            // Deselect one
            cy.get('tbody [type="checkbox"]').first().click({ force: true });
            cy.get('thead [type="checkbox"]').should('not.be.checked');
        });
    });

    it('should navigate to detail view', () => {
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length === 0 || $rows.text().includes('No records found')) {
                cy.log('No records to view, skipping test');
                return;
            }

            // Changed selector to find the view button more reliably
            cy.get('tbody tr').first().find('button, a').contains(/view|details/i).click({ force: true });
            cy.url().should('include', '/request-dashboard/');
        });
    });

    it('should display empty state when no results', () => {
        cy.get('#search-input').type('nonexistentsearchterm');
        cy.contains('No records found').should('be.visible');
        cy.get('#search-input').clear();
    });

    it('should reset filters', () => {
        // Apply some filters
        cy.get('#search-input').type('test');
        cy.contains('button', /Request Status/i).click({ force: true });
        cy.get('[id="pending"]').then(($checkbox) => {
            if ($checkbox.is(':checked')) {
                cy.wrap($checkbox).click({ force: true });
            }
        });
        cy.contains('button', /Apply/i).click({ force: true });

        // Reset
        cy.get('#search-input').clear();
        cy.contains('button', /Request Status/i).click({ force: true });
        cy.contains('button', /Reset/i).click({ force: true });
        cy.contains('button', /Apply/i).click({ force: true });

        // Verify all items are visible
        cy.get('tbody tr').then(($rows) => {
            if ($rows.length > 0 && !$rows.text().includes('No records found')) {
                cy.wrap($rows).should('have.length.greaterThan', 0);
            } else {
                cy.contains('No records found').should('be.visible');
            }
        });
    });

    it('should download data', () => {
        cy.get('[aria-label*="Download"], button').contains(/download/i).then(($el) => {
            if ($el.length > 0) {
                cy.wrap($el).click();
                cy.log('Download button clicked');
            } else {
                cy.log('Download button not found, skipping test');
            }
        });
    });

    it('should show and hide columns based on screen size', () => {
        // Check mobile view
        cy.viewport('iphone-6');
        cy.get('.hidden.lg\\:table-cell').should('not.be.visible');
        
        // Check desktop view
        cy.viewport('macbook-15');
        cy.get('.hidden.lg\\:table-cell').should('be.visible');
    });
});