import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, HostListener, Inject, Input, OnChanges, OnDestroy, OnInit, Output, PLATFORM_ID, Renderer2, SimpleChanges, ViewChild } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { HideFullscreenImage } from "@app/store/actions/fullscreen-image.actions";
import { LoadThumbnail, LoadThumbnailCancel } from "@app/store/actions/thumbnail.actions";
import { selectCurrentFullscreenImage } from "@app/store/selectors/app/app.selectors";
import { selectThumbnail } from "@app/store/selectors/app/thumbnail.selectors";
import { MainState } from "@app/store/state";
import { select, Store } from "@ngrx/store";
import { TranslateService } from "@ngx-translate/core";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { ImageAlias } from "@shared/enums/image-alias.enum";
import { ImageService } from "@shared/services/image/image.service";
import { WindowRefService } from "@shared/services/window-ref.service";
import { Coord, NgxImageZoomComponent } from "ngx-image-zoom";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { distinctUntilChanged, filter, map, switchMap, take, tap } from "rxjs/operators";
import { ImageThumbnailInterface } from "@shared/interfaces/image-thumbnail.interface";
import { UtilsService } from "@shared/services/utils/utils.service";
import { isPlatformBrowser } from "@angular/common";
import { DeviceService } from "@shared/services/device.service";
import { CookieService } from "ngx-cookie";
import { selectImage } from "@app/store/selectors/app/image.selectors";
import { ClassicRoutesService } from "@shared/services/classic-routes.service";
import { FullSizeLimitationDisplayOptions, ImageInterface } from "@shared/interfaces/image.interface";
import { Actions, ofType } from "@ngrx/effects";
import { AppActionTypes } from "@app/store/actions/app.actions";
import { TitleService } from "@shared/services/title/title.service";
import { fadeInOut } from "@shared/animations";

declare type HammerInput = any;

