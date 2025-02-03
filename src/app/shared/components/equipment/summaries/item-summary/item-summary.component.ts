import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { EquipmentItemReviewerDecision, EquipmentItemType } from "@features/equipment/types/equipment-item-base.interface";
import { EquipmentApiService } from "@features/equipment/services/equipment-api.service";
import { BrandInterface } from "@features/equipment/types/brand.interface";
import { CameraInterface, CameraType, instanceOfCamera } from "@features/equipment/types/camera.interface";
import { TranslateService } from "@ngx-translate/core";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { TelescopeInterface, TelescopeType } from "@features/equipment/types/telescope.interface";
import { distinctUntilKeyChangedOrNull, UtilsService } from "@core/services/utils/utils.service";
import { filter, map, switchMap, take, takeWhile, tap } from "rxjs/operators";
import { CameraDisplayProperty, CameraService } from "@features/equipment/services/camera.service";
import { selectBrand, selectEquipmentItem, selectMostOftenUsedWithForItem } from "@features/equipment/store/equipment.selectors";
import { Observable, of } from "rxjs";
import { GetMostOftenUsedWith, LoadBrand, LoadEquipmentItem, LoadSensor } from "@features/equipment/store/equipment.actions";
import { TelescopeDisplayProperty, TelescopeService } from "@features/equipment/services/telescope.service";
import { SensorDisplayProperty, SensorService } from "@features/equipment/services/sensor.service";
import { EquipmentItemDisplayProperty, EquipmentItemService } from "@core/services/equipment-item.service";
import { EquipmentItem } from "@features/equipment/types/equipment-item.type";
import { instanceOfSensor, SensorInterface } from "@features/equipment/types/sensor.interface";
import { MountInterface } from "@features/equipment/types/mount.interface";
import { MountDisplayProperty, MountService } from "@features/equipment/services/mount.service";
import { FilterInterface } from "@features/equipment/types/filter.interface";
import { FilterDisplayProperty, FilterService } from "@features/equipment/services/filter.service";
import { UserInterface } from "@core/interfaces/user.interface";
import { selectUser } from "@features/account/store/auth.selectors";
import { LoadUser } from "@features/account/store/auth.actions";
import { AccessoryDisplayProperty, AccessoryService } from "@features/equipment/services/accessory.service";
import { AccessoryInterface } from "@features/equipment/types/accessory.interface";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { AssignItemModalComponent } from "@shared/components/equipment/summaries/assign-item-modal/assign-item-modal.component";
import { UserSubscriptionService } from "@core/services/user-subscription/user-subscription.service";
import { WindowRefService } from "@core/services/window-ref.service";
import { AuthService } from "@core/services/auth.service";
import { SubscriptionRequiredModalComponent } from "@shared/components/misc/subscription-required-modal/subscription-required-modal.component";
import { SimplifiedSubscriptionName } from "@core/types/subscription-name.type";
import { MostOftenUsedWithModalComponent } from "@shared/components/equipment/summaries/item/summary/most-often-used-with-modal/most-often-used-with-modal.component";
import { LoadingService } from "@core/services/loading.service";
import { MoreRelatedItemsModalComponent } from "@shared/components/equipment/summaries/item/summary/more-related-items-modal/more-related-items-modal.component";

interface EquipmentItemProperty {
  name: string;
  value: Observable<string | number>;
  link?: string;
}

@Component({
  selector: "astrobin-equipment-item-summary",
  templateUrl: "./item-summary.component.html",
  styleUrls: ["./item-summary.component.scss"]
})
export class ItemSummaryComponent extends BaseComponentDirective implements OnChanges {
  readonly UtilsService = UtilsService;
  readonly EquipmentItemDisplayProperty = EquipmentItemDisplayProperty;

  readonly SHOW_MAX_RELATED_ITEMS = 2;

  @Input()
  item: EquipmentItem;

  @Input()
  showImage = true;

  @Input()
  showLargeImage = false;

