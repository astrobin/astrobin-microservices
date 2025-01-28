/// <reference types="cypress" />

import { Constants } from "../../src/app/shared/constants";

context("uncompressed source uploader", () => {
  beforeEach(() => {
    cy.server();
    cy.route("get", "**/images/image/1", "fixture:api/images/image_1.json").as("getImage");
    cy.route("get", "**/images/thumbnail-group/?image=1", "fixture:api/images/image_1.json").as("getThumbnailGroup");
  });

  describe("when logged out", () => {
    it("should redirect to the login page", () => {
      cy.setupInitializationRoutes();
      cy.route("get", "**/common/userprofiles/current", []).as("getCurrentUserProfile");

      cy.visitPage("/uploader/uncompressed-source/1");
      cy.url().should("contain", "/account/logging-in");
    });
  });

  describe("when logged in", () => {
    beforeEach(() => {
      cy.setupInitializationRoutes();
    });

    describe("when the website is in read-only mode", () => {
      beforeEach(() => {
        cy.login();
        cy.route("get", "**/json-api/common/app-config/", "fixture:api/json/app-config-read-only.json").as("appConfig");
      });

      it("should show the read-only mode alert", () => {
        cy.visitPage("/uploader/uncompressed-source/1");

        cy.get("astrobin-read-only-mode").should("exist");
      });
    });

    describe("when the website is not in read-only mode", () => {
      beforeEach(() => {
        cy.login();

        cy.route("get", "**/common/userprofiles/current", "fixture:api/common/userprofile_current_2.json").as(
          "getCurrentUserProfile"
        );
        cy.route("get", "**/common/users/*", "fixture:api/common/users_2.json").as("getUser");
        cy.route("get", "**/images/image/2", "fixture:api/images/image_2.json").as("getImage");
        cy.route("get", "**/images/thumbnail-group/?image=2", "fixture:api/images/image_2.json").as(
          "getThumbnailGroup"
        );
      });

      it("should not show the read-only mode alert", () => {
        cy.visitPage("/uploader/uncompressed-source/2");

        cy.get("astrobin-read-only-mode").should("not.exist");
      });

      it("should have all form controls", () => {
        cy.visitPage("/uploader/uncompressed-source/2");

        cy.get("#image_file").should("exist");
          cy.get(".file").should("contain.text", "Upload an uncompressed source file");
      });

      it("should have all form controls if user is Premium", () => {
        cy.login();

        cy.route("get", "**/common/userprofiles/current", "fixture:api/common/userprofile_current_2.json").as(
          "getCurrentUserProfile"
        );
        cy.route("get", "**/common/users/*", "fixture:api/common/users_2.json").as("getUser");
        cy.route("get", "**/images/image/2", "fixture:api/images/image_2.json").as("getImage");
        cy.route("get", "**/images/thumbnail-group/?image=2", "fixture:api/images/image_2.json").as(
          "getThumbnailGroup"
        );
        cy.route(
          "GET",
          "**/common/usersubscriptions/?user=*",
          "fixture:api/common/usersubscriptions_2_premium.json"
        ).as("getUserSubscriptions");

        cy.visitPage("/uploader/uncompressed-source/2");

        cy.get("#image_file").should("exist");
      });

      it("should have all form controls if user is Premium (autorenew)", () => {
        cy.login();

        cy.route("get", "**/common/userprofiles/current", "fixture:api/common/userprofile_current_2.json").as(
          "getCurrentUserProfile"
        );
        cy.route("get", "**/common/users/*", "fixture:api/common/users_2.json").as("getUser");
        cy.route("get", "**/images/image/2", "fixture:api/images/image_2.json").as("getImage");
        cy.route("get", "**/images/thumbnail-group/?image=2", "fixture:api/images/image_2.json").as(
          "getThumbnailGroup"
        );
        cy.route(
          "GET",
          "**/common/usersubscriptions/?user=*",
          "fixture:api/common/usersubscriptions_2_premium_autorenew.json"
        ).as("getUserSubscriptions");

        cy.visitPage("/uploader/uncompressed-source/2");

        cy.get("#image_file").should("exist");
      });

      it("should redirect if user is Premium 2020", () => {
        cy.login();

        cy.route(
          "GET",
          "**/common/usersubscriptions/?user=*",
          "fixture:api/common/usersubscriptions_2_premium_2020.json"
        ).as("getUserSubscriptions");

        cy.route("get", "**/common/users/*", "fixture:api/common/users_2.json").as("getUser");

        cy.visitPage("/uploader/uncompressed-source/2");

        cy.url().should("contain", "/permission-denied");
      });

      it("should redirect if user is Free", () => {
        cy.login();

        cy.route("get", "**/common/usersubscriptions/?user=*", "fixture:api/common/usersubscriptions_2_free.json").as(
          "getUserSubscriptions"
        );

        cy.route("get", "**/common/users/*", "fixture:api/common/users_2.json").as("getUser");

        cy.visitPage("/uploader/uncompressed-source/2");

        cy.url().should("contain", "/permission-denied");
      });
    });
  });
});
