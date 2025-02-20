context("Image edit (existing)", () => {
  beforeEach("should init things", () => {
    cy.server();
    cy.setupInitializationRoutes();

    cy.route("get", "**/api/v2/images/image/?hash=abc123&skip-thumbnails=*", "fixture:api/images/image_1_by_hashes.json").as("getImage");
    cy.route("get", "/abc123/0/thumb/hd/", "fixture:api/images/image_thumbnail_1_regular_loaded").as("getThumbnail");
    cy.route(
      "GET",
      "**/api/v2/remote-source-affiliation/remote-source-affiliate/",
      "fixture:api/remote-source-affiliation/remote-source-affiliates.json"
    ).as("getRemoteSourceAffiliates");
    cy.route("get", "**/api/v2/groups/group/?members=1", "fixture:api/groups/groups.json").as("getGroups");
    cy.route("get", "**/api/v2/astrobin/collection/?user=1", "fixture:api/collections/no_collections.json").as("getCollection");
    cy.route("get", "**/api/v2/users/locations/", { count: 0, results: [] }).as("getUsersLocations");

    cy.route("get", "**/api/v2/equipment/brand/1/", "fixture:api/equipment_v2/brand_1.json").as("getBrand1");
    cy.route("get", /.*\/api\/v2\/equipment\/telescope\/1\//, "fixture:api/equipment_v2/telescope_1.json").as(
      "getTelescope1"
    );
    cy.route("get", /.*\/api\/v2\/equipment\/telescope\/2\//, "fixture:api/equipment_v2/telescope_2.json").as(
      "getTelescope2"
    );
    cy.route("get", /.*\/api\/v2\/equipment\/telescope\/3\//, "fixture:api/equipment_v2/telescope_3.json").as(
      "getTelescope3"
    );
    cy.route("get", /.*\/api\/v2\/equipment\/camera\/1\//, "fixture:api/equipment_v2/camera_1.json").as("getCamera1");
    cy.route("get", /.*\/api\/v2\/equipment\/camera\/2\//, "fixture:api/equipment_v2/camera_2.json").as("getCamera2");
    cy.route("get", /.*\/api\/v2\/equipment\/camera\/3\//, "fixture:api/equipment_v2/camera_3.json").as("getCamera3");
    cy.route("get", /.*\/api\/v2\/equipment\/mount\/1\//, "fixture:api/equipment_v2/mount_1.json").as("getMount1");
    cy.route("get", /.*\/api\/v2\/equipment\/filter\/1\//, "fixture:api/equipment_v2/filter_1.json").as("getFilter1");
    cy.route("get", /.*\/api\/v2\/equipment\/accessory\/1\//, "fixture:api/equipment_v2/accessory_1.json").as(
      "getAccessory1"
    );
    cy.route("get", /.*\/api\/v2\/equipment\/software\/1\//, "fixture:api/equipment_v2/software_1.json").as(
      "getSoftware1"
    );

    cy.route("get", /.*\/api\/v2\/equipment\/camera\/recently-used\/.*/, []).as("recentlyUsedCameras");
    cy.route("get", /.*\/api\/v2\/equipment\/telescope\/recently-used\/.*/, []).as("recentlyUsedTelescopes");
    cy.route("get", /.*\/api\/v2\/equipment\/mount\/recently-used\/.*/, []).as("recentlyUsedMounts");
    cy.route("get", /.*\/api\/v2\/equipment\/filter\/recently-used\/.*/, []).as("recentlyUsedFilters");
    cy.route("get", /.*\/api\/v2\/equipment\/accessory\/recently-used\/.*/, []).as("recentlyUsedAccessories");
    cy.route("get", /.*\/api\/v2\/equipment\/software\/recently-used\/.*/, []).as("recentlyUsedSoftware");

    cy.route("get", "**/api/v2/equipment/equipment-preset/?user=1", []);

    cy.route("get", "**/api/v2/images/image-revision/*", { count: 0, results: [] }).as("getRevisions");

    cy.login();

    cy.route(
      "GET",
      "**/common/userprofiles/current",
      "fixture:api/common/userprofile_current_1_with_locations.json"
    ).as("getCurrentUserProfile");
  });

  it("should navigate to the edit page", () => {
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

  it("should show the Save button", () => {
    cy.get("#save-dropdown").should("not.exist");
    cy.get("#save-button").should("be.visible");
  });

  it("should have prefilled the basic information step", () => {
    cy.get("#image-title-field").should("have.value", "Test image");
    cy.get("#image-description-field").should("have.value", "This is a test");
    cy.get("#image-link-field").should("have.value", "https://www.example.com/1/");
    cy.get("#image-link-to-fits-field").should("have.value", "ftps://www.example.com/file.fits");
  });

  it("should have prefilled the content step", () => {
    cy.get("#image-stepper-basic-information .form-actions .btn").contains("Next").click();

    cy.url().should("contain", "#2");

    cy.get("#image-acquisition-type-field .ng-value").should("contain.text", "Regular");
    cy.get("#image-subject-type-field .ng-value").should("contain.text", "Deep sky");
    cy.get("#image-data-source-field .ng-value").should("contain.text", "Backyard");

    cy.get("#image-groups-field .ng-value").contains("First test group").should("exist");
    cy.get("#image-groups-field .ng-value").contains("Second test group").should("exist");
    cy.get("#image-groups-field .ng-value").contains("Third test group").should("exist");
  });

  it("should have locations", () => {
    cy.get("#image-locations-field").click();

    cy.get("#image-locations-field .ng-value").contains("Home observatory").should("exist");

    cy.get("#image-locations-field .ng-option").contains("Backyard observatory").should("exist");
  });

  it("should have prefilled the watermark step", () => {
    cy.get("#image-stepper-content .form-actions .btn").contains("Next").click();

    // Skip over thumbnail step.
    cy.get("#image-stepper-thumbnail .form-actions .btn").contains("Next").click();

    cy.url().should("contain", "#4");

    cy.get("#image-watermark-field").should("be.checked");
    cy.get("#image-watermark-text-field").should("have.value", "Copyright astrobin-dev");
    cy.get("#image-watermark-position-field .ng-value").should("contain.text", "Bottom left");
    cy.get("#image-watermark-size-field .ng-value").should("contain.text", "Medium");
    cy.get("#image-watermark-opacity-field").should("have.value", "50");
  });

  it("should have prefilled the equipment step", () => {
    cy.get("#image-stepper-watermark .form-actions .btn").contains("Next").click();

    cy.url().should("contain", "#5");

    cy.get("#image-imaging-telescopes-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-imaging-telescopes-field .ng-value span").contains("Test Telescope 1").should("be.visible");

    cy.get("#image-imaging-telescopes-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-imaging-telescopes-field .ng-value span").contains("Test Telescope 2").should("be.visible");

    cy.get("#image-imaging-cameras-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-imaging-cameras-field .ng-value span").contains("Test Camera 1").should("be.visible");

    cy.get("#image-imaging-cameras-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-imaging-cameras-field .ng-value span").contains("Test Camera 2").should("be.visible");

    cy.get("#image-mounts-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-mounts-field .ng-value span").contains("Test Mount 1").should("be.visible");

    cy.get("#image-filters-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-filters-field .ng-value span").contains("Test Filter 1").should("be.visible");

    cy.get("#image-accessories-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-accessories-field .ng-value span").contains("Test Accessory 1").should("be.visible");

    cy.get("#image-software-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-software-field .ng-value span").contains("Test Software 1").should("be.visible");

    cy.get("#image-guiding-telescopes-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-guiding-telescopes-field .ng-value span").contains("Test Telescope 3").should("be.visible");

    cy.get("#image-guiding-cameras-field .ng-value span").contains("Test Brand").should("be.visible");
    cy.get("#image-guiding-cameras-field .ng-value span").contains("Test Camera 3").should("be.visible");
  });

  it("should have prefilled the settings step", () => {
    cy.get("#image-stepper-equipment .form-actions .btn").contains("Next").click();

    cy.url().should("contain", "#6");

    cy.get("#image-license-field .ng-value").should(
      "contain.text",
      "Attribution-NonCommercial-ShareAlike Creative Commons"
    );
    cy.get("#image-mouse-hover-image-field .ng-value").should("contain.text", "Inverted monochrome");
    cy.get("#image-allow-comments-field").should("be.checked");
  });

  it("should show warning if in read-only mode", () => {
    cy.route("get", "**/json-api/common/app-config/", "fixture:api/json/app-config-read-only.json").as("appConfig");
    cy.visitPage("/i/abc123/edit");
    cy.get("astrobin-read-only-mode").should("exist");
  });
});
