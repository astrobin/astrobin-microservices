import { CommonModule, CurrencyPipe, DatePipe, NgOptimizedImage } from "@angular/common";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { APP_INITIALIZER, Injectable, ModuleWithProviders, NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { formlyConfig } from "@app/formly.config";
import { AppActionTypes } from "@app/store/actions/app.actions";
import { InitializeApp } from "@app/store/actions/initialize-app.actions";
import { MainState } from "@app/store/state";
import { AuthActionTypes, InitializeAuth } from "@features/account/store/auth.actions";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgbAccordionModule, NgbCarouselModule, NgbDropdownModule, NgbModule, NgbNavModule, NgbPaginationModule, NgbPopoverModule, NgbProgressbarModule } from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { Actions, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { FormlyBootstrapModule } from "@ngx-formly/bootstrap";
import { FORMLY_CONFIG, FormlyModule } from "@ngx-formly/core";
import { FormlySelectModule } from "@ngx-formly/core/select";
import { MissingTranslationHandler, TranslateLoader, TranslateModule, TranslateParser, TranslateService } from "@ngx-translate/core";
import { ApiModule } from "@shared/services/api/api.module";
import { AuthService } from "@shared/services/auth.service";
import { ClassicRoutesService } from "@shared/services/classic-routes.service";
import { AuthGuardService } from "@shared/services/guards/auth-guard.service";
import { GroupGuardService } from "@shared/services/guards/group-guard.service";
import { ImageOwnerGuardService } from "@shared/services/guards/image-owner-guard.service";
import { UltimateSubscriptionGuardService } from "@shared/services/guards/ultimate-subscription-guard.service";
import { LoadingService } from "@shared/services/loading.service";
import { PopNotificationsService } from "@shared/services/pop-notifications.service";
import { SessionService } from "@shared/services/session.service";
import { UserService } from "@shared/services/user.service";
import { WindowRefService } from "@shared/services/window-ref.service";
import { CookieService } from "ngx-cookie";
import { NgxFilesizeModule } from "ngx-filesize";
import { ImageCropperModule } from "ngx-image-cropper";
import { TimeagoModule } from "ngx-timeago";
import { ToastrModule } from "ngx-toastr";
import { switchMap, take } from "rxjs/operators";
import { ComponentsModule } from "./components/components.module";
import { PipesModule } from "./pipes/pipes.module";
import { FormlyWrapperComponent } from "@shared/components/misc/formly-wrapper/formly-wrapper.component";
import { JsonApiService } from "@shared/services/api/classic/json/json-api.service";
import { CustomMissingTranslationHandler } from "@app/missing-translation-handler";
import { CustomTranslateParser } from "@app/translate-parser";
import { LanguageLoader } from "@app/translate-loader";
import { FormlyEquipmentItemBrowserWrapperComponent } from "@shared/components/misc/formly-equipment-item-browser-wrapper/formly-equipment-item-browser-wrapper.component";
import { DirectivesModule } from "@shared/directives/directives.module";
import { CustomToastComponent } from "@shared/components/misc/custom-toast/custom-toast.component";
import { CKEditorService } from "@shared/services/ckeditor.service";
import { PendingChangesGuard } from "@shared/services/guards/pending-changes-guard.service";
import * as Sentry from "@sentry/angular";
import { NgWizardModule, THEME } from "@kronscht/ng-wizard";
import { NgxDatatableModule } from "@swimlane/ngx-datatable";
import { FormlyCardWrapperComponent } from "@shared/components/misc/formly-card-wrapper/formly-card-wrapper.component";
import { AstroBinGroupGuardService } from "@shared/services/guards/astrobin-group-guard.service";
import { NgxSliderModule } from "@angular-slider/ngx-slider";
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from "@angular/platform-browser";
import { AutoSizeInputModule } from "ngx-autosize-input";
import { ScrollService } from "@shared/services/scroll.service";
import { PlatformService } from "@shared/services/platform.service";
import { IonicModule } from "@ionic/angular";

declare const Hammer;

export function appInitializer(store: Store<MainState>, actions$: Actions) {
  return () =>
    new Promise<void>(resolve => {
      store.dispatch(new InitializeApp());

      actions$
        .pipe(
          ofType(AppActionTypes.INITIALIZE_SUCCESS),
          take(1),
          switchMap(() => {
            store.dispatch(new InitializeAuth());
            return actions$.pipe(ofType(AuthActionTypes.INITIALIZE_SUCCESS), take(1));
          })
        )
        .subscribe(() => {
          resolve();
        });
    });
}

@Injectable()
export class AstroBinHammerConfig extends HammerGestureConfig {
  override events = ['pinch', 'pinchstart', 'pinchmove', 'pinchend',
    'pan', 'panstart', 'panmove', 'panend',
    'tap', 'doubletap'];  // Add doubletap here

  override overrides = {
    'pinch': { enable: true },
    'doubletap': { enable: true }
  } as any;

  override buildHammer(element: HTMLElement) {
    const mc = new Hammer(element, {
      touchAction: 'pan-x pan-y'
    });

    mc.get('pinch').set({ enable: true });

    const tap = mc.get('tap');
    tap.set({
      enable: true,
      taps: 2,
      interval: 200,
      threshold: 2,
      posThreshold: 10
    });

    return mc;
  }
}

@NgModule({
  imports: [
    AutoSizeInputModule,
    CommonModule,
    ComponentsModule,
    DirectivesModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    FontAwesomeModule,
    FormlyModule.forRoot({
      extras: {
        lazyRender: false,
        resetFieldOnHide: false
      },
      wrappers: [
        { name: "equipment-item-browser-wrapper", component: FormlyEquipmentItemBrowserWrapperComponent },
        { name: "default-wrapper", component: FormlyWrapperComponent },
        { name: "card-wrapper", component: FormlyCardWrapperComponent }
      ]
    }),
    FormlyBootstrapModule,
    FormlySelectModule,
    HammerModule,
    ImageCropperModule,
    IonicModule,
    NgbModule,
    NgbAccordionModule,
    NgbCarouselModule,
    NgbDropdownModule,
    NgbNavModule,
    NgOptimizedImage,
    NgbPaginationModule,
    NgbPopoverModule,
    NgbProgressbarModule,
    NgSelectModule,
    NgxDatatableModule,
    NgxSliderModule,
    NgxFilesizeModule,
    NgWizardModule.forRoot({
      theme: THEME.default,
      anchorSettings: {
        anchorClickable: true,
        enableAllAnchors: true,
        markAllPreviousStepsAsDone: true,
        enableAnchorOnDoneStep: true
      },
      toolbarSettings: {
        showPreviousButton: false,
        showNextButton: false
      }
    }),
    ToastrModule.forRoot({
      timeOut: 20000,
      progressBar: true,
      preventDuplicates: true,
      resetTimeoutOnDuplicate: true,
      toastComponent: CustomToastComponent
    }),
    TranslateModule.forChild({
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
        useClass: LanguageLoader,
        deps: [HttpClient, JsonApiService]
      },
      isolate: false
    }),

    ApiModule,
    PipesModule
  ],
  exports: [
    AutoSizeInputModule,
    CommonModule,
    ComponentsModule,
    DirectivesModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    FontAwesomeModule,
    FormlyModule,
    FormlyBootstrapModule,
    HammerModule,
    ImageCropperModule,
    IonicModule,
    NgbModule,
    NgbAccordionModule,
    NgbCarouselModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbPaginationModule,
    NgbPopoverModule,
    NgbProgressbarModule,
    NgOptimizedImage,
    NgSelectModule,
    NgxSliderModule,
    NgxFilesizeModule,
    NgWizardModule,
    ToastrModule,
    TimeagoModule,
    TranslateModule,

    ApiModule,
    PipesModule
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: [
        AstroBinGroupGuardService,
        AuthGuardService,
        AuthService,
        ClassicRoutesService,
        CKEditorService,
        CookieService,
        CurrencyPipe,
        DatePipe,
        GroupGuardService,
        ImageOwnerGuardService,
        LoadingService,
        PendingChangesGuard,
        PopNotificationsService,
        SessionService,
        UltimateSubscriptionGuardService,
        UserService,
        WindowRefService,
        ScrollService,
        PlatformService,
        {
          provide: APP_INITIALIZER,
          useFactory: appInitializer,
          multi: true,
          deps: [Store, Actions]
        },
        {
          provide: APP_INITIALIZER,
          useFactory: () => () => {
          },
          deps: [Sentry.TraceService],
          multi: true
        },
        {
          provide: FORMLY_CONFIG,
          useFactory: formlyConfig,
          multi: true,
          deps: [TranslateService, JsonApiService]
        },
        {
          provide: HAMMER_GESTURE_CONFIG,
          useClass: AstroBinHammerConfig
        }
      ]
    };
  }
}
