import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, PLATFORM_ID, ViewContainerRef } from "@angular/core";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { ImageSearchInterface } from "@shared/interfaces/image-search.interface";
import { ImageSearchApiService } from "@shared/services/api/classic/images/image/image-search-api.service";
import { ClassicRoutesService } from "@shared/services/classic-routes.service";
import { auditTime, fromEvent, Observable, Subscription } from "rxjs";
import { WindowRefService } from "@shared/services/window-ref.service";
import { TranslateService } from "@ngx-translate/core";
import { EquipmentItemType, EquipmentItemUsageType } from "@features/equipment/types/equipment-item-base.interface";
import { ScrollableSearchResultsBaseComponent } from "@shared/components/search/scrollable-search-results-base/scrollable-search-results-base.component";
import { ImageViewerService } from "@shared/services/image-viewer.service";
import { filter, take, takeUntil, tap } from "rxjs/operators";
import { EquipmentBrandListingInterface, EquipmentItemListingInterface } from "@features/equipment/types/equipment-listings.interface";
import { SearchPaginatedApiResultInterface } from "@shared/services/api/interfaces/search-paginated-api-result.interface";
import { BrandInterface } from "@features/equipment/types/brand.interface";
import { MarketplaceLineItemInterface } from "@features/equipment/types/marketplace-line-item.interface";
import { Router } from "@angular/router";
import { LoadingService } from "@shared/services/loading.service";
import { SearchService } from "@features/search/services/search.service";
import { UserProfileInterface } from "@shared/interfaces/user-profile.interface";
import { FINAL_REVISION_LABEL } from "@shared/interfaces/image.interface";
import { UtilsService } from "@shared/services/utils/utils.service";
import { DeviceService } from "@shared/services/device.service";
import { ImageService } from "@shared/services/image/image.service";
import { UserService } from "@shared/services/user.service";
import { MasonryBreakpoints } from "@shared/components/masonry-layout/masonry-layout.component";
import { UserGalleryActiveLayout } from "@features/users/pages/gallery/user-gallery-buttons.component";
import { isPlatformBrowser } from "@angular/common";

@Component({
  selector: "astrobin-image-search",
  templateUrl: "./image-search.component.html",
  styleUrls: ["./image-search.component.scss"]
})
export class ImageSearchComponent extends ScrollableSearchResultsBaseComponent<ImageSearchInterface> implements OnInit {
  readonly EquipmentItemType = EquipmentItemType;
  readonly EquipmentItemUsageType = EquipmentItemUsageType;

  @Input() showRetailers = true;
  @Input() showMarketplaceItems = true;
  @Input() showDynamicOverlay = true;
  @Input() showStaticOverlay = true;
  @Input() breakpoints: MasonryBreakpoints;
  @Input() gutter: number;

  @Output() imageClicked = new EventEmitter<ImageSearchInterface>();

  protected allowFullRetailerIntegration = false;
  protected itemListings: EquipmentItemListingInterface[] = [];
  protected brandListings: EquipmentBrandListingInterface[] = [];
  protected marketplaceLineItems: MarketplaceLineItemInterface[] = [];
  protected uiReady = false;
  protected isMobile = false;

  private readonly _isBrowser: boolean;
  private readonly _placeholderBase64 = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#1a1a1a"/>

      <!-- Small stars -->
      <circle cx="10" cy="10" r="0.8" fill="#ffffff" opacity="0.6"/>
      <circle cx="25" cy="15" r="0.6" fill="#ffffff" opacity="0.5"/>
      <circle cx="40" cy="8" r="0.7" fill="#ffffff" opacity="0.7"/>
      <circle cx="60" cy="12" r="0.5" fill="#ffffff" opacity="0.4"/>
      <circle cx="75" cy="20" r="0.7" fill="#ffffff" opacity="0.6"/>
      <circle cx="90" cy="15" r="0.6" fill="#ffffff" opacity="0.5"/>

      <!-- Medium stars -->
      <circle cx="15" cy="30" r="1.2" fill="#ffffff" opacity="0.8"/>
      <circle cx="35" cy="40" r="1.0" fill="#ffffff" opacity="0.7"/>
      <circle cx="55" cy="35" r="1.1" fill="#ffffff" opacity="0.75"/>
      <circle cx="80" cy="45" r="1.0" fill="#ffffff" opacity="0.7"/>

