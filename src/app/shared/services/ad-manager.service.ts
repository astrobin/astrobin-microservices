import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { WindowRefService } from "@shared/services/window-ref.service";
import { UtilsService } from "@shared/services/utils/utils.service";
import { MainState } from "@app/store/state";
import { Store } from "@ngrx/store";
import { BaseService } from "@shared/services/base.service";
import { LoadingService } from "@shared/services/loading.service";
import { selectRequestCountry } from "@app/store/selectors/app/app.selectors";
import { filter, map, take } from "rxjs/operators";
import { CookieConsentEnum } from "@shared/types/cookie-consent.enum";
import { CookieConsentService } from "@shared/services/cookie-consent/cookie-consent.service";

@Injectable({
  providedIn: "root"
})
export class AdManagerService extends BaseService {
  private _adSlots: { [key: string]: any } = {};
  private readonly _isBrowser: boolean;
  private _publisherId = "47890729";
  private _adConfigurations = {
    'rectangular': {
      adUnitPath: `/${this._publisherId}/astrobin-native-responsive-rectangular`,
      divId: 'div-gpt-ad-1603646272754-0',
      adSize: ['fluid']
    },
    'wide': {
      adUnitPath: `/${this._publisherId}/astrobin-native-responsive-wide`,
      divId: 'div-gpt-ad-1726208728627-0',
      adSize: ['fluid']
    }
  };

  constructor(
    public readonly loadingService: LoadingService,
    public readonly store$: Store<MainState>,
    public readonly windowRefService: WindowRefService,
    @Inject(PLATFORM_ID) public readonly platformId: Object,
    public readonly cookieConsentService: CookieConsentService
  ) {
    super(loadingService);

    this._isBrowser = isPlatformBrowser(platformId);
    if (this._isBrowser) {
      this._initGooglePublisherTag();
    }
  }

  getAdConfig(name: string) {
    return this._adConfigurations[name] || null;
  }

  defineAdSlot(configName: string, adUnitPath: string, size: any[], divId: string): void {
    if (this._isBrowser) {
      const nativeWindow = this.windowRefService.nativeWindow as any;
      if (nativeWindow) {
        nativeWindow.googletag.cmd.push(() => {
          const slot = nativeWindow.googletag.defineSlot(adUnitPath, size, divId);
          if (slot) {
            slot.setTargeting("format", [configName]).addService(nativeWindow.googletag.pubads());
            this._adSlots[divId] = slot;
          }
        });
      }
    }
  }

  displayAd(divId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this._isBrowser) {
        const nativeWindow = this.windowRefService.nativeWindow as any;
        if (nativeWindow) {
          const slot = this._adSlots[divId];
          if (!slot) {
            resolve(false);
            return;
          }

          const renderListener = (event) => {
            if (event.slot === slot) {
              nativeWindow.googletag.pubads().removeEventListener('slotRenderEnded', renderListener);

              if (event.isEmpty) {
                resolve(false);
              } else {
                // Add slotOnload listener only if we're expecting an ad
                const loadListener = (loadEvent) => {
                  if (loadEvent.slot === slot) {
                    nativeWindow.googletag.pubads().removeEventListener('slotOnload', loadListener);
                    resolve(true);
                  }
                };
                nativeWindow.googletag.pubads().addEventListener('slotOnload', loadListener);
              }
            }
          };

          nativeWindow.googletag.pubads().addEventListener('slotRenderEnded', renderListener);
          nativeWindow.googletag.cmd.push(() => {
            nativeWindow.googletag.display(divId);
          });
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }

  refreshAd(divId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this._isBrowser) {
        const nativeWindow = this.windowRefService.nativeWindow as any;
        if (nativeWindow && this._adSlots[divId]) {
          const slot = this._adSlots[divId];

          const listener = (event) => {
            if (event.slot === slot) {
              nativeWindow.googletag.pubads().removeEventListener('slotRenderEnded', listener);
              resolve(!event.isEmpty);
            }
          };

          nativeWindow.googletag.pubads().addEventListener('slotRenderEnded', listener);
          nativeWindow.googletag.cmd.push(() => {
            nativeWindow.googletag.pubads().refresh([this._adSlots[divId]]);
          });
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }

  destroyAdSlot(divId: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this._isBrowser) {
        const nativeWindow = this.windowRefService.nativeWindow as any;
        nativeWindow.googletag.cmd.push(() => {
          const slot = this._adSlots[divId];
          if (slot) {
            nativeWindow.googletag.destroySlots([slot]);
            delete this._adSlots[divId];
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private _initGooglePublisherTag() {
    const nativeWindow = this.windowRefService.nativeWindow as any;
    if (nativeWindow) {
      this.store$.select(selectRequestCountry).pipe(
        filter(requestCountry => !!requestCountry),
        take(1),
        map(requestCountry => {
          if (requestCountry === "UNKNOWN") {
            requestCountry = "US";
          }

          const isGDPRCountry = UtilsService.isGDPRCountry(requestCountry);
          const hasCookieConsent = this.cookieConsentService.cookieGroupAccepted(CookieConsentEnum.ADVERTISING);

          nativeWindow.googletag = nativeWindow.googletag || {};
          nativeWindow.googletag.cmd = nativeWindow.googletag.cmd || [];
          nativeWindow.googletag.cmd.push(() => {
            nativeWindow.googletag.pubads().enableSingleRequest();
            nativeWindow.googletag.enableServices();

            if (isGDPRCountry && !hasCookieConsent) {
              nativeWindow.googletag.pubads().setPrivacySettings({
                limitedAds: true,
                nonPersonalizedAds: true,
                restrictDataProcessing: true
              });
            }
          });
        })
      ).subscribe();
    }
  }
}
