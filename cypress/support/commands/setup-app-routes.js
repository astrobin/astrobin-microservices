Cypress.Commands.add("setupAppRoutes", () => {
  cy.route("GET", "**/json-api/common/app-config/", "fixture:api/json/app-config.json").as("appConfig");
  cy.route("GET", "**/json-api/common/request-country/", { country: "us" }).as("requestCountry");
  cy.route("GET", "**/assets/i18n/*.po?version=*", []).as("i18n");
  cy.route("GET", "**/service-worker-control/", { swEnabled: false}).as("serviceWorkerControl");
});
