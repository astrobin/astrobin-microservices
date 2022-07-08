import { testBrand, testSoftware } from "../../../support/commands/equipment-item-browser-utils";

context("Equipment", () => {
  beforeEach(() => {
    cy.server();
    cy.setupInitializationRoutes();
    cy.setupEquipmentDefaultRoutes();

    cy.route("get", "**/api/v2/equipment/software-edit-proposal/?edit_proposal_target=*", { results: [] });
  });

  context("Explorer", () => {
    context("Select existing", () => {
      it("should select existing item", () => {
        cy.login();
        cy.visitPage("/equipment/explorer/software");

        cy.route("get", "**/api/v2/equipment/software/?q=*", {
          count: 1,
          next: null,
          previous: null,
          results: [testSoftware]
        }).as("findSoftwareItems");

        cy.route("get", "**/api/v2/equipment/software/?page=*", {
          count: 1,
          next: null,
          previous: null,
          results: [testSoftware]
        }).as("getSoftwareItems");

        cy.route("get", "**/api/v2/equipment/brand/1/", testBrand).as("getBrand");

        // cy.get("#equipment-item-field  + .toggle-enable-fullscreen").click();
        cy.ngSelectType("#equipment-item-field", "Test");
        cy.wait("@findSoftwareItems");

        cy.ngSelectShouldHaveOptionsCount("#equipment-item-field", 1);
        cy.ngSelectOptionNumberSelectorShouldContain(
          "#equipment-item-field",
          1,
          "astrobin-equipment-item-summary .label .brand",
          "Test brand"
        );
        cy.ngSelectOptionNumberSelectorShouldContain(
          "#equipment-item-field",
          1,
          "astrobin-equipment-item-summary .label .name",
          "Test"
        );

        cy.ngSelectOptionClick("#equipment-item-field", 1);
        cy.equipmentItemBrowserShouldContain("#equipment-item-field", "Test brand", "Test software");
      });

      it("should update the URL with ID and slug", () => {
        cy.url().should("include", `/equipment/explorer/software/${testSoftware.id}/test-brand-test`);
      });

      it("should show the item", () => {
        cy.get(".card astrobin-equipment-item-summary .label .brand")
          .contains("Test brand")
          .should("be.visible");
        cy.get(".card astrobin-equipment-item-summary .label .name")
          .contains("Test")
          .should("be.visible");
      });
    });
  });
});
