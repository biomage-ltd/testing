/// <reference types="cypress" />
import '../../support/commands';

const resizeObserverLoopErrRe = /ResizeObserver loop limit exceeded/;
const projectName = 'Pequeninos Sample';
const projectDescription = 'Tissue sample from varelse species known as pequeninos.';

describe('Creates a new project when authenticated', () => {
  // before each test:
  //   1. set up the network intercepts
  //   2. Log in into biomage
  //   3. Visit data-management
  beforeEach(() => {
    // Intercept PUT/DELETE calls to */project/* endpoing
    cy.intercept(
      {
        method: 'POST',
        url: '*/projects/*',
      },
    ).as('newProject');

    cy.intercept(
      {
        method: 'DELETE',
        url: '*/projects/*',
      },
    ).as('deleteProject');

    cy.login();
    cy.visit('/data-management');
  });

  // we have some kind of resize observer loop error that needs looking into
  Cypress.on('uncaught:exception', (err) => {
    if (resizeObserverLoopErrRe.test(err.message)) {
      return false;
    }
    return true;
  });

  it('creates a new project', () => {
    cy.createProject(projectName, projectDescription);

    // Check that the current active project contains the project title & description
    cy.get('#project-details').should(($p) => {
      expect($p).to.contain(projectName);
      expect($p).to.contain(projectDescription);
    });

    // Check that the project list (formed by [data-test-class=data-test-project-card-*] elements)
    // contains the project title
    cy.get('[data-test-class=data-test-project-card]').should(($p) => {
      expect($p).to.contain(projectName);
    });
  });

  it('deletes a project', () => {
    cy.deleteProject(projectName);

    // Make sure that the projectName is no longer in the project's list
    cy.get('[data-test-class=data-test-project-card]').contains(projectName).should('not.exist');
  });
});