  @Input()
  showProperties = true;

  @Input()
  showEmptyProperties = false;

  @Input()
  showClass = true;

  @Input()
  showSubItem = true;

  @Input()
  showMeta = false;

  @Input()
  showStats = true;

  @Input()
  showViewLink = false;

  @Input()
  enableBrandLink = false;

  @Input()
  showCommunityNotes = false;

  @Input()
  showMostOftenUsedWith = false;

  @Input()
  showEditButtons = true;

  @Input()
  showDataDoesNotUpdateInRealTime = true;

  @Output()
  editButtonClick = new EventEmitter<EquipmentItem>();

  brand: BrandInterface;
  subItem: EquipmentItem;
  relatedItems: EquipmentItem[];
  subItemCollapsed = true;
  properties: EquipmentItemProperty[];
  mostOftenUsedWith$: Observable<{ item$: Observable<EquipmentItem>; matches: number }[]>;

  constructor(
    public readonly store$: Store<MainState>,
    public readonly equipmentApiService: EquipmentApiService,
    public readonly translateService: TranslateService,
    public readonly utilsService: UtilsService,
    public readonly equipmentItemService: EquipmentItemService,
    public readonly cameraService: CameraService,
    public readonly telescopeService: TelescopeService,
    public readonly sensorService: SensorService,
    public readonly mountService: MountService,
    public readonly filterService: FilterService,
    public readonly accessoryService: AccessoryService,
    public readonly modalService: NgbModal,
    public readonly userSubscriptionService: UserSubscriptionService,
    public readonly windowRefService: WindowRefService,
    public readonly authService: AuthService,
    public readonly loadingService: LoadingService
  ) {
    super(store$);
  }

  get image(): string {
    return (this.item.thumbnail as string) || (this.item.image as string) || this.placeholder;
  }

  get placeholder(): string {
    const type: EquipmentItemType = this.equipmentItemService.getType(this.item);
    return `/assets/images/${EquipmentItemType[type].toLowerCase()}-placeholder.png?v=2`;
  }

  get properties$(): Observable<EquipmentItemProperty[]> {
    const type: EquipmentItemType = this.equipmentItemService.getType(this.item);
    const variantOf = this.item.variantOf;

    const _properties$ = (variantOfItem: EquipmentItem | null): Observable<EquipmentItemProperty[]> => {
      switch (type) {
        case EquipmentItemType.SENSOR:
          return this._sensorProperties$(variantOfItem);
        case EquipmentItemType.CAMERA:
          return this._cameraProperties$(variantOfItem);
        case EquipmentItemType.TELESCOPE:
          return this._telescopeProperties$(variantOfItem);
        case EquipmentItemType.MOUNT:
          return this._mountProperties$(variantOfItem);
        case EquipmentItemType.FILTER:
          return this._filterProperties$(variantOfItem);
        case EquipmentItemType.ACCESSORY:
          return this._accessoryProperties$(variantOfItem);
        case EquipmentItemType.SOFTWARE:
          return this._softwareProperties$(variantOfItem);
      }
    };

    if (!!variantOf) {
      const data = { id: variantOf, type };
      this.store$.dispatch(new LoadEquipmentItem(data));
      return this.store$.select(selectEquipmentItem, data).pipe(
        filter(variantOfItem => !!variantOfItem),
        take(1),
        switchMap(variantOfItem => _properties$(variantOfItem))
      );
    }

    return _properties$(null);
  }

  get subItemLabel(): string {
    if (this.item.klass === EquipmentItemType.CAMERA) {
      return this.cameraService.getPrintablePropertyName(CameraDisplayProperty.SENSOR, true);
    }

    if (this.item.klass === EquipmentItemType.SENSOR) {
      return this.sensorService.getPrintablePropertyName(SensorDisplayProperty.CAMERAS, true);
    }

    return this.translateService.instant("Sub-item");
  }