      <!-- Large stars with glow -->
      <circle cx="20" cy="70" r="1.5" fill="#ffffff" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.7;0.9" dur="3s" repeatCount="indefinite"/>
      </circle>
      <circle cx="45" cy="65" r="1.6" fill="#ffffff" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="70" cy="75" r="1.4" fill="#ffffff" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.7;0.9" dur="3.5s" repeatCount="indefinite"/>
      </circle>

      <!-- Random scattered tiny stars -->
      <circle cx="85" cy="85" r="0.4" fill="#ffffff" opacity="0.4"/>
      <circle cx="5" cy="50" r="0.3" fill="#ffffff" opacity="0.3"/>
      <circle cx="95" cy="60" r="0.4" fill="#ffffff" opacity="0.4"/>
      <circle cx="30" cy="95" r="0.3" fill="#ffffff" opacity="0.3"/>
      <circle cx="50" cy="90" r="0.4" fill="#ffffff" opacity="0.4"/>
      <circle cx="65" cy="55" r="0.3" fill="#ffffff" opacity="0.3"/>
    </svg>
  `);

  private _nearEndOfContextSubscription: Subscription;
  private _imageDimensions = new Map<string, { width: number; height: number }>();
  private _containerWidth = 0;

  constructor(
    public readonly store$: Store<MainState>,
    public readonly imageSearchApiService: ImageSearchApiService,
    public readonly classicRoutesService: ClassicRoutesService,
    public readonly windowRefService: WindowRefService,
    public readonly elementRef: ElementRef,
    public readonly translateService: TranslateService,
    @Inject(PLATFORM_ID) public readonly platformId: Record<string, unknown>,
    public readonly viewContainerRef: ViewContainerRef,
    public readonly imageViewerService: ImageViewerService,
    public readonly router: Router,
    public readonly loadingService: LoadingService,
    public readonly searchService: SearchService,
    public readonly deviceService: DeviceService,
    public readonly changeDetectorRef: ChangeDetectorRef,
    public readonly imageService: ImageService,
    public readonly utilsService: UtilsService,
    public readonly userService: UserService
  ) {
    super(store$, windowRefService, elementRef, platformId, translateService, utilsService);
    this._isBrowser = isPlatformBrowser(this.platformId);
    this.hasMasonryLayout = true;
  }

  ngOnInit() {
    super.ngOnInit();

    fromEvent(this.windowRefService.nativeWindow, "resize")
      .pipe(takeUntil(this.destroyed$), auditTime(200))
      .subscribe(() => {
        this._checkUiReady();
        this._checkMobile();
      });

    this._checkUiReady();
    this._checkMobile();
  }

  onImageLoad(imageElement: HTMLImageElement, item: ImageSearchInterface, notifyReady: () => void): void {
    // Store the original dimensions
    this._imageDimensions.set("" + item.objectId, {
      width: imageElement.naturalWidth,
      height: imageElement.naturalHeight
    });
    notifyReady();
  }

  onImageError(imageElement: HTMLImageElement, item: ImageSearchInterface, notifyReady: () => void): void {
    // If we have stored dimensions, use them
    const dimensions = this._imageDimensions.get("" + item.objectId);
    if (dimensions) {
      imageElement.width = dimensions.width;
      imageElement.height = dimensions.height;
    } else {
      // Default dimensions if we don't have stored ones
      imageElement.width = 150;
      imageElement.height = 150;
    }

    // Replace with placeholder
    imageElement.src = this._placeholderBase64;

    // Update the layout
    notifyReady();
  }

  getItemListingsMessage(listing: EquipmentItemListingInterface): string {
    return this.translateService.instant(
      "Support AstroBin by shopping for {{0}} at our partners!",
      { 0: `<strong>${listing.name}</strong>` }
    );
  }

  getBrandListingsMessage(brand: BrandInterface): string {
    return this.translateService.instant(
      "Support AstroBin by shopping for {{0}} products at our partners!",
      { 0: `<strong>${brand.name}</strong>` }
    );
  }

  getMarketplaceMessage(): string {
    return this.translateService.instant(
      "We found some items relevant to your search for sale on our marketplace!"
    );
  }

  fetchData(): Observable<SearchPaginatedApiResultInterface<ImageSearchInterface>> {
    this.masonryLayoutReady = false;

    return this.imageSearchApiService
      .search({ ...this.model, pageSize: this.model.pageSize || this.pageSize })
      .pipe(
        tap(result => {
          this.allowFullRetailerIntegration = result.allowFullRetailerIntegration;

          if (result.equipmentItemListings) {
            this.itemListings = this._removeDuplicateRetailers(result.equipmentItemListings);
          } else {
            this.itemListings = [];
          }

          if (result.equipmentBrandListings) {
            this.brandListings = this._removeDuplicateRetailers(result.equipmentBrandListings);
          } else {
            this.brandListings = [];
          }

          if (result.marketplaceLineItems) {
            this.marketplaceLineItems = result.marketplaceLineItems;
          } else {
            this.marketplaceLineItems = [];
          }
        }),
        tap(result => {
          this.searchService.searchCompleteSubject.next(result);
        })
      );
  }

  openImage(event: MouseEvent, image: ImageSearchInterface): void {
    // Check if any modifier key is pressed (cmd, ctrl, or middle-click)
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      return; // Let the default browser behavior handle the opening of a new tab
    }

    event.preventDefault();

    this.imageClicked.emit(image);

    // If we are on an image's page, we don't want to open the image viewer but simply route to the image.
    if (this.router.url.startsWith("/i/")) {
      this._openImageByNavigation(image);
    } else {
      this.currentUserProfile$.pipe(take(1)).subscribe((userProfile: UserProfileInterface) => {
        if (!userProfile || userProfile.enableNewSearchExperience) {
          this._openImageByImageViewer(image);
        } else {
          this._openImageClassicUrl(image);
        }
      });
    }
  }

  getImageLink(image: ImageSearchInterface): string {
    return `/i/${image.hash || image.objectId}`;
  }

  private _openImageByNavigation(image: ImageSearchInterface): void {
    this.router.navigate([`/i/${image.hash || image.objectId}`]);
  }

  private _openImageClassicUrl(image: ImageSearchInterface): void {
    this.windowRefService.nativeWindow.open(
      this.classicRoutesService.IMAGE(image.hash || ("" + image.objectId)),
      "_self"
    );
  }

  private _checkUiReady(): void {
    if (!this._isBrowser) {
      return;
    }

    this._containerWidth = this.elementRef.nativeElement?.parentElement?.clientWidth;

    if (this._containerWidth > 0) {
      this._calculateBreakpointsAndGutter();
      this.uiReady = true;
    } else {
      this.utilsService.delay(100).subscribe(() => this._checkUiReady());
    }
  }

  private _checkMobile(): void {
    this.isMobile = this.deviceService.smMax();
  }

  private _calculateBreakpointsAndGutter(): void {
    const { breakpoints, gutter } = this.imageService.getBreakpointsAndGutterForMasonryLayout(
      this._containerWidth,
      UserGalleryActiveLayout.SMALL
    );
    this.breakpoints = breakpoints;
    this.gutter = gutter;
  }

  private _openImageByImageViewer(image: ImageSearchInterface): void {
    this.imageViewerService.openSlideshow(
      this.componentId,
      image.hash || image.objectId,
      FINAL_REVISION_LABEL,
      this.results.map(result => ({
        imageId: result.hash || result.objectId,
        thumbnailUrl: result.galleryThumbnail
      })),
      this.viewContainerRef,
      true
    ).subscribe(slideshow => {
      if (this._nearEndOfContextSubscription) {
        this._nearEndOfContextSubscription.unsubscribe();
      }

      this._nearEndOfContextSubscription = slideshow.instance.nearEndOfContext
        .pipe(
          filter(callerComponentId => callerComponentId === this.componentId),
          takeUntil(this.destroyed$)
        )
        .subscribe(() => {
          this.loadMore().subscribe(() => {
            slideshow.instance.setNavigationContext(
              this.results.map(result => ({
                imageId: result.hash || result.objectId,
                thumbnailUrl: result.galleryThumbnail
              }))
            );
          });
        });
    });
  }

  private _removeDuplicateRetailers(listings: any[]): any[] {
    return listings.reduce((acc, current) => {
      const retailerId = current.retailer.id;

      if (!acc.some(item => item.retailer.id === retailerId)) {
        acc.push(current);
      }

      return acc;
    }, []);
  }

  protected readonly UserGalleryActiveLayout = UserGalleryActiveLayout;
}
