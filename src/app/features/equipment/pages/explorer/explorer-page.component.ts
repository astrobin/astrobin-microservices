import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, TemplateRef, ViewChild } from "@angular/core";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { TranslateService } from "@ngx-translate/core";
import { SetBreadcrumb } from "@app/store/actions/breadcrumb.actions";
import { TitleService } from "@core/services/title/title.service";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { EquipmentItemBaseInterface, EquipmentItemType } from "@features/equipment/types/equipment-item-base.interface";
import { Actions } from "@ngrx/effects";
import {
  EQUIPMENT_EXPLORER_PAGE_SORTING_COOKIE,
  ExplorerBaseComponent
} from "@features/equipment/pages/explorer-base/explorer-base.component";
import { WindowRefService } from "@core/services/window-ref.service";
import { filter, take, takeUntil, tap } from "rxjs/operators";
import { EquipmentApiService, EquipmentItemsSortOrder } from "@features/equipment/services/equipment-api.service";
import { selectEquipmentItem } from "@features/equipment/store/equipment.selectors";
import { UtilsService } from "@core/services/utils/utils.service";
import { Location } from "@angular/common";
import { EquipmentItemService } from "@core/services/equipment-item.service";
import { CameraInterface, CameraType } from "@features/equipment/types/camera.interface";
import { PopNotificationsService } from "@core/services/pop-notifications.service";
import { CookieService } from "ngx-cookie";
import {
  ExplorerFilterInterface,
  ExplorerFiltersComponent
} from "@features/equipment/pages/explorer/explorer-filters/explorer-filters.component";
import { CompareService } from "@features/equipment/services/compare.service";
import { ExplorerComponent } from "@features/equipment/components/explorer/explorer.component";
import { ItemTypeNavComponent } from "@features/equipment/components/item-type-nav/item-type-nav.component";
import { NgbModal, NgbModalRef, NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { VariantSelectorModalComponent } from "@shared/components/equipment/item-browser/variant-selector-modal/variant-selector-modal.component";
import { EquipmentItem } from "@features/equipment/types/equipment-item.type";
import { DeviceService } from "@core/services/device.service";
import { ImageViewerService } from "@core/services/image-viewer.service";
import { UserProfileInterface } from "@core/interfaces/user-profile.interface";
import { MobilePageMenuService } from "@core/services/mobile-page-menu.service";

@Component({
  selector: "astrobin-equipment-explorer-page",
  templateUrl: "./explorer-page.component.html",
  styleUrls: ["./explorer-page.component.scss"]
})
export class ExplorerPageComponent extends ExplorerBaseComponent implements OnInit, AfterViewInit {
  readonly EquipmentItemType = EquipmentItemType;
  readonly ExplorerPageSortOrder = EquipmentItemsSortOrder;

  @ViewChild("explorer")
  explorer: ExplorerComponent;

  @ViewChild("explorerFilters")
  explorerFilters: ExplorerFiltersComponent;

  @ViewChild("itemTypeNavComponent")
  itemTypeNavComponent: ItemTypeNavComponent;
  
  // Reference templates for mobile menu
  @ViewChild("titleTemplate", { static: true })
  titleTemplate: TemplateRef<any>;
  
  @ViewChild("descriptionTemplate", { static: true })
  descriptionTemplate: TemplateRef<any>;
  
  @ViewChild("navTemplate", { static: true })
  navTemplate: TemplateRef<any>;

  title = this.translateService.instant("Equipment explorer");
  activeId: EquipmentItemBaseInterface["id"];
  filters: ExplorerFilterInterface[] = [];
  creationMode = false;
  compareComponentVisible = false;
  goBackOnClose = false;

  constructor(
    public readonly store$: Store<MainState>,
    public readonly actions$: Actions,
    public readonly translateService: TranslateService,
    public readonly titleService: TitleService,
    public readonly activatedRoute: ActivatedRoute,
    public readonly router: Router,
    public readonly windowRefService: WindowRefService,
    public readonly equipmentApiService: EquipmentApiService,
    public readonly location: Location,
    public readonly equipmentItemService: EquipmentItemService,
    public readonly popNotificationsService: PopNotificationsService,
    public readonly cookieService: CookieService,
    public readonly compareService: CompareService,
    public readonly utilsService: UtilsService,
    public readonly modalService: NgbModal,
    public readonly changeDetectionRef: ChangeDetectorRef,
    @Inject(PLATFORM_ID) public readonly platformId: Object,
    public readonly deviceService: DeviceService,
    public readonly offcanvasService: NgbOffcanvas,
    public readonly imageViewerService: ImageViewerService,
    private readonly mobilePageMenuService: MobilePageMenuService
  ) {
    super(
      store$,
      actions$,
      activatedRoute,
      router,
      windowRefService,
      cookieService,
      changeDetectionRef,
      platformId,
      deviceService,
      offcanvasService
    );
  }

  ngOnInit(): void {
    super.ngOnInit();

    this._updateTitle(this.activatedRoute.snapshot.data?.item);
    this._setBreadcrumb();
    this._updateDescription(this.activatedRoute.snapshot.data?.item);
    this._setParams();
    this._setLocation();
    this._registerMobilePageMenu();

    this.router.events
      .pipe(
        takeUntil(this.destroyed$),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this._setParams();
        this._updateTitle(this.activatedRoute.snapshot.data?.item);
        this._setBreadcrumb();
      });
  }
  
  ngOnDestroy(): void {
    // Clear the mobile page menu when component is destroyed
    this.mobilePageMenuService.clearMenu();
    super.ngOnDestroy();
  }

  ngAfterViewInit() {
    this.imageViewerService.autoOpenSlideshow(this.componentId, this.activatedRoute);
    
    // Register mobile page menu after view is initialized so templates are available
    this._registerMobilePageMenu();
  }
  
  // Handle mobile menu events from BaseComponentDirective
  onMobileMenuOpen(): void {
    super.onMobileMenuOpen();
    if (this.itemTypeNavComponent) {
      this.itemTypeNavComponent.reinitialize();
    }
  }
  
  onMobileMenuClose(): void {
    super.onMobileMenuClose();
  }

  onSelectedItemChanged(item: EquipmentItemBaseInterface) {
    this.activeId = !!item ? item.id : null;

    this._updateTitle(item);
    this._updateDescription(item);
    this._setLocation();
  }

  viewItem(item: EquipmentItemBaseInterface): void {
    if (item.variants?.length > 0) {
      const modal: NgbModalRef = this.modalService.open(VariantSelectorModalComponent);
      const componentInstance: VariantSelectorModalComponent = modal.componentInstance;
      componentInstance.variants = [...[item], ...item.variants].filter(variant => !variant.frozenAsAmbiguous);
      componentInstance.enableSelectFrozen = false;

      modal.closed.pipe(take(1)).subscribe((variant: EquipmentItem) => {
        this.onSelectedItemChanged(variant);
      });
    } else {
      this.onSelectedItemChanged(item);
    }
  }

  getItems() {
    this.sortOrder =
      (this.cookieService.get(EQUIPMENT_EXPLORER_PAGE_SORTING_COOKIE) as EquipmentItemsSortOrder) ||
      EquipmentItemsSortOrder.AZ;
    this.filters = this.explorerFilters ? this.explorerFilters.activeFilters : [];

    this.items$ = this.equipmentApiService
      .findAllEquipmentItems(this._activeType as EquipmentItemType, {
        page: this.page,
        sortOrder: this.sortOrder,
        filters: this.filters
      });
  }

  filtersApplied(): void {
    this.getItems();
  }

  search(item: EquipmentItem) {
    this.currentUserProfile$.pipe(take(1)).subscribe((userProfile: UserProfileInterface) => {
      if (userProfile && !userProfile.enableNewSearchExperience) {
        this.windowRefService.nativeWindow.location.href = this.equipmentItemService.getClassicSearchUrl(item);
      } else {
        const params = this.equipmentItemService.getSearchParams(item);
        this.router.navigateByUrl(`/search?p=${params}`);
      }
    });
  }

  private _updateTitle(item?: EquipmentItem) {
    if (!!item) {
      this.equipmentItemService.getFullDisplayName$(item).subscribe(fullDisplayName => {
        this.title = fullDisplayName;
        this.titleService.setTitle(this.title);
      });
    } else {
      this.title = this.translateService.instant("Equipment explorer");
      this.titleService.setTitle(this.title);
    }
  }

  private _updateDescription(item?: EquipmentItem) {
    if (!!item) {
      this.equipmentItemService.getFullDisplayName$(item).subscribe(fullDisplayName => {
        this.titleService.setDescription(
          this.translateService.instant(
            "{{ item }} is an equipment item of class {{ klass }} on AstroBin equipment database.",
            { item: fullDisplayName, klass: this.equipmentItemService.humanizeType(item.klass) })
        );
      });
    } else {
      this.titleService.setDescription(
        this.translateService.instant("Explore the AstroBin equipment database.")
      );
    }
  }

  private _setBreadcrumb() {
    this.store$.dispatch(
      new SetBreadcrumb({
        breadcrumb: [
          {
            label: this.translateService.instant("Equipment")
          },
          {
            label: this.translateService.instant("Explorer")
          }
        ]
      })
    );
  }

  private _setParams() {
    this.page = parseInt(this.activatedRoute.snapshot?.queryParamMap.get("page"), 10) || 1;
    this.activeId = parseInt(this.activatedRoute.snapshot?.paramMap.get("itemId"), 10);
  }

  /**
   * Register the mobile page menu with the service
   * Must be called after the view is initialized to access the templates
   */
  private _registerMobilePageMenu(): void {
    // Only register on mobile devices
    if (!this.deviceService.mdMax()) {
      return;
    }
    
    // Only access after ViewInit
    if (!this.titleTemplate || !this.descriptionTemplate || !this.navTemplate) {
      return;
    }
    
    // Register the menu configuration with the service
    this.mobilePageMenuService.registerMenu({
      titleTemplate: this.titleTemplate,
      descriptionTemplate: this.descriptionTemplate,
      template: this.navTemplate,
    });
  }
  
  private _setLocation() {
    const _doSetLocation = (item: EquipmentItemBaseInterface) => {
      this.utilsService.delay(100).subscribe(() => {
        if (!item) {
          const urlObject = this.windowRefService.getCurrentUrl();

          let url = `/equipment/explorer/${this.activeType.toLowerCase()}${urlObject.search}${urlObject.hash}`;

          if (this.page > 1) {
            url = UtilsService.addOrUpdateUrlParam(url, "page", this.page + "");
          }

          if (this.sortOrder !== EquipmentItemsSortOrder.AZ) {
            url = UtilsService.addOrUpdateUrlParam(url, "sort", this.sortOrder);
          }

          this.location.replaceState(url);
          return;
        }

        const hash = this.windowRefService.nativeWindow.location.hash;

        if (
          this.activatedRoute.snapshot?.queryParamMap.get("request-review") === "true" &&
          item &&
          !!item.reviewerDecision
        ) {
          this.popNotificationsService.warning(
            this.translateService.instant("This item has already been approved by you or another moderator.")
          );
        }

        if (this.activatedRoute.snapshot?.queryParamMap.get("edit") === "true") {
          this.explorer.startEditMode();
        }

        this.goBackOnClose = this.activatedRoute.snapshot?.queryParamMap.get("back-on-close") === "true";

        let slug = UtilsService.slugify(`${!!item.brandName ? item.brandName : "diy"} ${item.name}`);

        if (this.equipmentItemService.getType(item) === EquipmentItemType.CAMERA) {
          const camera = item as CameraInterface;

          if (camera.type === CameraType.DSLR_MIRRORLESS) {
            if (camera.modified) {
              slug += "-modified";
            }

            if (camera.cooled) {
              slug += "-cooled";
            }
          }
        }

        if (
          this.windowRefService.nativeWindow.location.pathname.indexOf(
            `/${this.activeType.toLowerCase()}/${item.id}/`
          ) === -1
        ) {
          this.location.replaceState(`/equipment/explorer/${this.activeType.toLowerCase()}/${item.id}/${slug}${hash}`);
        }
      });
    };

    if (!!this.activeId) {
      this.store$
        .select(selectEquipmentItem, { id: this.activeId, type: this.activeType })
        .pipe(
          filter(item => !!item),
          take(1)
        )
        .subscribe(item => {
          _doSetLocation(item);
        });
    } else {
      _doSetLocation(null);
    }
  }
}
