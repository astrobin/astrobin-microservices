import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, Input, OnChanges, OnDestroy, OnInit, PLATFORM_ID, SimpleChanges } from "@angular/core";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { select, Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { TogglePropertyInterface } from "@shared/interfaces/toggle-property.interface";
import { TranslateService } from "@ngx-translate/core";
import { LoadingService } from "@shared/services/loading.service";
import { CreateToggleProperty, CreateTogglePropertySuccess, DeleteToggleProperty, LoadToggleProperty, LoadTogglePropertyFailure, LoadTogglePropertySuccess } from "@app/store/actions/toggle-property.actions";
import { debounceTime, filter, map, take, takeUntil, tap } from "rxjs/operators";
import { Actions, ofType } from "@ngrx/effects";
import { AppActionTypes } from "@app/store/actions/app.actions";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { RouterService } from "@shared/services/router.service";
import { UtilsService } from "@shared/services/utils/utils.service";
import { DeviceService } from "@shared/services/device.service";
import { isPlatformBrowser } from "@angular/common";
import { fromEvent, merge, Observable, Subscription, throttleTime } from "rxjs";
import { WindowRefService } from "@shared/services/window-ref.service";

@Component({
  selector: "astrobin-toggle-property",
  templateUrl: "./toggle-property.component.html",
  styleUrls: ["./toggle-property.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TogglePropertyComponent extends BaseComponentDirective implements OnInit, OnChanges, OnDestroy {
  @Input()
  propertyType: TogglePropertyInterface["propertyType"];

  @Input()
  userId: TogglePropertyInterface["user"];

  @Input()
  objectId: TogglePropertyInterface["objectId"];

  @Input()
  contentType: TogglePropertyInterface["contentType"];

  @Input()
  disabled = false;

  @Input()
  setLabel: string;

  @Input()
  unsetLabel: string;

  @Input()
  btnClass: string = "btn btn-secondary";

  @Input()
  showIcon = true;

  @Input()
  showLabel = true;

  @Input()
  showTooltip = true;

  @Input()
  count: number;

  // Optionally provided, in case the parent component has this information at hand.
  @Input()
  toggled: boolean;

  // We keep a local "loading" state because we don't want to freeze the whole app.
  protected loading = false;
  protected initialized = false;
  protected isTouchDevice = false;
  protected setTogglePropertyLabel: string;
  protected unsetTogglePropertyLabel: string;
  protected togglePropertyIcon: IconProp;

  private _toggleProperty: TogglePropertyInterface;
  private _createSubscription: Subscription;
  private _deleteSubscription: Subscription;
  private _scrollSubscription: Subscription;


  constructor(
    public readonly store$: Store<MainState>,
    public readonly actions$: Actions,
    public readonly loadingService: LoadingService,
    public readonly translateService: TranslateService,
    public readonly utilsService: UtilsService,
    public readonly routerService: RouterService,
    public readonly deviceService: DeviceService,
    public readonly changeDetectorRef: ChangeDetectorRef,
    public readonly elementRef: ElementRef,
    @Inject(PLATFORM_ID) public readonly platformId: Object,
    public readonly windowRefService: WindowRefService
  ) {
    super(store$);
  }

  private _initUnsetTogglePropertyLabel(): void {
    if (this.unsetLabel) {
      this.unsetTogglePropertyLabel = this.unsetLabel;
      return;
    }

    switch (this.propertyType) {
      case "like":
        this.unsetTogglePropertyLabel = this.translateService.instant("Unlike");
        break;
      case "bookmark":
        this.unsetTogglePropertyLabel = this.translateService.instant("Remove bookmark");
        break;
      case "follow":
        this.unsetTogglePropertyLabel = this.translateService.instant("Unfollow");
        break;
    }
  }

  private _initSetTogglePropertyLabel(): void {
    if (this.setLabel) {
      this.setTogglePropertyLabel = this.setLabel;
      return;
    }

    switch (this.propertyType) {
      case "like":
        this.setTogglePropertyLabel = this.translateService.instant("Like");
        break;
      case "bookmark":
        this.setTogglePropertyLabel = this.translateService.instant("Bookmark");
        break;
      case "follow":
        this.setTogglePropertyLabel = this.translateService.instant("Follow");
        break;
    }
  }

  private _initTogglePropertyIcon(): void {
    switch (this.propertyType) {
      case "like":
        this.togglePropertyIcon = "thumbs-up";
        break;
      case "bookmark":
        this.togglePropertyIcon = "bookmark";
        break;
      case "follow":
        this.togglePropertyIcon = "bell";
        break;
    }
  }

  public ngOnInit(): void {
    this.isTouchDevice = this.deviceService.isTouchEnabled();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.initialized = false;
    this.loading = false;

    if (changes.propertyType) {
      this._initSetTogglePropertyLabel();
      this._initUnsetTogglePropertyLabel();
      this._initTogglePropertyIcon();
    }

    // Clean up existing scroll subscription if it exists
    if (this._scrollSubscription) {
      this._scrollSubscription.unsubscribe();
    }

    if (isPlatformBrowser(this.platformId)) {
      if (this.utilsService.isNearOrInViewport(this.elementRef.nativeElement, {
        verticalTolerance: 500
      })) {
        this._initStatus();
      } else {
        const scrollElement = UtilsService.getScrollableParent(this.elementRef.nativeElement, this.windowRefService);
        const forceCheck$ = this.actions$.pipe(
          ofType(AppActionTypes.FORCE_CHECK_TOGGLE_PROPERTY_AUTO_LOAD)
        );

        this._scrollSubscription = merge(
          // Stream 1: Throttled events during scrolling
          fromEvent(scrollElement, "scroll").pipe(
            throttleTime(300)
          ),
          // Stream 2: Single event when scrolling stops
          fromEvent(scrollElement, "scroll").pipe(
            debounceTime(150)
          ),
          forceCheck$
        ).pipe(
          takeUntil(this.destroyed$), // Add this to auto-unsubscribe when component is destroyed
          tap(() => {
            if (this.utilsService.isNearOrInViewport(this.elementRef.nativeElement, {
              verticalTolerance: 500
            })) {
              this._initStatus();
              // Unsubscribe once we've initialized
              if (this._scrollSubscription) {
                this._scrollSubscription.unsubscribe();
                this._scrollSubscription = null;
              }
            }
          })
        ).subscribe();
      }
    }
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();

    if (this._createSubscription) {
      this._createSubscription.unsubscribe();
    }

    if (this._deleteSubscription) {
      this._deleteSubscription.unsubscribe();
    }

    if (this._scrollSubscription) {
      this._scrollSubscription.unsubscribe();
    }
  }

  public onClick(event: MouseEvent | TouchEvent): void {
    event.preventDefault();

    if (this.disabled) {
      return;
    }

    if (!this.userId) {
      this.routerService.redirectToLogin();
      return;
    }

    this.loading = true;

    if (this.toggled) {
      if (this._toggleProperty) {
        this.store$.dispatch(
          new DeleteToggleProperty({ toggleProperty: this._toggleProperty })
        );
      } else {
        this._initToggleProperty().pipe(
          filter(toggleProperty => !!toggleProperty),
          take(1)
        ).subscribe(toggleProperty => {
          if (toggleProperty) {
            this.store$.dispatch(
              new DeleteToggleProperty({ toggleProperty })
            );
          } else {
            this.loading = false;
            this.changeDetectorRef.markForCheck();
          }
        });
      }
    } else {
      this.store$.dispatch(
        new CreateToggleProperty({
          toggleProperty: {
            propertyType: this.propertyType,
            user: this.userId,
            objectId: this.objectId,
            contentType: this.contentType
          }
        })
      );
    }

    this.changeDetectorRef.detectChanges();
  }

  private _getFilterParams(toggleProperty: Partial<TogglePropertyInterface>): boolean {
    return toggleProperty.propertyType === this.propertyType &&
      toggleProperty.user === this.userId &&
      toggleProperty.objectId === this.objectId &&
      toggleProperty.contentType === this.contentType;
  }

  private _getStoreParams(): Partial<TogglePropertyInterface> {
    return {
      propertyType: this.propertyType,
      user: this.userId,
      objectId: this.objectId,
      contentType: this.contentType
    };
  }

  private _initToggleProperty(): Observable<TogglePropertyInterface | null>{
    return new Observable<TogglePropertyInterface | null>(observer => {
      this.actions$.pipe(
        ofType(AppActionTypes.LOAD_TOGGLE_PROPERTY_SUCCESS),
        map((action: LoadTogglePropertySuccess) => action.payload.toggleProperty),
        filter(toggleProperty => this._getFilterParams(toggleProperty)),
        take(1),
      ).subscribe(toggleProperty => {
        this._toggleProperty = toggleProperty;
        this.toggled = true;
        this.initialized = true;
        observer.next(toggleProperty);
        observer.complete();
        this.changeDetectorRef.markForCheck();
      });

      this.actions$.pipe(
        ofType(AppActionTypes.LOAD_TOGGLE_PROPERTY_FAILURE),
        map((action: LoadTogglePropertyFailure) => action.payload.toggleProperty),
        filter(toggleProperty => this._getFilterParams(toggleProperty)),
        take(1),
      ).subscribe(() => {
        this._toggleProperty = null;
        this.toggled = false;
        this.initialized = true;
        observer.next(null);
        observer.complete();
        this.changeDetectorRef.markForCheck();
      });

      this.store$.dispatch(new LoadToggleProperty({ toggleProperty: this._getStoreParams() }));
    });
  }

  private _initStatus(): void {
    if (this.initialized) {
      return;
    }

    if (!this.userId) {
      this.initialized = true;
      this.toggled = false;
      this._toggleProperty = null;
      this.changeDetectorRef.markForCheck();
      return;
    }

    if (this.toggled !== undefined) {
      this.initialized = true;
      this.changeDetectorRef.markForCheck();
    } else {
      this._initToggleProperty().subscribe();
    }

    if (this._createSubscription) {
      this._createSubscription.unsubscribe();
    }

    if (this._deleteSubscription) {
      this._deleteSubscription.unsubscribe();
    }

    this._createSubscription = this.actions$.pipe(
      ofType(AppActionTypes.CREATE_TOGGLE_PROPERTY_SUCCESS),
      map((action: CreateTogglePropertySuccess) => action.payload.toggleProperty),
      filter(this._getFilterParams.bind(this)),
      takeUntil(this.destroyed$)
    ).subscribe(toggleProperty => {
      this.utilsService.delay(50).subscribe(() => {
        this._toggleProperty = toggleProperty;
        this.toggled = true;
        this.count += 1;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      });
    });

    this._deleteSubscription = this.actions$.pipe(
      ofType(AppActionTypes.DELETE_TOGGLE_PROPERTY_SUCCESS),
      map((action: CreateTogglePropertySuccess) => action.payload.toggleProperty),
      filter(this._getFilterParams.bind(this)),
      takeUntil(this.destroyed$)
    ).subscribe(toggleProperty => {
      this._toggleProperty = null;
      this.toggled = false;
      this.loading = false;
      this.count -= 1;
      this.changeDetectorRef.markForCheck();
    });
  }
}
