import { testBrand, testCamera } from "../../support/commands/equipment-item-browser-utils";

context("Image edit (new)", () => {
  beforeEach(() => {
    cy.server();
    cy.setupInitializationRoutes();

    cy.route("get", "**/notifications/notification/get_unread_count", "0").as("getUnreadNotificationsCount");

    cy.route("get", "**/api/v2/images/image/?hash=abc123&skip-thumbnails=*", "fixture:api/images/new_image_1_by_hashes.json").as(
      "getImage"
    );
    cy.route("get", "/abc123/0/thumb/hd/", "fixture:api/images/image_thumbnail_1_regular_loaded").as("getThumbnail");
    cy.route(
      "GET",
      "**/api/v2/remote-source-affiliation/remote-source-affiliate/",
      "fixture:api/remote-source-affiliation/remote-source-affiliates.json"
    ).as("getRemoteSourceAffiliates");
    cy.route("get", "**/api/v2/groups/group/*", "fixture:api/groups/groups.json").as("getGroups");
    cy.route("get", "**/api/v2/astrobin/collection/?user=1", "fixture:api/collections/no_collections.json").as("getCollections");
    cy.route("get", "**/api/v2/users/locations/", { count: 0, results: [] }).as("getUsersLocations");

    cy.route("get", "**/api/v2/equipment/camera/recently-used/*", []);
    cy.route("get", "**/api/v2/equipment/telescope/recently-used/*", []);
    cy.route("get", "**/api/v2/equipment/mount/recently-used/*", []);
    cy.route("get", "**/api/v2/equipment/filter/recently-used/*", []);
    cy.route("get", "**/api/v2/equipment/accessory/recently-used/*", []);
    cy.route("get", "**/api/v2/equipment/software/recently-used/*", []);

    cy.route("get", "**/api/v2/equipment/equipment-preset/?user=1", []);

    cy.route("get", "**/json-api/user/has-legacy-gear/?userId=1", { result: false });

    cy.route("get", "**/api/v2/images/image-revision/*", { count: 0, results: [] }).as("getRevisions");
  });

  it("should navigate to the edit page", () => {
    cy.login();
    cy.visitPage("/i/abc123/edit");
    cy.wait("@getImage");
    cy.wait("@getUsersLocations");
    cy.url().should("contain", "/i/abc123/edit");
  });

  it("should not show the 'new editor' alert", () => {
    cy.get("#new-editor-alert").should("not.exist");
  });

  it("should have all tabs", () => {
    cy.get("#image-stepper-field .nav-link").should("have.length", 7);
  });

  it("should not have any tabs marked as error, since we haven't visited any yet", () => {
    cy.get("#image-stepper-field .nav-item.danger.done").should("not.exist");
  });

  it("should have prefilled the basic information step", () => {
    cy.get("#image-title-field").should("have.value", "Test image");
    cy.get("#image-description-field").should("have.value", "");
    cy.get("#image-link-field").should("have.value", "");
    cy.get("#image-link-to-fits-field").should("have.value", "");
  });

  it("should mark the step as errored if a required field is cleared", () => {
    cy.get("#image-title-field").clear();
    cy.get("#image-stepper-field .nav-item.danger .nav-link").contains("Basic information").should("exist");

    cy.get("#image-title-field").type("Test image");
    cy.get("#image-stepper-field .nav-item.danger .nav-link").contains("Basic information").should("not.exist");
  });

  it("should have prefilled the content step", () => {
    cy.get("#image-stepper-basic-information .form-actions .btn").contains("Next").click();

    cy.url().should("contain", "#2");

    cy.get("#image-acquisition-type-field .ng-value").should("not.exist");
    cy.get("#image-subject-type-field .ng-value").should("not.exist");
    cy.get("#image-data-source-field .ng-value").should("not.exist");

    cy.get("#image-groups-field").should("be.visible");
    cy.get("#image.groups-field .ng-value-container .ng-value").should("have.length", 0);
  });

  it("should select an acquisition type", () => {
    cy.get("#image-acquisition-type-field").click();
    cy.get("#image-acquisition-type-field .ng-option").contains("Regular").click();
    cy.get("#image-acquisition-type-field .ng-value").should("contain.text", "Regular");
  });

  it("should select a subject type", () => {
    cy.get("#image-subject-type-field").click();
    cy.get("#image-subject-type-field .ng-option").contains("Deep sky").click();
    cy.get("#image-subject-type-field .ng-value").should("contain.text", "Deep sky");
    cy.get("#image-solar-system-main-subject-field").should("not.be.visible");
  });

  it("should display solar system main subject field if solar system is selected", () => {
    cy.get("#image-subject-type-field").click();
    cy.get("#image-subject-type-field .ng-option").contains("Solar system").click();
    cy.get("#image-subject-type-field .ng-value").should("contain.text", "Solar system");
    cy.get("#image-solar-system-main-subject-field").should("be.visible");
  });

  it("should select a solar system main subject type", () => {
    cy.get("#image-solar-system-main-subject-field").click();
    cy.get("#image-solar-system-main-subject-field .ng-option").contains("Moon").click();
    cy.get("#image-solar-system-main-subject-field .ng-value").should("contain.text", "Moon");
  });

  it("should select an amateur hosting facility data source", () => {
    cy.get("#image-data-source-field").click();
    cy.get("#image-data-source-field .ng-option").contains("Amateur hosting facility").click();
    cy.get("#image-data-source-field .ng-value").should("contain.text", "Amateur hosting facility");

    cy.get("#image-remote-source-field").should("be.visible");
  });

  it("should select a remote data source", () => {
    cy.get("#image-remote-source-field").click();
    cy.get("#image-remote-source-field .ng-option").contains("DeepSkyWest").click();
    cy.get("#image-remote-source-field .ng-value").should("contain.text", "DeepSkyWest");

    cy.get("#image-remote-source-field").should("be.visible");
  });

  it("should select a backyard data source", () => {
    cy.get("#image-data-source-field").click();
    cy.get("#image-data-source-field .ng-option").contains("Backyard").click();
    cy.get("#image-data-source-field .ng-value").should("contain.text", "Backyard");
    cy.get("#image-remote-source-field").should("not.be.visible");
    cy.get("#image-locations-field").should("be.visible");
  });

  it("should select a group", () => {
    cy.get(".form-text")
      .contains("This field is disabled because you haven't joined any groups yet.")
      .should("not.exist");
    cy.get(".form-text")
      .contains("This setting will take affect after the image will be moved to your public area.")
      .should("exist");

    cy.get("#image-groups-field").click();
    cy.get("#image-groups-field .ng-option").contains("First test group").click();
    cy.get("#image-groups-field .ng-value").should("contain.text", "First test group");
  });

  it("should display remote source if data source is remote", () => {
    cy.get("#image-data-source-field").click();
    cy.get("#image-data-source-field .ng-option").contains("remote").click();
    cy.get("#image-data-source-field .ng-value").should("contain.text", "remote");
    cy.get("#image-remote-source-field").should("be.visible");
  });

  it("should select a remote source", () => {
    cy.get("#image-remote-source-field").click();
    cy.get("#image-remote-source-field .ng-option").contains("ChileScope").click();
    cy.get("#image-remote-source-field .ng-value").should("contain.text", "ChileScope");
  });

  it("should unmark the content step as errored", () => {
    cy.get("#image-stepper-field .nav-item.danger").should("not.exist");
  });

  it("should have prefilled the watermark step", () => {
    cy.get("#image-stepper-content .form-actions .btn").contains("Next").click();

    // Skip over thumbnails step.
    cy.get("#image-stepper-thumbnail .form-actions .btn").contains("Next").click();

    cy.url().should("contain", "#4");

    cy.get("#image-watermark-field").should("not.be.checked");
    cy.get("#image-watermark-text-field").should("have.value", "");
    cy.get("#image-watermark-position-field .ng-value").should("contain.text", "Center");
    cy.get("#image-watermark-size-field .ng-value").should("contain.text", "Medium");
    cy.get("#image-watermark-opacity-field").should("have.value", "10");
  });

  it("should set the watermark checkbox as checked if the watermark text changes", () => {
    cy.get("#image-watermark-text-field").type("Test");
    cy.get("#image-watermark-field").should("be.checked");
  });

  it("should set the watermark checkbox as checked if the watermark position changes", () => {
    cy.get("[for=image-watermark-field]").click();
    cy.get("#image-watermark-field").should("not.be.checked");
    cy.get("#image-watermark-position-field").click();
    cy.get("#image-watermark-position-field .ng-option").contains("Top right").click();
    cy.get("#image-watermark-field").should("be.checked");
  });

  it("should set the watermark checkbox as checked if the watermark size changes", () => {
    cy.get("[for=image-watermark-field]").click();
    cy.get("#image-watermark-field").should("not.be.checked");
    cy.get("#image-watermark-size-field").click();
    cy.get("#image-watermark-size-field .ng-option").contains("Large").click();
    cy.get("#image-watermark-field").should("be.checked");
  });

  it("should set the watermark checkbox as checked if the watermark opacity changes", () => {
    cy.get("[for=image-watermark-field]").click();
    cy.get("#image-watermark-field").should("not.be.checked");
    cy.get("#image-watermark-opacity-field").clear();
    cy.get("#image-watermark-opacity-field").type("100");
    cy.get("#image-watermark-field").should("be.checked");
  });

  it("should have the equipment step", () => {
    cy.get("#image-stepper-watermark .form-actions .btn").contains("Next").click();

    cy.url().should("contain", "#5");

    cy.get("#image-show-guiding-equipment-field").should("not.be.checked");
  });

  it("should add a telescope", () => {
    cy.setupAuthRoutes();
    cy.route("get", "**/api/v2/equipment/brand/1/", "fixture:api/equipment_v2/brand_1.json").as("getBrand1");
    cy.route("get", "**/api/v2/equipment/telescope/*", {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 4,
          deleted: null,
          klass: "TELESCOPE",
          reviewedTimestamp: null,
          reviewerDecision: null,
          reviewerRejectionReason: null,
          reviewerComment: null,
          created: "2021-11-26T14:16:42.850333",
          updated: "2021-11-26T14:16:42.850345",
          name: "Foo 123",
          website: null,
          image: null,
          type: "REFRACTOR_ACHROMATIC",
          aperture: "222.00",
          minFocalLength: "1000.00",
          maxFocalLength: "1000.00",
          weight: null,
          createdBy: 1,
          reviewedBy: null,
          brand: 1,
          group: null,
          variants: []
        }
      ]
    }).as("findTelescopes");

    cy.get("#image-imaging-telescopes-field + .toggle-enable-fullscreen").scrollIntoView().click();
    cy.get("#image-imaging-telescopes-field input[type='text']").type("Foo");
    cy.wait("@findTelescopes");
    cy.wait("@getBrand1");

    cy.get("#image-imaging-telescopes-field .ng-option:first-child").click();
    cy.get("#image-imaging-telescopes-field .ng-select-container .ng-value span")
      .contains("Test Brand")
      .should("be.visible");
    cy.get("#image-imaging-telescopes-field .ng-select-container .ng-value span")
      .contains("Foo 123")
      .should("be.visible");
  });

  it("should create a camera", () => {
    cy.setupEquipmentDefaultRoutes();
    cy.equipmentItemBrowserCreate("#image-imaging-cameras-field", "Test camera", "@findCameras");
    cy.equipmentItemBrowserSelectFirstBrand("#equipment-item-field-brand", "Test Brand", testBrand);
    cy.get("#equipment-item-field-name").should("have.value", "Test camera");
    cy.ngSelectOpen("#camera-field-type");
    cy.ngSelectOptionClick("#camera-field-type", 1);
    cy.ngSelectValueShouldContain("#camera-field-type", "Dedicated deep-sky camera");
    cy.route("post", "**/api/v2/equipment/camera/", testCamera).as("createCamera");
    cy.get("#create-new-item .btn-primary").click();
    cy.get(".modal-title").contains("Confirm item creation").should("be.visible");
    cy.equipmentItemSummaryShouldHaveItem(".modal", "Test Brand", "Test camera");
    cy.equipmentItemSummaryShouldHaveProperty(".modal", "Class", "Camera");
    cy.equipmentItemSummaryShouldHaveProperty(".modal", "Type", "Dedicated deep-sky camera");
    cy.get("[for=confirm-no-typos]").click();
    cy.get("[for=confirm-no-duplication]").click();
    cy.get("[for=confirm-naming-convention]").click();
    cy.get("[for=confirm-unambiguous]").click();
    cy.get("[for=confirm-english]").click();
    cy.get("[for=confirm-no-personal-information]").click();
    cy.get(".modal-footer .btn").contains("Confirm").click();
    cy.wait("@createCamera");
    cy.equipmentItemBrowserShouldContain("#image-imaging-cameras-field", "Test Brand", "Test camera");
  });

  it("should have prefilled the settings step", () => {
    cy.get("#image-stepper-equipment .form-actions .btn").contains("Next").click();

    cy.url().should("contain", "#6");

    cy.get("#image-license-field .ng-value").should(
      "contain.text",
      "Attribution-NonCommercial-ShareAlike Creative Commons"
    );
    cy.get("#image-mouse-hover-image-field .ng-value").should("contain.text", "Plate-solution");
    cy.get("#image-allow-comments-field").should("be.checked");
    cy.get("#image-full-size-display-limitation-field .ng-value").should("contain.text", "Everybody");
  });
});