  get relatedItemsLabel(): string {
    if (instanceOfSensor(this.item)) {
      return this.sensorService.getPrintablePropertyName(SensorDisplayProperty.CAMERAS, true);
    }

    return this.translateService.instant("Related items");
  }

  get moreRelatedItemsLabel(): string {
    return this.translateService.instant(
      "+ {{ count }} more", { count: this.relatedItems.length - this.SHOW_MAX_RELATED_ITEMS }
    );
  }

  getCreatedBy(): Observable<UserInterface> {
    return this.store$.select(selectUser, this.item.createdBy).pipe(distinctUntilKeyChangedOrNull("id"));
  }

  getAssignee(): Observable<UserInterface | null> {
    return this.store$.select(selectUser, this.item.assignee).pipe(distinctUntilKeyChangedOrNull("id"));
  }

  getReviewedBy(): Observable<UserInterface> {
    return this.store$.select(selectUser, this.item.reviewedBy).pipe(distinctUntilKeyChangedOrNull("id"));
  }

  showLastUpdate(): boolean {
    if (!this.item.updated) {
      return false;
    }

    const created = new Date(this.item.created).getTime();
    const updated = new Date(this.item.updated).getTime();

    return updated - created >= 60000;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.item.createdBy) {
      this.store$.dispatch(new LoadUser({ id: this.item.createdBy }));
    }

    if (this.item.assignee) {
      this.store$.dispatch(new LoadUser({ id: this.item.assignee }));
    }

    if (this.item.reviewedBy) {
      this.store$.dispatch(new LoadUser({ id: this.item.reviewedBy }));
    }

    if (!this.item.createdBy) {
      this.showMeta = false;
    }

    if (!!this.item.brand) {
      this.store$
        .select(selectBrand, this.item.brand)
        .pipe(
          filter(brand => !!brand),
          takeWhile(brand => !this.brand || this.brand.id !== brand.id)
        )
        .subscribe(brand => (this.brand = brand));
    }

    if (instanceOfCamera(this.item) && this.item.sensor) {
      this.store$.dispatch(new LoadSensor({ id: this.item.sensor }));
      this.store$
        .select(selectEquipmentItem, { id: this.item.sensor, type: EquipmentItemType.SENSOR })
        .pipe(
          filter(sensor => !!sensor),
          take(1),
          tap(sensor => {
            if (!!sensor.brand) {
              this.store$.dispatch(new LoadBrand({ id: sensor.brand }));
            }
          })
        )
        .subscribe(sensor => (this.subItem = sensor));
    }

    if (instanceOfSensor(this.item) && this.item.cameras) {
      this.item.cameras.forEach(cameraId => {
        this.store$.dispatch(new LoadEquipmentItem({ id: cameraId, type: EquipmentItemType.CAMERA }));
        this.store$
          .select(selectEquipmentItem, { id: cameraId, type: EquipmentItemType.CAMERA })
          .pipe(
            filter(camera => !!camera),
            take(1),
            tap(camera => {
              if (!!camera.brand) {
                this.store$.dispatch(new LoadBrand({ id: camera.brand }));
              }
            })
          )
          .subscribe(camera => {
            if (!this.relatedItems) {
              this.relatedItems = [];
            }

            this.relatedItems.push(camera);
          });
      });
    }

    if (this.item.reviewerDecision === EquipmentItemReviewerDecision.APPROVED && this.showMostOftenUsedWith) {
      const payload = { itemType: this.item.klass, itemId: this.item.id };
      this.store$.dispatch(new GetMostOftenUsedWith(payload));
      this.mostOftenUsedWith$ = this.store$.select(selectMostOftenUsedWithForItem, payload).pipe(
        filter(data => !!data),
        take(1),
        map(data => {
          return Object.keys(data)
            .map(key => {
              const klass: EquipmentItemType = EquipmentItemType[key.split("-")[0]];
              const id: EquipmentItem["id"] = parseInt(key.split("-")[1], 10);
              const itemPayload = { type: klass, id };

              this.store$.dispatch(new LoadEquipmentItem(itemPayload));

              return {
                item$: this.store$.select(selectEquipmentItem, itemPayload).pipe(
                  filter(item => !!item),
                  take(1)
                ),
                matches: parseInt(data[key], 10)
              };
            })
            .sort((a, b) => b.matches - a.matches);
        })
      );
    }