@Component({
  selector: "astrobin-fullscreen-image-viewer",
  templateUrl: "./fullscreen-image-viewer.component.html",
  styleUrls: ["./fullscreen-image-viewer.component.scss"],
  animations: [fadeInOut],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullscreenImageViewerComponent extends BaseComponentDirective implements OnInit, OnChanges, OnDestroy {
  @Input()
  id: ImageInterface["pk"];

  @Input()
  revision = "final";

  @Input()
  anonymized = false;

  @Input()
  respectFullSizeDisplayLimitation = true;

  // We use `standalone = true` when opening a fullscreen image viewer from a standalone image viewer, i.e. an image
  // viewer that comes from an image page and not a slideshow that's opened dynamically.
  @Input()
  standalone = false;

  @Input()
  eagerLoading = false;

  @Output()
  enterFullscreen = new EventEmitter<void>();

  @Output()
  exitFullscreen = new EventEmitter<void>();

  @ViewChild("ngxImageZoom", { static: false, read: NgxImageZoomComponent })
  ngxImageZoom: NgxImageZoomComponent;

  @ViewChild("ngxImageZoom", { static: false, read: ElementRef })
  ngxImageZoomEl: ElementRef;

  @ViewChild("touchRealContainer", { static: false })
  touchRealContainer: ElementRef;

  @ViewChild("touchRealWrapper", { static: false })
  touchRealWrapper: ElementRef;

  @HostBinding("class.show")
  show: boolean = false;

  protected touchMode?: boolean = undefined;
  protected enableLens = true;
  protected zoomLensSize: number;
  protected showZoomIndicator = false;
  protected isHybridPC = false;
  protected isTouchDevice = false;
  protected isLargeEnough = false;
  protected hdThumbnail: SafeUrl;
  protected realThumbnail: SafeUrl;
  protected realThumbnailUnsafeUrl: string;
  protected hdImageLoadingProgress$: Observable<number>;
  protected realImageLoadingProgress$: Observable<number>;
  protected hdThumbnailLoading = false;
  protected realThumbnailLoading = false;
  protected ready = false;
  protected allowReal = false;
  protected touchScale = 1;
  protected actualTouchZoom: number = null;
  protected isTransforming = false;
  protected touchZoomTransform = "";
  protected naturalWidth: number;
  protected naturalHeight: number;
  protected maxZoom = 8;

  private _lastTouchScale = 1;
  private _touchScaleOffset = { x: 0, y: 0 };
  private _lastTouchScaleOffset = { x: 0, y: 0 };
  private _touchScaleStartPoint = { x: 0, y: 0 };
  private _baseTouchScale: number;
  private _panVelocity = { x: 0, y: 0 };
  private _panLastPosition = { x: 0, y: 0 };
  private _panLastTime: number = 0;
  private _pinchLastTime: number = 0;
  private _animationFrame: number = null;

  private _imageSubscription: Subscription;
  private _hdThumbnailSubscription: Subscription;
  private _realThumbnailSubscription: Subscription;
  private _currentFullscreenImageSubscription: Subscription;
  private _zoomScroll = 1;
  private _zoomIndicatorTimeout: number;
  private _zoomIndicatorTimeoutDuration = 1000;
  private _hdLoadingProgressSubject = new BehaviorSubject<number>(0);
  private _realLoadingProgressSubject = new BehaviorSubject<number>(0);
  private _eagerLoadingSubscription: Subscription;

  private readonly LENS_ENABLED_COOKIE_NAME = "astrobin-fullscreen-lens-enabled";
  private readonly TOUCH_OR_MOUSE_MODE_COOKIE_NAME = "astrobin-fullscreen-touch-or-mouse";
  private readonly PIXEL_THRESHOLD = 8192 * 8192;
  private readonly FRAME_INTERVAL = 1000 / 120; // 120 FPS


  constructor(
    public readonly store$: Store<MainState>,
    public readonly actions$: Actions,
    public readonly windowRef: WindowRefService,
    public readonly translateService: TranslateService,
    public readonly imageService: ImageService,
    public readonly domSanitizer: DomSanitizer,
    public readonly utilsService: UtilsService,
    @Inject(PLATFORM_ID) public readonly platformId: Object,
    public readonly deviceService: DeviceService,
    public readonly cookieService: CookieService,
    public readonly classicRoutesService: ClassicRoutesService,
    public readonly windowRefService: WindowRefService,
    public readonly titleService: TitleService,
    public readonly renderer: Renderer2,
    public readonly changeDetectorRef: ChangeDetectorRef
  ) {
    super(store$);

    this.isHybridPC = this.deviceService.isHybridPC();
    this.isTouchDevice = this.deviceService.isTouchEnabled();
    this.touchMode = this.cookieService.get(this.TOUCH_OR_MOUSE_MODE_COOKIE_NAME) === "touch";
    this.enableLens = this.cookieService.get(this.LENS_ENABLED_COOKIE_NAME) === "true";
    this.hdImageLoadingProgress$ = this._hdLoadingProgressSubject.asObservable();
    this.realImageLoadingProgress$ = this._realLoadingProgressSubject.asObservable();
  }

  @HostBinding("class.disable-zoom")
  get disableZoomClass() {
    return this.realThumbnailLoading || this.hdThumbnailLoading;
  }

  @HostBinding("class.standalone")
  get standaloneClass() {
    return this.standalone;
  }

  get zoomingEnabled(): boolean {
    return !!this.ngxImageZoom && (this.ngxImageZoom as any).zoomingEnabled;
  }

  protected get isVeryLargeImage(): boolean {
    return this.naturalWidth * (this.naturalHeight || this.naturalWidth) > this.PIXEL_THRESHOLD;
  }

  @HostListener("window:resize", ["$event"])
  onResize(event) {
    this._setZoomLensSize();
  }

  ngOnInit() {
    this._setZoomLensSize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.id === undefined) {
      throw new Error("Attribute 'id' is required");
    }

    if (changes.eagerLoading || changes.id) {
      // Clean up previous subscriptions
      if (this._eagerLoadingSubscription) {
        this._eagerLoadingSubscription.unsubscribe();
        this._eagerLoadingSubscription = null;
      }

      this.hdThumbnail = null;
      this.realThumbnail = null;

      // Set up eager loading if enabled
      if (this.eagerLoading && !this._eagerLoadingSubscription) {
        this.utilsService.delay(2500).subscribe(() => {
          // Double check in case user clicked during timeout
          if (!this._eagerLoadingSubscription && !this.hdThumbnail && !this.realThumbnail) {
            this._eagerLoadingSubscription = this._initThumbnailSubscriptions();
            this.changeDetectorRef.detectChanges();
          }
        });
      }
    }

    if (this._currentFullscreenImageSubscription) {
      this._currentFullscreenImageSubscription.unsubscribe();
    }

    this._currentFullscreenImageSubscription = this.store$.pipe(
      select(selectCurrentFullscreenImage),
      distinctUntilChanged(),
      filter(currentFullscreenImage => currentFullscreenImage === this.id)
    ).subscribe(() => {
      this.actions$.pipe(
        ofType(AppActionTypes.HIDE_FULLSCREEN_IMAGE),
        take(1)
      ).subscribe(() => {
        this._resetThumbnailSubscriptions();
        this.show = false;
        this.hdThumbnail = null;
        this.realThumbnail = null;
        this._resetTouchZoom();
        this.titleService.enablePageZoom();
        cancelAnimationFrame(this._animationFrame);
        this.exitFullscreen.emit();
        this.changeDetectorRef.markForCheck();
      });

      this.show = true;
      this.titleService.disablePageZoom();
      this.enterFullscreen.emit();

      // Only initialize thumbnails if not already eagerly loading
      if (!this._eagerLoadingSubscription && !this.hdThumbnail && !this.realThumbnail) {
        this._initThumbnailSubscriptions();
      }

      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();

    if (this._eagerLoadingSubscription) {
      this._eagerLoadingSubscription.unsubscribe();
      this._eagerLoadingSubscription = null;
    }

    if (this._imageSubscription) {
      this._imageSubscription.unsubscribe();
      this._imageSubscription = null;
    }

    if (this._hdThumbnailSubscription) {
      this._hdThumbnailSubscription.unsubscribe();
      this._hdThumbnailSubscription = null;
    }

    if (this._realThumbnailSubscription) {
      this._realThumbnailSubscription.unsubscribe();
      this._realThumbnailSubscription = null;
    }

    if (this._currentFullscreenImageSubscription) {
      this._currentFullscreenImageSubscription.unsubscribe();
      this._currentFullscreenImageSubscription = null;
    }
  }

  onImagesLoaded(loaded: boolean) {
    this.ready = loaded;
    // Prevents the jarring resetting of the zoom when the mouse wanders off the image.
    this.utilsService.delay(100).subscribe(() => {
      if (this.ngxImageZoom) {
        (this.ngxImageZoom as any).clickMouseLeave = () => {
        };
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  setZoomPosition(position: Coord) {
    this.showZoomIndicator = true;
    this._setZoomIndicatorTimeout();
  }

  setZoomScroll(scroll: number) {
    this._zoomScroll = scroll;
    this.showZoomIndicator = true;
    this._setZoomIndicatorTimeout();
  }

  getZoomScroll(): number {
    return this._zoomScroll;
  }

  @HostListener("window:keyup.escape", ["$event"])
  hide(event: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.store$.dispatch(new HideFullscreenImage());
  }

  protected toggleEnableLens(): void {
    this.enableLens = !this.enableLens;
    this.cookieService.put(this.LENS_ENABLED_COOKIE_NAME, this.enableLens.toString());
    if (this.enableLens) {
      this._setZoomLensSize();
    }
  }

  protected toggleTouchMouseMode(): void {
    this.touchMode = !this.touchMode;
    this.cookieService.put(this.TOUCH_OR_MOUSE_MODE_COOKIE_NAME, this.touchMode ? "touch" : "mouse");
  }

  protected onPinchStart(event: HammerInput): void {
    this._lastTouchScale = this.touchScale;

    // Store the initial pinch position
    const rect = this.touchRealContainer.nativeElement.getBoundingClientRect();
    this._touchScaleStartPoint = {
      x: event.center.x - rect.left,
      y: event.center.y - rect.top
    };

    // Store the current offset for calculations
    this._lastTouchScaleOffset = { ...this._touchScaleOffset };

    this.isTransforming = true;
  }

  protected onPinchMove(event: HammerInput): void {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (now - this._pinchLastTime < this.FRAME_INTERVAL) {
      return;
    }
    this._pinchLastTime = now;

    const displayWidth = this.touchRealContainer.nativeElement.offsetWidth;
    const naturalScale = displayWidth / this.naturalWidth;
    const maxScale = this.isVeryLargeImage ? 1 : 8 / naturalScale;

    this.touchScale = Math.min(
      Math.max(this._lastTouchScale * event.scale, 1),
      maxScale
    );
    this._updateActualTouchZoom();
    this._setTouchZoomTransform();
  }

  protected onPinchEnd(): void {
    this._lastTouchScale = this.touchScale;
    if (this.touchScale <= 1) {
      this._resetTouchZoom();
    }

    this.isTransforming = false;
  }

  protected onPanStart(event: HammerInput): void {
    if (this.touchScale <= 1) {
      return;
    }

    // Cancel any ongoing momentum animation
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }

    this._lastTouchScaleOffset = this._touchScaleOffset;
    this._touchScaleStartPoint = {
      x: event.center.x,
      y: event.center.y
    };

    // Reset velocity tracking
    this._panVelocity = { x: 0, y: 0 };
    this._panLastPosition = {
      x: event.center.x,
      y: event.center.y
    };
    this._panLastTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    this.isTransforming = true;
  }

  protected onPanMove(event: HammerInput): void {
    if (this.touchScale <= 1) {
      return;
    }

    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (now - this._panLastTime < this.FRAME_INTERVAL) {
      return;
    }

    const deltaTime = now - this._panLastTime;

    // Calculate velocity
    if (deltaTime > 0) {
      this._panVelocity = {
        x: (event.center.x - this._panLastPosition.x) / deltaTime,
        y: (event.center.y - this._panLastPosition.y) / deltaTime
      };
    }

    this._panLastPosition = { x: event.center.x, y: event.center.y };
    this._panLastTime = now;

    const deltaX = event.center.x - this._touchScaleStartPoint.x;
    const deltaY = event.center.y - this._touchScaleStartPoint.y;

    const adjustedDeltaX = deltaX / this.touchScale;
    const adjustedDeltaY = deltaY / this.touchScale;

    const maxOffsetX = (this.touchScale - 1) * this.touchRealContainer.nativeElement.offsetWidth / 2;
    const maxOffsetY = (this.touchScale - 1) * this.touchRealContainer.nativeElement.offsetHeight / 2;

    this._touchScaleOffset = {
      x: Math.min(Math.max(this._lastTouchScaleOffset.x + adjustedDeltaX, -maxOffsetX), maxOffsetX),
      y: Math.min(Math.max(this._lastTouchScaleOffset.y + adjustedDeltaY, -maxOffsetY), maxOffsetY)
    };

    this._setTouchZoomTransform();
  }

  protected onPanEnd(event: HammerInput) {
    if (this.touchScale <= 1) {
      return;
    }
    this._applyPanMoveMomentum();
  }

  protected onDoubleTap(event: HammerInput): void {
    if (this.touchScale > 1) {
      this._resetTouchZoom();
    } else {
      // Zoom to 2x at double tap location
      this.touchScale = 2;
      const rect = this.touchRealContainer.nativeElement.getBoundingClientRect();
      const x = event.center.x - rect.left;
      const y = event.center.y - rect.top;

      this._touchScaleOffset = {
        x: (rect.width / 2 - x) * (this.touchScale - 1),
        y: (rect.height / 2 - y) * (this.touchScale - 1)
      };
    }
  }

  private _setTouchZoomTransform(): void {
    this.touchZoomTransform = `scale(${this.touchScale}) translate(${this._touchScaleOffset.x}px, ${this._touchScaleOffset.y}px)`;
  }

  private _applyPanMoveMomentum(): void {
    const friction = 0.9; // Adjust this value to change how quickly it slows down
    const minVelocity = 0.025; // Minimum velocity before stopping

    const animate = () => {
      // Apply friction
      this._panVelocity.x *= friction;
      this._panVelocity.y *= friction;

      // Stop if velocity is very low
      if (Math.abs(this._panVelocity.x) < minVelocity && Math.abs(this._panVelocity.y) < minVelocity) {
        cancelAnimationFrame(this._animationFrame);
        this._animationFrame = null;
        this.isTransforming = false;
        this._setTouchZoomTransform();
        return;
      }

      // Calculate new position
      const deltaX = (this._panVelocity.x * 16) / this.touchScale; // 16ms is roughly one frame at 60fps
      const deltaY = (this._panVelocity.y * 16) / this.touchScale;

      const maxOffsetX = (this.touchScale - 1) * this.touchRealContainer.nativeElement.offsetWidth / 2;
      const maxOffsetY = (this.touchScale - 1) * this.touchRealContainer.nativeElement.offsetHeight / 2;

      // Update position with bounds checking
      this._touchScaleOffset = {
        x: Math.min(Math.max(this._touchScaleOffset.x + deltaX, -maxOffsetX), maxOffsetX),
        y: Math.min(Math.max(this._touchScaleOffset.y + deltaY, -maxOffsetY), maxOffsetY)
      };

      // If we hit the bounds, stop the momentum in that direction
      if (this._touchScaleOffset.x === -maxOffsetX || this._touchScaleOffset.x === maxOffsetX) {
        this._panVelocity.x = 0;
      }
      if (this._touchScaleOffset.y === -maxOffsetY || this._touchScaleOffset.y === maxOffsetY) {
        this._panVelocity.y = 0;
      }

      this._setTouchZoomTransform();
      this._animationFrame = requestAnimationFrame(animate);
    };

    this._animationFrame = requestAnimationFrame(animate);
  }


  private _updateActualTouchZoom(): void {
    if (!this.naturalWidth || !this.touchRealContainer?.nativeElement?.offsetWidth) {
      this.actualTouchZoom = null;
      return;
    }

    const displayWidth = this.touchRealContainer.nativeElement.offsetWidth;
    this._baseTouchScale = displayWidth / this.naturalWidth;
    this.actualTouchZoom = this._baseTouchScale * this.touchScale;
  }

  private _resetTouchZoom(): void {
    this.touchZoomTransform = "";
    this.touchScale = 1;
    this._lastTouchScale = 1;
    this._touchScaleOffset = { x: 0, y: 0 };
    this._lastTouchScaleOffset = { x: 0, y: 0 };
    this._updateActualTouchZoom();
  }

  private _resetThumbnailSubscriptions() {
    if (this._hdThumbnailSubscription) {
      this._hdThumbnailSubscription.unsubscribe();
      this._hdThumbnailSubscription = null;
    }

    if (this._realThumbnailSubscription) {
      this._realThumbnailSubscription.unsubscribe();
      this._realThumbnailSubscription = null;
    }

    if (this._eagerLoadingSubscription) {
      this._eagerLoadingSubscription.unsubscribe();
      this._eagerLoadingSubscription = null;
    }

    this.store$.dispatch(new LoadThumbnailCancel({ thumbnail: this._getHdOptions() }));

    if (this.allowReal) {
      this.store$.dispatch(new LoadThumbnailCancel({ thumbnail: this._getRealOptions() }));
    }

    this.hdThumbnail = null;
    this.realThumbnail = null;
  }

  private _initThumbnailSubscriptions(): Subscription {
    // Reset any existing subscriptions
    this._resetThumbnailSubscriptions();

    const subscriptions = new Subscription();

    if (this._imageSubscription) {
      this._imageSubscription.unsubscribe();
    }

    this._imageSubscription = this.store$.pipe(
      select(selectImage, this.id),
      filter(image => !!image),
      take(1)
    ).subscribe(image => {
      const revision = this.imageService.getRevision(image, this.revision);
      this.naturalWidth = revision.w;
      this.naturalHeight = revision.h;
      this.maxZoom = image.maxZoom || image.defaultMaxZoom || 8;
      this.isLargeEnough = (
        revision.w > this.windowRef.nativeWindow.innerWidth ||
        revision.h > this.windowRef.nativeWindow.innerHeight
      );
      this.changeDetectorRef.markForCheck();

      this.currentUser$.pipe(take(1)).subscribe(user => {
        const limit = image.fullSizeDisplayLimitation;
        this.allowReal = !this.respectFullSizeDisplayLimitation || (
          limit === FullSizeLimitationDisplayOptions.EVERYBODY ||
          (limit === FullSizeLimitationDisplayOptions.MEMBERS && !!user) ||
          (limit === FullSizeLimitationDisplayOptions.PAYING && !!user && !!user.validSubscription) ||
          (limit === FullSizeLimitationDisplayOptions.ME && !!user && user.id === image.user)
        );
        this.changeDetectorRef.markForCheck();
      });
    });

    subscriptions.add(this._imageSubscription);

    this._hdThumbnailSubscription = this.store$.select(selectThumbnail, this._getHdOptions()).pipe(
      tap(() => {
        this.hdThumbnailLoading = true;
        this._hdLoadingProgressSubject.next(0);
      }),
      filter(thumbnail => !!thumbnail),
      switchMap(thumbnail =>
        this.imageService.loadImageFile(thumbnail.url, (progress: number) => {
          this._hdLoadingProgressSubject.next(progress);
        }).pipe(
          switchMap(url =>
            this._preloadImage(url).pipe(
              map(() => this.domSanitizer.bypassSecurityTrustUrl(url)),
              tap(() => this.store$.dispatch(new LoadThumbnail({ data: this._getRealOptions(), bustCache: false }))),
              tap(() => this.hdThumbnailLoading = false)
            )
          )
        )
      )
    ).subscribe(url => {
      this.hdThumbnail = url;
      this.changeDetectorRef.markForCheck();
    });

    subscriptions.add(this._hdThumbnailSubscription);

    this._realThumbnailSubscription = this.store$.select(selectThumbnail, this._getRealOptions()).pipe(
      tap(() => {
        this.realThumbnailLoading = true;
        this._realLoadingProgressSubject.next(0);
      }),
      filter(thumbnail => !!thumbnail),
      tap(thumbnail => {
        this.realThumbnailUnsafeUrl = thumbnail.url;
      }),
      switchMap(thumbnail =>
        this.imageService.loadImageFile(thumbnail.url, (progress: number) => {
          this._realLoadingProgressSubject.next(progress);
        }).pipe(
          switchMap(url =>
            this._preloadImage(url).pipe(
              map(() => this.domSanitizer.bypassSecurityTrustUrl(url)),
              tap(() => this.realThumbnailLoading = false)
            )
          )
        )
      )
    ).subscribe(url => {
      this.realThumbnail = url;
      this.changeDetectorRef.markForCheck();
    });

    subscriptions.add(this._realThumbnailSubscription);

    this.store$.dispatch(new LoadThumbnail({ data: this._getHdOptions(), bustCache: false }));

    return subscriptions;
  }

  private _setZoomLensSize(): void {
    this.zoomLensSize = Math.floor(this.windowRef.nativeWindow.innerWidth / 4);
    if (this.ngxImageZoom) {
      this.ngxImageZoom.lensWidth = this.zoomLensSize;
      this.ngxImageZoom.lensHeight = this.zoomLensSize;
    }
  }

  private _setZoomIndicatorTimeout(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this._zoomIndicatorTimeout) {
        clearTimeout(this._zoomIndicatorTimeout);
      }

      this._zoomIndicatorTimeout = this.windowRef.nativeWindow.setTimeout(() => {
        this.showZoomIndicator = false;
      }, this._zoomIndicatorTimeoutDuration);
    }
  }

  private _getHdOptions(): Omit<ImageThumbnailInterface, "url"> {
    return {
      id: this.id,
      revision: this.revision,
      alias: this.anonymized ? ImageAlias.HD_ANONYMIZED : ImageAlias.QHD
    };
  }

  private _getRealOptions(): Omit<ImageThumbnailInterface, "url"> {
    return {
      id: this.id,
      revision: this.revision,
      alias: this.anonymized ? ImageAlias.REAL_ANONYMIZED : ImageAlias.REAL
    };
  }

  private _preloadImage(url: string): Observable<void> {
    return new Observable(subscriber => {
      const img = new Image();
      img.onload = () => {
        subscriber.next();
        subscriber.complete();
      };
      img.onerror = (err) => subscriber.error(err);
      img.src = url;
    });
  }
}
