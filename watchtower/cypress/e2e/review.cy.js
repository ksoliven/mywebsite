describe('Watchtower inspection review', () => {
  beforeEach(() => {
    cy.visit('/watchtower/');
  });

  it('synchronizes selection between the image and findings list', () => {
    cy.get('#inspection-image').should(($image) => {
      expect($image[0].naturalWidth).to.be.greaterThan(0);
    });
    cy.get('.detection').click();
    cy.get('.detection').should('have.attr', 'aria-pressed', 'true');
    cy.get('.finding').should('have.attr', 'aria-pressed', 'true');
    cy.reload();
    cy.get('.finding').click();
    cy.get('.finding').should('have.attr', 'aria-pressed', 'true');
    cy.get('.detection').should('have.attr', 'aria-pressed', 'true');
  });

  it('updates the count and retains decisions while switching images', () => {
    cy.get('.finding').click();
    cy.get('#confirm').click();
    cy.get('.finding').should('contain.text', 'Confirmed');
    cy.get('#dismiss').click();
    cy.get('.finding').should('contain.text', 'Dismissed');
    cy.get('#findings-summary').should('have.text', '0 to review · 1 reviewed');

    cy.get('#inspection').select('clear');
    cy.get('#findings-summary').should('contain.text', 'No sample detections');
    cy.get('.detection').should('not.exist');
    cy.get('#review-actions').should('not.be.visible');

    cy.get('#inspection').select('cracked');
    cy.get('.finding').should('contain.text', 'Dismissed')
      .and('have.attr', 'aria-pressed', 'false');
  });
});
