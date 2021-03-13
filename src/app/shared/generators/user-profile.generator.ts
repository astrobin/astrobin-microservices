import { UserProfileInterface } from "@shared/interfaces/user-profile.interface";

export class UserProfileGenerator {
  static userProfile(): UserProfileInterface {
    return {
      id: 1,
      deleted: null,
      updated: new Date("2010-01-01"),
      realName: "Foo Bar",
      website: "http://www.foobar.com",
      job: "Astronomer",
      hobbies: "Fooing",
      timezone: null,
      about: "Lorem ipsum",
      premiumOffer: null,
      premiumOfferSent: null,
      premiumOfferExpiration: null,
      companyName: null,
      companyWebsite: null,
      companyDescription: null,
      retailerCountry: null,
      avatar: null,
      excludeFromCompetition: false,
      defaultFrontPageSection: "gobal",
      defaultGallerySorting: 0,
      defaultLicense: 0,
      defaultWatermark: false,
      defaultWatermarkText: "Copyright Foo Bar",
      defaultWatermarkSize: "M",
      defaultWatermarkPosition: 0,
      defaultWatermarkOpacity: 0.5,
      acceptTos: true,
      openNotificationsInNewTab: null,
      receiveNewsletter: true,
      receiveImportantCommunications: true,
      receiveMarketingAndCommercialMaterial: false,
      allowAstronomyAds: true,
      inactiveAccountReminderSent: null,
      language: "en",
      seenRealName: true,
      seenEmailPermissions: true,
      signature: null,
      signatureHtml: null,
      showSignatures: false,
      postCount: 0,
      autoSubscribe: true,
      receiveForumEmails: true,
      user: 1,
      telescopes: [],
      mounts: [],
      cameras: [],
      focalReducers: [],
      software: [],
      filters: [],
      accessories: [],
      astroBinIndex: 0.0,
      followers: 0,
      premiumCounter: 0
    };
  }
}
