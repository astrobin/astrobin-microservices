import { BackendConfigInterface } from "@shared/interfaces/backend-config.interface";

export class BackendConfigGenerator {
  static backendConfig(): BackendConfigInterface {
    return {
      version: "v2.0.0",
      i18nHash: "bc587c72ede144236ed01f2f5f8b290e",
      readOnly: false,
      PREMIUM_MAX_IMAGES_FREE: 10,
      PREMIUM_MAX_IMAGES_LITE: 12,
      PREMIUM_MAX_IMAGES_FREE_2020: 10,
      PREMIUM_MAX_IMAGES_LITE_2020: 50,
      PREMIUM_MAX_IMAGES_PREMIUM_2020: 999999,
      PREMIUM_MAX_IMAGE_SIZE_FREE_2020: 1024 * 1024 * 25,
      PREMIUM_MAX_IMAGE_SIZE_LITE_2020: 1024 * 1024 * 25,
      PREMIUM_MAX_IMAGE_SIZE_PREMIUM_2020: 1024 * 1024 * 50,
      PREMIUM_MAX_REVISIONS_FREE_2020: 0,
      PREMIUM_MAX_REVISIONS_LITE_2020: 1,
      PREMIUM_MAX_REVISIONS_PREMIUM_2020: 5,
      PREMIUM_PRICE_FREE_2020: 0,
      PREMIUM_PRICE_LITE_2020: 20,
      PREMIUM_PRICE_PREMIUM_2020: 40,
      PREMIUM_PRICE_ULTIMATE_2020: 60
    };
  }
}
