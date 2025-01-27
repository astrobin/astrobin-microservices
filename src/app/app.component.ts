import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, Renderer2 } from "@angular/core";
import { NavigationEnd, NavigationStart, Router } from "@angular/router";
import { MainState } from "@app/store/state";
import { Store } from "@ngrx/store";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { ThemeService } from "@shared/services/theme.service";
import { WindowRefService } from "@shared/services/window-ref.service";
import { NotificationsApiService } from "@features/notifications/services/notifications-api.service";
import { selectRequestCountry } from "@app/store/selectors/app/app.selectors";
import { catchError, filter, map, switchMap, take } from "rxjs/operators";
import { UtilsService } from "@shared/services/utils/utils.service";
import { CookieConsentService } from "@shared/services/cookie-consent/cookie-consent.service";
import { CookieConsentEnum } from "@shared/types/cookie-consent.enum";
import { Observable, Subscription, timer } from "rxjs";
import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { NgbOffcanvas, NgbPaginationConfig } from "@ng-bootstrap/ng-bootstrap";
import { Constants } from "@shared/constants";
import { TransferState } from "@angular/platform-browser";
import { CLIENT_IP, CLIENT_IP_KEY } from "@app/client-ip.injector";
import { LoadingService } from "@shared/services/loading.service";
import { TitleService } from "@shared/services/title/title.service";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Platform } from "@ionic/angular";
import { ScrollService } from "@shared/services/scroll.service";
import { VersionCheckService } from "@shared/services/version-check.service";
import { JsonApiService } from "@shared/services/api/classic/json/json-api.service";
import { GetUnreadCount } from "@features/notifications/store/notifications.actions";
import { SetBreadcrumb } from "@app/store/actions/breadcrumb.actions";

declare var dataLayer: any;
declare var gtag: any;

