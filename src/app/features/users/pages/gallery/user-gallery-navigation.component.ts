import { AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, PLATFORM_ID, Renderer2, TemplateRef, ViewChild } from "@angular/core";
import { UserInterface } from "@shared/interfaces/user.interface";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { ImageAlias } from "@shared/enums/image-alias.enum";
import { DefaultGallerySortingOption, UserProfileInterface } from "@shared/interfaces/user-profile.interface";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { WindowRefService } from "@shared/services/window-ref.service";
import { fromEvent, Subject, throttleTime } from "rxjs";
import { isPlatformBrowser } from "@angular/common";
import { debounceTime, distinctUntilChanged, filter, map, startWith, take, takeUntil } from "rxjs/operators";
import { UserGalleryActiveLayout } from "@features/users/pages/gallery/user-gallery-buttons.component";
import { CollectionInterface } from "@shared/interfaces/collection.interface";
import { selectCollections } from "@app/store/selectors/app/collection.selectors";
import { NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { DeviceService } from "@shared/services/device.service";
import { SmartFolderType } from "@features/users/pages/gallery/user-gallery-smart-folders.component";
import { FindImagesOptionsInterface } from "@shared/services/api/classic/images/image/image-api.service";

type GalleryNavigationComponent = "gallery" | "staging" | "about";

@Component({
  selector: "astrobin-user-gallery-navigation",
  template: `
    <ng-container *ngIf="isBrowser; else loadingTemplate">
      <ng-container *ngIf="currentUserWrapper$ | async as currentUserWrapper">
        <div class="nav-tabs-fade"></div>
        <ul
          ngbNav
          #nav="ngbNav"
          (click)="onTabClick(activeTab)"
          [(activeId)]="activeTab"
          class="nav-tabs"
        >
          <li ngbNavItem="gallery">
            <a ngbNavLink>
              <fa-icon icon="images" class="me-2"></fa-icon>
              <span translate="Gallery"></span>

              <div
                *ngIf="currentUserWrapper.user?.id === user.id"
                ngbDropdown
                container="body"
                class="d-inline-block ms-2"
              >
                <a
                  ngbDropdownToggle
                  [class.active]="activeCollection === null"
                  class="btn btn-sm btn-link no-toggle text-white"
                >
                  <fa-icon icon="caret-down"></fa-icon>
                </a>
                <div ngbDropdownMenu>
                  <a
                    (click)="createCollection()"
                    ngbDropdownItem
                    astrobinEventPreventDefault
                    astrobinEventStopPropagation
                    href="#"
                  >
                    {{ "Create new collection" | translate }}
                  </a>
                </div>
              </div>
            </a>
            <ng-template ngbNavContent>
              <astrobin-user-gallery-collections
                class="d-block mb-5"
                [user]="user"
                [userProfile]="userProfile"
                [parent]="collectionId"
              ></astrobin-user-gallery-collections>

              <astrobin-user-gallery-buttons
                [(activeLayout)]="activeLayout"
                (sortChange)="onSortChange($event)"
              ></astrobin-user-gallery-buttons>

              <ng-container *ngTemplateOutlet="quickSearchTemplate"></ng-container>

              <astrobin-user-gallery-images
                [activeLayout]="activeLayout"
                [expectedImageCount]="activeCollection ? activeCollection.imageCount : userProfile.imageCount"
                [user]="user"
                [userProfile]="userProfile"
                [options]="publicGalleryOptions"
              ></astrobin-user-gallery-images>
            </ng-template>
          </li>

          <li
            *ngIf="currentUserWrapper.user?.id === user.id && !userProfile.displayWipImagesOnPublicGallery"
            ngbNavItem="staging"
          >
            <a ngbNavLink>
              <fa-icon icon="lock" class="me-2"></fa-icon>
              <span translate="Staging area"></span>
            </a>
            <ng-template ngbNavContent>
              <astrobin-user-gallery-buttons [(activeLayout)]="activeLayout"></astrobin-user-gallery-buttons>
              <ng-container *ngTemplateOutlet="quickSearchTemplate"></ng-container>
              <astrobin-user-gallery-images
                [activeLayout]="activeLayout"
                [user]="user"
                [userProfile]="userProfile"
                [options]="stagingAreaOptions"
              ></astrobin-user-gallery-images>
            </ng-template>
          </li>

          <li ngbNavItem="smart-folders">
            <a ngbNavLink>
              <fa-icon icon="folder-open" class="me-2"></fa-icon>
              <span translate="Smart folders"></span>
            </a>
            <ng-template ngbNavContent>
              <astrobin-user-gallery-smart-folders
                (activeChange)="activeSmartFolder = $event"
                [user]="user"
                [userProfile]="userProfile"
              ></astrobin-user-gallery-smart-folders>

              <astrobin-user-gallery-images
                *ngIf="activeSmartFolderType && activeSmartFolder"
                [activeLayout]="activeLayout"
                [user]="user"
                [userProfile]="userProfile"
                [options]="{
                includeStagingArea:
                  currentUserWrapper.user?.id === user.id &&
                  userProfile.displayWipImagesOnPublicGallery,
                subsection: activeSmartFolderType,
                active: activeSmartFolder,
                q: searchModel
              }"
              ></astrobin-user-gallery-images>
            </ng-template>
          </li>

          <li ngbNavItem="marketplace">
            <a ngbNavLink>
              <fa-icon icon="shopping-cart" class="me-2"></fa-icon>
              <span translate="Marketplace"></span>
            </a>
            <ng-template ngbNavContent>
              <astrobin-user-gallery-marketplace
                [user]="user"
              ></astrobin-user-gallery-marketplace>
            </ng-template>
          </li>

          <li ngbNavItem="about">
            <a ngbNavLink>
              <fa-icon icon="user" class="me-2"></fa-icon>
              <span translate="About"></span>
            </a>
            <ng-template ngbNavContent>
              <astrobin-user-gallery-about
                [user]="user"
                [userProfile]="userProfile"
              ></astrobin-user-gallery-about>
            </ng-template>
          </li>

          <ng-container *ngIf="currentUserWrapper.user?.id === user.id">
            <!-- spacer -->
            <li class="flex-grow-1"></li>

            <li ngbNavItem="trash">
              <a ngbNavLink>
                <fa-icon icon="trash" class="me-2"></fa-icon>
                <span translate="Trash"></span>
              </a>
              <ng-template ngbNavContent>
                <astrobin-user-gallery-trash
                  [user]="user"
                  [userProfile]="userProfile"
                ></astrobin-user-gallery-trash>
              </ng-template>
            </li>
          </ng-container>
        </ul>

        <div [ngbNavOutlet]="nav"></div>
      </ng-container>
    </ng-container>

    <ng-template #loadingTemplate>
      <astrobin-loading-indicator class="mt-4"></astrobin-loading-indicator>
    </ng-template>

    <ng-template #createCollectionOffcanvas let-offcanvas>
      <div class="offcanvas-header">
        <h5 class="offcanvas-title">{{ "Create new collection" | translate }}</h5>
        <button type="button" class="btn-close" (click)="offcanvas.close()"></button>
      </div>
      <div class="offcanvas-body">
        <astrobin-user-gallery-collection-create
          [user]="user"
          [userProfile]="userProfile"
          [parent]="null"
          (cancelClick)="offcanvas.close()"
        ></astrobin-user-gallery-collection-create>
      </div>
    </ng-template>

    <ng-template #quickSearchTemplate>
      <input
        class="form-control mb-3 user-gallery-quick-search"
        type="search"
        placeholder="{{ 'Search' | translate }}"
        [(ngModel)]="searchModel"
        (ngModelChange)="onSearchModelChange()"
      />
    </ng-template>
  `,
  styleUrls: ["./user-gallery-navigation.component.scss"]
})
export class UserGalleryNavigationComponent extends BaseComponentDirective implements OnInit, AfterViewInit, OnChanges {
  @Input() user: UserInterface;
  @Input() userProfile: UserProfileInterface;

  @ViewChild("createCollectionOffcanvas") createCollectionOffcanvas: TemplateRef<any>;

  protected readonly ImageAlias = ImageAlias;
  protected readonly isBrowser: boolean;

  protected activeTab: GalleryNavigationComponent = "gallery";
  protected activeLayout = UserGalleryActiveLayout.TINY;
  protected collectionId: CollectionInterface["id"] | null = null;
  protected activeCollection: CollectionInterface | null = null;
  protected activeSmartFolderType: SmartFolderType | null = null;
  protected activeSmartFolder: string | null = null;
  protected searchModel: string | null = null;
  protected publicGalleryOptions: FindImagesOptionsInterface;
  protected stagingAreaOptions: FindImagesOptionsInterface;

  private _searchSubject: Subject<string> = new Subject<string>();

  constructor(
    public readonly store$: Store<MainState>,
    public readonly router: Router,
    public readonly route: ActivatedRoute,
    public readonly windowRefService: WindowRefService,
    @Inject(PLATFORM_ID) public readonly platformId: Object,
    public readonly elementRef: ElementRef,
    public readonly renderer: Renderer2,
    public readonly offcanvasService: NgbOffcanvas,
    public readonly deviceService: DeviceService
  ) {
    super(store$);

    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.route.fragment.pipe(takeUntil(this.destroyed$)).subscribe((fragment: string | null) => {
      this._setActiveTabFromRoute();
    });

    this._searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroyed$)
    ).subscribe(searchTerm => {
      this.publicGalleryOptions = {
        ...this.publicGalleryOptions,
        q: searchTerm,
        page: 1
      };

      this.stagingAreaOptions = {
        ...this.stagingAreaOptions,
        q: searchTerm,
        page: 1
      };
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      this._setCollectionFromRoute();
      this._setSmartFolderFromRoute();
      this._setFindImageOptions();
    });

    this._setActiveTabFromRoute();
    this._setCollectionFromRoute();
    this._setSmartFolderFromRoute();
    this._setFindImageOptions();
  }

  private _setFindImageOptions() {
    this.searchModel = this.route.snapshot.queryParamMap.get("q");
    this.currentUserWrapper$.pipe(take(1)).subscribe(currentUserWrapper => {
      this.publicGalleryOptions = {
        includeStagingArea:
          currentUserWrapper.user?.id === this.user.id &&
          (
            currentUserWrapper.userProfile?.displayWipImagesOnPublicGallery ||
            !!this.collectionId
          ),
        collection: this.collectionId,
        q: this.searchModel,
        subsection: this.userProfile?.defaultGallerySorting === DefaultGallerySortingOption.TITLE ? "title" : null
      }

      this.stagingAreaOptions = {
        onlyStagingArea: currentUserWrapper.user?.id === this.user.id,
        q: this.searchModel
      }
    });
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      const navTabsElement = this.elementRef.nativeElement.querySelector(".nav-tabs");
      const navTabsFadeElement = this.elementRef.nativeElement.querySelector(".nav-tabs-fade");

      const updateFadeVisibility = () => {
        const scrollLeft = navTabsElement.scrollLeft;
        const maxScrollLeft = navTabsElement.scrollWidth - navTabsElement.clientWidth;

        // Check if scrolling is needed (content is overflowing)
        if (navTabsElement.scrollWidth > navTabsElement.clientWidth) {
          this.renderer.setStyle(navTabsFadeElement, "opacity", scrollLeft >= maxScrollLeft ? "0" : "1");
        } else {
          this.renderer.setStyle(navTabsFadeElement, "opacity", "0");
        }
      };

      fromEvent(this.windowRefService.nativeWindow, "resize")
        .pipe(
          startWith(null),
          throttleTime(300),
          takeUntil(this.destroyed$)
        )
        .subscribe(() => {
          updateFadeVisibility();
        });

      fromEvent(navTabsElement, "scroll")
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => updateFadeVisibility());
    }
  }

  ngOnChanges() {
    this.searchModel = null;

    if (
      this.userProfile &&
      this.userProfile.defaultGallerySorting &&
      this.userProfile.defaultGallerySorting === DefaultGallerySortingOption.TITLE
    ) {
      this.publicGalleryOptions = {
        ...this.publicGalleryOptions,
        subsection: "title"
      };
    }
  }

  onTabClick(tab: GalleryNavigationComponent) {
    this.router.navigate([], { fragment: tab });
  }

  protected createCollection() {
    this.offcanvasService.open(this.createCollectionOffcanvas, {
      position: this.deviceService.offcanvasPosition()
    });
  }

  protected onSearchModelChange() {
    this._searchSubject.next(this.searchModel);
  }

  protected onSortChange(sort: string) {
    this.publicGalleryOptions = {
      ...this.publicGalleryOptions,
      subsection: sort
    };

    this.stagingAreaOptions = {
      ...this.stagingAreaOptions,
      subsection: sort
    };
  }

  private _setActiveTabFromRoute() {
    const fragment = this.route.snapshot.fragment;
    if (fragment) {
      this.activeTab = fragment as GalleryNavigationComponent;
    }
  }

  private _setCollectionFromRoute() {
    this.collectionId = this.route.snapshot.queryParams.collection
      ? parseInt(this.route.snapshot.queryParams.collection, 10)
      : null;

    if (this.collectionId) {
      this.store$.select(selectCollections).pipe(
        filter(collections => collections?.length > 0),
        map(collections => collections.find(collection => collection.id === this.collectionId)),
        filter(collection => !!collection),
        take(1)
      ).subscribe(collection => {
        this.activeCollection = collection;
      });
    } else {
      this.activeCollection = null;
    }
  }

  private _setSmartFolderFromRoute() {
    this.activeSmartFolderType = this.route.snapshot.queryParamMap.get("folder-type") as SmartFolderType;
    this.activeSmartFolder = this.route.snapshot.queryParamMap.get("active");
  }
}