    this.properties$.pipe(take(1)).subscribe(properties => (this.properties = properties));
  }

  showProperty$(property: EquipmentItemProperty): Observable<boolean> {
    if (!property) {
      return of(false);
    }

    return property.value.pipe(map(value => !!value || this.showEmptyProperties));
  }

  assign() {
    const modalRef = this.modalService.open(AssignItemModalComponent);
    const componentInstance: AssignItemModalComponent = modalRef.componentInstance;
    componentInstance.item = this.item;
    modalRef.closed.subscribe((item: EquipmentItem) => {
      this.item = item;

      if (!!item.assignee) {
        this.store$.dispatch(new LoadUser({ id: item.assignee }));
      }
    });
  }

  itemTypeSupportsMostOftenUsedWith(): boolean {
    return (
      this.item.reviewerDecision === EquipmentItemReviewerDecision.APPROVED &&
      [
        EquipmentItemType.CAMERA,
        EquipmentItemType.TELESCOPE,
        EquipmentItemType.MOUNT,
        EquipmentItemType.FILTER
      ].indexOf(this.item.klass) > -1
    );
  }

  viewMoreRelatedItems() {
    const modalRef: NgbModalRef = this.modalService.open(MoreRelatedItemsModalComponent);
    const componentInstance: MoreRelatedItemsModalComponent = modalRef.componentInstance;
    componentInstance.items = this.relatedItems.slice(this.SHOW_MAX_RELATED_ITEMS);
    componentInstance.title = this.relatedItemsLabel;
  }

  viewMoreMostOftenUsedWith() {
    this.currentUser$.pipe(take(1)).subscribe(user => {
      if (!user) {
        this.windowRefService.locationAssign(this.authService.getLoginUrl());
        return;
      }

      this.userSubscriptionService.fullSearchAllowed$().subscribe(allowed => {
        if (allowed) {
          const modalRef: NgbModalRef = this.modalService.open(MostOftenUsedWithModalComponent);
          const componentInstance: MostOftenUsedWithModalComponent = modalRef.componentInstance;
          componentInstance.item = this.item;
        } else {
          const modalRef: NgbModalRef = this.modalService.open(SubscriptionRequiredModalComponent);
          const componentInstance: SubscriptionRequiredModalComponent = modalRef.componentInstance;
          componentInstance.minimumSubscription = SimplifiedSubscriptionName.ASTROBIN_ULTIMATE_2020;
        }
      });
    });
  }

  private _classProperty(itemType: EquipmentItemType): EquipmentItemProperty {
    return this.showClass
      ? {
        name: this.translateService.instant("Class"),
        value: of(this.equipmentItemService.humanizeType(itemType))
      }
      : null;
  }

  private _variantOfProperty(variantOfItem: EquipmentItem | null): EquipmentItemProperty {
    return !!variantOfItem
      ? {
        name: this.equipmentItemService.getPrintablePropertyName(
          variantOfItem.klass,
          EquipmentItemDisplayProperty.VARIANT_OF
        ),
        value: this.equipmentItemService.getFullDisplayName$(variantOfItem),
        link: `/equipment/explorer/${variantOfItem.klass.toLowerCase()}/${variantOfItem.id}`
      }
      : null;
  }

  private _sensorProperties$(variantOfItem: EquipmentItem | null): Observable<EquipmentItemProperty[]> {
    return of([
      this._classProperty(EquipmentItemType.SENSOR),
      this._variantOfProperty(variantOfItem),
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.PIXELS, true),
        value: this.sensorService.getPrintableProperty$(this.item as SensorInterface, SensorDisplayProperty.PIXELS)
      },
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.PIXEL_SIZE, true),
        value: this.sensorService.getPrintableProperty$(this.item as SensorInterface, SensorDisplayProperty.PIXEL_SIZE)
      },
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.SENSOR_SIZE, true),
        value: this.sensorService.getPrintableProperty$(this.item as SensorInterface, SensorDisplayProperty.SENSOR_SIZE)
      },
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.FULL_WELL_CAPACITY, true),
        value: this.sensorService.getPrintableProperty$(
          this.item as SensorInterface,
          SensorDisplayProperty.FULL_WELL_CAPACITY
        )
      },
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.READ_NOISE, true),
        value: this.sensorService.getPrintableProperty$(this.item as SensorInterface, SensorDisplayProperty.READ_NOISE)
      },
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.QUANTUM_EFFICIENCY, true),
        value: this.sensorService.getPrintableProperty$(
          this.item as SensorInterface,
          SensorDisplayProperty.QUANTUM_EFFICIENCY
        )
      },
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.FRAME_RATE, true),
        value: this.sensorService.getPrintableProperty$(this.item as SensorInterface, SensorDisplayProperty.FRAME_RATE)
      },
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.ADC, true),
        value: this.sensorService.getPrintableProperty$(this.item as SensorInterface, SensorDisplayProperty.ADC)
      },
      {
        name: this.sensorService.getPrintablePropertyName(SensorDisplayProperty.COLOR_OR_MONO, true),
        value: this.sensorService.getPrintableProperty$(
          this.item as SensorInterface,
          SensorDisplayProperty.COLOR_OR_MONO
        )
      }
    ]);
  }

  private _cameraProperties$(variantOfItem: EquipmentItem | null): Observable<EquipmentItemProperty[]> {
    const item: CameraInterface = this.item as CameraInterface;

    return of([
      this._classProperty(EquipmentItemType.CAMERA),
      this._variantOfProperty(variantOfItem),
      {
        name: this.cameraService.getPrintablePropertyName(CameraDisplayProperty.TYPE, true),
        value: this.cameraService.getPrintableProperty$(item, CameraDisplayProperty.TYPE)
      },
      item.type === CameraType.DEDICATED_DEEP_SKY
        ? {
          name: this.cameraService.getPrintablePropertyName(CameraDisplayProperty.COOLED, true),
          value: this.cameraService.getPrintableProperty$(item, CameraDisplayProperty.COOLED)
        }
        : null,
      item.type === CameraType.DEDICATED_DEEP_SKY && item.cooled
        ? {
          name: this.cameraService.getPrintablePropertyName(CameraDisplayProperty.MAX_COOLING, true),
          value: this.cameraService.getPrintableProperty$(item, CameraDisplayProperty.MAX_COOLING)
        }
        : null,
      {
        name: this.cameraService.getPrintablePropertyName(CameraDisplayProperty.BACK_FOCUS, true),
        value: this.cameraService.getPrintableProperty$(item, CameraDisplayProperty.BACK_FOCUS)
      }
    ]);
  }

  private _telescopeProperties$(variantOfItem: EquipmentItem | null): Observable<EquipmentItemProperty[]> {
    const item: TelescopeInterface = this.item as TelescopeInterface;

    const type_ = {
      name: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.TYPE, true),
      value: this.telescopeService.getPrintableProperty$(item, TelescopeDisplayProperty.TYPE)
    };

    const aperture = {
      name: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.APERTURE, true),
      value: this.telescopeService.getPrintableProperty$(item, TelescopeDisplayProperty.APERTURE)
    };

    const focalLength = {
      name: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.FOCAL_LENGTH, true),
      value: this.telescopeService.getPrintableProperty$(item, TelescopeDisplayProperty.FOCAL_LENGTH)
    };

    const weight = {
      name: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.WEIGHT, true),
      value: this.telescopeService.getPrintableProperty$(item, TelescopeDisplayProperty.WEIGHT)
    };

    return of([
      this._classProperty(EquipmentItemType.TELESCOPE),
      this._variantOfProperty(variantOfItem),
      type_,
      item.type !== TelescopeType.CAMERA_LENS ? aperture : null,
      focalLength,
      weight
    ]);
  }

  private _mountProperties$(variantOfItem: EquipmentItem | null): Observable<EquipmentItemProperty[]> {
    const item: MountInterface = this.item as MountInterface;

    let properties = [
      this._classProperty(EquipmentItemType.MOUNT),
      this._variantOfProperty(variantOfItem),
      {
        name: this.mountService.getPrintablePropertyName(MountDisplayProperty.TYPE, true),
        value: this.mountService.getPrintableProperty$(item, MountDisplayProperty.TYPE)
      },
      {
        name: this.mountService.getPrintablePropertyName(MountDisplayProperty.WEIGHT, true),
        value: this.mountService.getPrintableProperty$(item, MountDisplayProperty.WEIGHT)
      },
      {
        name: this.mountService.getPrintablePropertyName(MountDisplayProperty.MAX_PAYLOAD, true),
        value: this.mountService.getPrintableProperty$(item, MountDisplayProperty.MAX_PAYLOAD)
      },
      {
        name: this.mountService.getPrintablePropertyName(MountDisplayProperty.COMPUTERIZED, true),
        value: this.mountService.getPrintableProperty$(item, MountDisplayProperty.COMPUTERIZED)
      }
    ];

    if (item.computerized) {
      properties = [
        ...properties,
        ...[
          {
            name: this.mountService.getPrintablePropertyName(MountDisplayProperty.PERIODIC_ERROR, true),
            value: this.mountService.getPrintableProperty$(item, MountDisplayProperty.PERIODIC_ERROR)
          },
          {
            name: this.mountService.getPrintablePropertyName(MountDisplayProperty.PEC, true),
            value: this.mountService.getPrintableProperty$(item, MountDisplayProperty.PEC)
          },
          {
            name: this.mountService.getPrintablePropertyName(MountDisplayProperty.SLEW_SPEED, true),
            value: this.mountService.getPrintableProperty$(item, MountDisplayProperty.SLEW_SPEED)
          }
        ]
      ];
    }

    return of(properties);
  }

  private _filterProperties$(variantOfItem: EquipmentItem | null): Observable<EquipmentItemProperty[]> {
    const item: FilterInterface = this.item as FilterInterface;

    const properties = [
      this._classProperty(EquipmentItemType.FILTER),
      this._variantOfProperty(variantOfItem),
      {
        name: this.filterService.getPrintablePropertyName(FilterDisplayProperty.TYPE, true),
        value: this.filterService.getPrintableProperty$(item, FilterDisplayProperty.TYPE)
      },
      {
        name: this.filterService.getPrintablePropertyName(FilterDisplayProperty.BANDWIDTH, true),
        value: this.filterService.getPrintableProperty$(item, FilterDisplayProperty.BANDWIDTH)
      },
      {
        name: this.filterService.getPrintablePropertyName(FilterDisplayProperty.SIZE, true),
        value: this.filterService.getPrintableProperty$(item, FilterDisplayProperty.SIZE)
      }
    ];

    return of(properties);
  }

  private _accessoryProperties$(variantOfItem: EquipmentItem | null): Observable<EquipmentItemProperty[]> {
    const item: AccessoryInterface = this.item as AccessoryInterface;

    return of([
      this._classProperty(EquipmentItemType.ACCESSORY),
      this._variantOfProperty(variantOfItem),
      {
        name: this.accessoryService.getPrintablePropertyName(AccessoryDisplayProperty.TYPE, true),
        value: this.accessoryService.getPrintableProperty$(item, AccessoryDisplayProperty.TYPE)
      }
    ]);
  }

  private _softwareProperties$(variantOfItem: EquipmentItem | null): Observable<EquipmentItemProperty[]> {
    return of([this._classProperty(EquipmentItemType.SOFTWARE), this._variantOfProperty(variantOfItem)]);
  }
}