@Component({
  selector: "astrobin-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent extends BaseComponentDirective implements OnInit, OnDestroy {
  private readonly _isBrowser: boolean;
  private _serviceWorkerKillSwitchSubscription: Subscription;

  constructor(
    public readonly store$: Store<MainState>,
    public readonly router: Router,
    public readonly paginationConfig: NgbPaginationConfig,
    public readonly themeService: ThemeService,
    public readonly windowRefService: WindowRefService,
    public readonly notificationApiService: NotificationsApiService,
    public readonly cookieConsentService: CookieConsentService,
    public readonly utilsService: UtilsService,
    @Inject(PLATFORM_ID) public readonly platformId: any,
    public readonly renderer: Renderer2,
    @Inject(DOCUMENT) public document: any,
    public readonly transferState: TransferState,
    @Inject(CLIENT_IP) public readonly clientIp: string,
    public readonly offcanvasService: NgbOffcanvas,
    public readonly loadingService: LoadingService,
    public readonly titleService: TitleService,
    public readonly versionCheckService: VersionCheckService,
    public readonly jsonApiService: JsonApiService,
    public readonly platform: Platform,
    public readonly scrollService: ScrollService
  ) {
    console.log("AstroBin: Welcome to the AstroBin app!");

    super(store$);

    this._isBrowser = isPlatformBrowser(platformId);

    if (!this._isBrowser) {
      // On the server-side, add the IP to the TransferState
      this.transferState.set(CLIENT_IP_KEY, this.clientIp);
    }

    this.initRouterEvents();
    this.initPagination();
    this.markNotificationAsRead();
    this.themeService.setTheme();
  }

  ngOnInit(): void {
    console.log("AstroBin: App component initialized");

    if (this.platform.is("capacitor")) {
      this.platform.ready().then(() => {
        this._initStatusBar();
      });
    }

    if (this._isBrowser && Object.keys(this.windowRefService.nativeWindow).indexOf("Cypress") === -1) {
      this.includeAnalytics$().subscribe(includeAnalytics => {
        if (includeAnalytics) {
          this.utilsService.insertScript(
            `https://www.googletagmanager.com/gtag/js?id=${Constants.GOOGLE_ANALYTICS_ID}`,
            this.renderer
          );
          this.utilsService.insertScript(
            `https://www.googletagmanager.com/gtm.js?id=${Constants.GOOGLE_TAG_MANAGER_ID}`,
            this.renderer,
            () => {
              this._initGtag();
            });
        }
      });
    }

    this._startPollingForServiceWorkerKillSwitch();
    this._suppressPwaInstallationPrompt();
    this._initGoogleAnalytics();
  }

  ngOnDestroy(): void {
    if (this._serviceWorkerKillSwitchSubscription) {
      this._serviceWorkerKillSwitchSubscription.unsubscribe();
    }
  }

  initPagination(): void {
    this.paginationConfig.pageSize = 50;
    this.paginationConfig.maxSize = 5;
    this.paginationConfig.rotate = true;
  }

  initRouterEvents(): void {
    this.router.events?.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loadingService.setLoading(true);
      } else if (event instanceof NavigationEnd) {
        this.loadingService.setLoading(false);
        this.store$.dispatch(new SetBreadcrumb({ breadcrumb: [] }));
        this.windowRefService.changeBodyOverflow("auto");
        this.offcanvasService.dismiss();
        this.tagGoogleAnalyticsPage(event.urlAfterRedirects);
        this.setCanonicalUrl(event.urlAfterRedirects);
        this.setMetaTags(event.urlAfterRedirects);

        if (this._isBrowser) {
          this.currentUser$.pipe(
            filter(currentUser => !!currentUser),
            take(1)
          ).subscribe(() => {
            this.utilsService.delay(500).subscribe(() => {
              this.store$.dispatch(new GetUnreadCount());
            });
          });
        }
      }
    });
  }

  includeAnalytics$(): Observable<boolean> {
    return this.store$.select(selectRequestCountry).pipe(
      filter(requestCountry => !!requestCountry),
      take(1),
      map(requestCountry => {
        const isGDPRCountry = UtilsService.isGDPRCountry(requestCountry);
        const hasCookieConsent = this.cookieConsentService.cookieGroupAccepted(CookieConsentEnum.ANALYTICS);

        return !isGDPRCountry || hasCookieConsent;
      })
    );
  }

  tagGoogleAnalyticsPage(url: string): void {
    if (!this._isBrowser) {
      return;
    }

    if (typeof gtag !== "undefined") {
      this.includeAnalytics$().subscribe(includeAnalytics => {
        if (includeAnalytics) {
          gtag("config", Constants.GOOGLE_ANALYTICS_ID, {
            page_path: url
          });
        }
      });
    }
  }

  setCanonicalUrl(url: string): void {
    const canonicalUrl =
      this.windowRefService.nativeWindow.location.protocol +
      "//" +
      this.windowRefService.nativeWindow.location.host +
      url;
    let link: HTMLLinkElement = this.document.createElement("link");

    link.setAttribute("rel", "canonical");
    this.document.head.appendChild(link);
    link.setAttribute("href", canonicalUrl);
  }

  setMetaTags(url: string): void {
    this.titleService.addMetaTag({
      property: "og:type",
      content: "website"
    });
    this.titleService.addMetaTag({
      property: "og:url",
      content:
        this.windowRefService.nativeWindow.location.protocol +
        "//" +
        this.windowRefService.nativeWindow.location.host +
        url
    });
  }

  markNotificationAsRead() {
    if (!this._isBrowser) {
      return;
    }

    this.currentUser$.pipe(
      filter(currentUser => !!currentUser),
      take(1)
    ).subscribe(() => {
      const url = this.windowRefService.getCurrentUrl();

      if (!!url && url.searchParams.get("utm_medium") === "email") {
        const fromUserPk = url.searchParams.get("from_user");
        this.notificationApiService
          .markAsReadByPathAndUser(url.pathname, fromUserPk !== "None" ? +fromUserPk : null)
          .subscribe();
      }
    });
  }

  private _startPollingForServiceWorkerKillSwitch(): void {
    if (!this._isBrowser) {
      return;
    }

    this._serviceWorkerKillSwitchSubscription = timer(0, 30000) // Start immediately, then every 30 seconds
      .pipe(
        switchMap(() =>
          this.jsonApiService.serviceWorkerEnabled().pipe(
            catchError((err) => {
              console.error("Kill switch API error:", err);
              return []; // Return empty to avoid breaking the stream
            })
          )
        )
      )
      .subscribe((enabled: boolean) => {
        if (!enabled) {
          console.log("Kill switch activated. Unregistering Service Worker...");
          this._disableServiceWorker();
        } else {
          console.log("Kill switch deactivated. Registering Service Worker...");
          this._enableServiceWorker();
        }
      });
  }

  private _disableServiceWorker(): void {
    if (!this._isBrowser) {
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.unregister().then(() => {
            console.log("Service Worker unregistered");
          });
        }
      });
    }
  }

  private _enableServiceWorker(): void {
    if (!this._isBrowser) {
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (!registration) {
          navigator.serviceWorker
            .register("/ngsw-worker.js")
            .then(() => {
              console.log("Service Worker registered");
              this.versionCheckService.checkForUpdates();
            })
            .catch((err) => {
              console.error("Service Worker registration failed:", err);
            });
        } else {
          this.versionCheckService.checkForUpdates();
        }
      });
    }
  }

  private _suppressPwaInstallationPrompt(): void {
    if (this._isBrowser) {
      this.windowRefService.nativeWindow.addEventListener("beforeinstallprompt", event => {
        event.preventDefault();
      });
    }
  }

  private _initGoogleAnalytics(): void {
    if (this._isBrowser && Object.keys(this.windowRefService.nativeWindow).indexOf("Cypress") === -1) {
      this.includeAnalytics$().subscribe(includeAnalytics => {
        if (includeAnalytics) {
          this.utilsService.insertScript(
            `https://www.googletagmanager.com/gtag/js?id=${Constants.GOOGLE_ANALYTICS_ID}`,
            this.renderer
          );
          this.utilsService.insertScript(
            `https://www.googletagmanager.com/gtm.js?id=${Constants.GOOGLE_TAG_MANAGER_ID}`,
            this.renderer,
            () => {
              this._initGtag();
            });
        }
      });
    }
  }

  private _initGtag(): void {
    if (!this._isBrowser) {
      return;
    }

    try {
      dataLayer = dataLayer || [];
    } catch (e) {
      return;
    }

    // @ts-ignore
    gtag("js", new Date());

    // @ts-ignore
    gtag("config", Constants.GOOGLE_ANALYTICS_ID, {
      linker: {
        domains: [
          "www.astrobin.com",
          "app.astrobin.com",
          "welcome.astrobin.com",
          "de.welcome.astrobin.com",
          "es.welcome.astrobin.com",
          "fr.welcome.astrobin.com",
          "it.welcome.astrobin.com",
          "pt.welcome.astrobin.com"
        ],
        accept_incoming: true
      }
    });

    // @ts-ignore
    gtag("config", "AW-1062298010");
  }

  private async _initStatusBar() {
    try {
      await StatusBar.setStyle({style: Style.Dark});
    } catch (e) {
      console.error("Error changing status bar color", e);
    }
  }
}
