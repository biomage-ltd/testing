/// <reference types="cypress" />
import '../../support/commands';

const resizeObserverLoopErrRe = /ResizeObserver loop limit exceeded/;
const gem2sStepTimeOut = (60 * 1000) * 5; // 5 minutes;
const qcStepTimeOut = (60 * 1000) * 30; // 30 minutes;

describe('Launches analysis successfully', () => {
  // before each test:
  //   1. set up the network intercepts
  //   2. Log in into biomage
  //   3. Visit data-management
  beforeEach(() => {
    // Intercept GET calls to */projects/* endpoint
    cy.intercept(
      {
        method: 'GET',
        url: '**/projects',
      },
    ).as('getProjects');

    // Intercept GET calls to */experiments/* endpoint
    cy.intercept(
      {
        method: 'GET',
        url: '**/experiments',
      },
    ).as('getExperiment');

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

  it('launches analysis', () => {
    cy.wait('@getProjects').then(({ response }) => {
      const projects = response.body;

      projects.forEach((project) => {
        // Listen on websocket to get back GEM2S result
        const experimentId = project.experiments[0];
        cy.selectProject(project.name);

        cy.wait('@getExperiment');

        cy.launchAnalysis();

        cy.waitForGem2s(experimentId);

        // Waiting for data-processing to show up
        cy.contains('.data-test-page-header', 'Data Processing', { timeout: gem2sStepTimeOut }).should('exist');

        // Wait for QC to complete
        cy.waitForQc(experimentId);

        // Go back to Data Management to launch other analysis once GEM2S is done
        cy.navigateTo('Data Management');
      });
    });
  });
});
