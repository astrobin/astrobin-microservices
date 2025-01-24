import { DatePipe, isPlatformBrowser, LocationStrategy, registerLocaleData } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import localeArabic from "@angular/common/locales/ar";
import localeGerman from "@angular/common/locales/de";
import localeGreek from "@angular/common/locales/el";
import localeEnglish from "@angular/common/locales/en";
import localeBritishEnglish from "@angular/common/locales/en-GB";
import localeSpanish from "@angular/common/locales/es";
import localeFinnish from "@angular/common/locales/fi";
import localeFrench from "@angular/common/locales/fr";
import localeItalian from "@angular/common/locales/it";
import localeJapanese from "@angular/common/locales/ja";
import localeDutch from "@angular/common/locales/nl";
import localePolish from "@angular/common/locales/pl";
import localePortuguese from "@angular/common/locales/pt";
import localeUkrainian from "@angular/common/locales/uk";
import localeRussian from "@angular/common/locales/ru";
import localeAlbanian from "@angular/common/locales/sq";
import localeTurkish from "@angular/common/locales/tr";
import localeChinese from "@angular/common/locales/zh";
import localeChineseSimplified from "@angular/common/locales/zh-Hans";
import localeChineseTraditional from "@angular/common/locales/zh-Hant";
import { ErrorHandler, Inject, Injectable, NgModule, PLATFORM_ID } from "@angular/core";
import { BrowserModule, Title, TransferState } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppComponent } from "@app/app.component";
import { mainStateEffects, mainStateReducers, metaReducers, setInitialState } from "@app/store/state";
import { CustomTranslateParser } from "@app/translate-parser";
import { environment } from "@env/environment";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { EffectsModule } from "@ngrx/effects";
import { Store, StoreModule } from "@ngrx/store";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
import { MissingTranslationHandler, TranslateLoader, TranslateModule, TranslateParser } from "@ngx-translate/core";
import { WindowRefService } from "@shared/services/window-ref.service";
import { SharedModule } from "@shared/shared.module";
import { CookieModule, CookieService } from "ngx-cookie";
import { TimeagoClock, TimeagoDefaultFormatter, TimeagoFormatter, TimeagoIntl, TimeagoModule } from "ngx-timeago";
import { AppRoutingModule } from "./app-routing.module";
import { CustomMissingTranslationHandler } from "./missing-translation-handler";
import { translateLoaderFactory } from "./translate-loader";
import * as Sentry from "@sentry/angular";
import { Router, RouteReuseStrategy } from "@angular/router";
import { CLIENT_IP } from "@app/client-ip.injector";
import { TimeagoAppClock } from "@shared/services/timeago-app-clock.service";
import { NGRX_STATE_KEY } from "@shared/services/store-transfer.service";
import { ServiceWorkerModule } from "@angular/service-worker";
import { SearchModule } from "@features/search/search.module";
import { CustomRouteReuseStrategy } from "@app/custom-reuse-strategy";

// Supported languages
registerLocaleData(localeEnglish);
registerLocaleData(localeBritishEnglish);
registerLocaleData(localeFrench);
registerLocaleData(localeGerman);
registerLocaleData(localeItalian);
registerLocaleData(localeSpanish);
registerLocaleData(localePortuguese);
registerLocaleData(localeChineseSimplified);

// Community languages
registerLocaleData(localeArabic);
registerLocaleData(localeGreek);
registerLocaleData(localeFinnish);
registerLocaleData(localeJapanese);
registerLocaleData(localeDutch);
registerLocaleData(localePolish);
registerLocaleData(localeUkrainian);
registerLocaleData(localeRussian);
registerLocaleData(localeAlbanian);
registerLocaleData(localeTurkish);

// Other languages
registerLocaleData(localeChinese);
registerLocaleData(localeChineseTraditional);

export function initFontAwesome(iconLibrary: FaIconLibrary) {
  iconLibrary.addIconPacks(fas, far, fab);
}

@Injectable()
export class AstroBinTimeagoCustomFormatter extends TimeagoDefaultFormatter {
  private _maxTimeago = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  constructor(private datePipe: DatePipe) {
    super();
  }

  format(then: number): string {
    const now = Date.now();
    const diff = now - then;

    if (diff > this._maxTimeago) {
      return this.datePipe.transform(then, "mediumDate") || "";
    }

    return super.format(then);
  }
}

@NgModule({
  imports: [
    // Angular.
    BrowserModule.withServerTransition({ appId: "serverApp" }),
    BrowserAnimationsModule,
    HttpClientModule,
    CookieModule.forRoot(),
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
      registrationStrategy: "registerWhenStable:30000"
    }),
    // Dependencies.
    StoreModule.forRoot(mainStateReducers,
      {
        metaReducers,
        runtimeChecks: {
          strictStateImmutability: false,
          strictActionImmutability: false
        }
      }),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: environment.production // Restrict extension to log-only mode
    }),
    EffectsModule.forRoot(mainStateEffects),

    TimeagoModule.forRoot({
      intl: TimeagoIntl,
      formatter: {
        provide: TimeagoFormatter,
        useClass: AstroBinTimeagoCustomFormatter
      },
      clock: {
        provide: TimeagoClock,
        useClass: TimeagoAppClock
      }
    }),
    TranslateModule.forRoot({
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: CustomMissingTranslationHandler
      },
      parser: {
        provide: TranslateParser,
        useClass: CustomTranslateParser
      },
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [HttpClient]
      },
      isolate: false
    }),

    // This app.
    AppRoutingModule,
    SharedModule.forRoot(),
    SearchModule
  ],
  providers: [
    CookieService,
    Title,
    WindowRefService,
    {
      provide: Sentry.TraceService,
      deps: [Router]
    },
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false
      })
    },
    {
      provide: RouteReuseStrategy,
      useFactory: (platformId: Object, locationStrategy: LocationStrategy) =>
        new CustomRouteReuseStrategy(platformId, locationStrategy),
      deps: [PLATFORM_ID, LocationStrategy]
    },
    { provide: CLIENT_IP, useValue: "" } // provide a fallback value for CLIENT_IP
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
  public constructor(
    private readonly iconLibrary: FaIconLibrary,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly store$: Store,
    private readonly transferState: TransferState
  ) {
    initFontAwesome(iconLibrary);

    if (isPlatformBrowser(this.platformId)) {
      const initialState = this.transferState.get(NGRX_STATE_KEY, null);
      if (initialState) {
        this.store$.dispatch(setInitialState({ payload: initialState }));
        this.transferState.remove(NGRX_STATE_KEY);
      }
    }
  }
}
