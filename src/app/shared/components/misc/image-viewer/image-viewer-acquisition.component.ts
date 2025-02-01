import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, SimpleChanges, TemplateRef, ViewChild } from "@angular/core";
import { ImageViewerSectionBaseComponent } from "@shared/components/misc/image-viewer/image-viewer-section-base.component";
import { SearchService } from "@core/services/search.service";
import { Router } from "@angular/router";
import { MainState } from "@app/store/state";
import { Store } from "@ngrx/store";
import { ImageViewerService } from "@core/services/image-viewer.service";
import { ImageInterface } from "@core/interfaces/image.interface";
import { ImageService } from "@core/services/image/image.service";
import { NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { DeviceService } from "@core/services/device.service";
import { FilterType, FilterTypePriority, LegacyFilterType } from "@features/equipment/types/filter.interface";
import { FilterService } from "@features/equipment/services/filter.service";
import { TranslateService } from "@ngx-translate/core";
import { WindowRefService } from "@core/services/window-ref.service";
import { DeepSkyAcquisitionInterface } from "@core/interfaces/deep-sky-acquisition.interface";
import { CookieService } from "ngx-cookie";
import { CollapseSyncService } from "@core/services/collapse-sync.service";

// This includes total per filter type.
interface FilterSummary {
  totalIntegration: number;
  dates: string[];
  averageMoonIllumination: number;
  number: number;
  duration: string;
}

// This includes each session.
interface DetailedFilterSummary {
  totalIntegration: number;
  details: {
    key: string;
    date: string;
    brand: string;
    name: string;
    number: number;
    duration: string;
    binning: DeepSkyAcquisitionInterface["binning"];
    iso: DeepSkyAcquisitionInterface["iso"];
    gain: DeepSkyAcquisitionInterface["gain"];
    fNumber: DeepSkyAcquisitionInterface["fNumber"];
    sensorCooling: DeepSkyAcquisitionInterface["sensorCooling"];
    darks: DeepSkyAcquisitionInterface["darks"];
    flats: DeepSkyAcquisitionInterface["flats"];
    flatDarks: DeepSkyAcquisitionInterface["flatDarks"];
    bias: DeepSkyAcquisitionInterface["bias"];
    bortle: DeepSkyAcquisitionInterface["bortle"];
    meanSqm: DeepSkyAcquisitionInterface["meanSqm"];
    meanFwhm: DeepSkyAcquisitionInterface["meanFwhm"];
    temperature: DeepSkyAcquisitionInterface["temperature"];
  }[];
}

@Component({
  selector: "astrobin-image-viewer-acquisition",
  template: `
    <ng-container *ngIf="image.solarSystemAcquisitions?.length && !image.deepSkyAcquisitions?.length">
      <div
        (click)="toggleCollapse()"
        [class.collapsed]="collapsed"
        class="metadata-header supports-collapsing"
      >
        {{ "Acquisition" | translate }}
      </div>

      <div
        *ngIf="image.solarSystemAcquisitions?.length && !image.deepSkyAcquisitions?.length"
        class="metadata-section px-2"
        [collapsed]="collapsed"
        collapseAnimation
      >
        <div *ngIf="solarSystemIntegration" class="metadata-item">
          <div class="metadata-icon">
            <fa-icon icon="clock"></fa-icon>
          </div>
          <div class="metadata-label" [innerHTML]="solarSystemIntegration"></div>
        </div>

        <div *ngIf="dates?.length" class="metadata-item">
          <div class="metadata-icon">
            <fa-icon icon="calendar"></fa-icon>
          </div>
          <div class="metadata-label">
            <astrobin-image-viewer-acquisition-dates [dates]="dates"></astrobin-image-viewer-acquisition-dates>
          </div>
        </div>

        <div *ngIf="image.averageMoonIllumination !== null" class="metadata-item">
          <div class="metadata-icon">
            <fa-icon icon="moon"></fa-icon>
          </div>
          <div class="metadata-label">{{ image.averageMoonIllumination | percent }}</div>
        </div>
      </div>
    </ng-container>

    <ng-container *ngIf="image.deepSkyAcquisitions?.length && !image.solarSystemAcquisitions?.length">
      <div
        (click)="toggleCollapse()"
        [class.collapsed]="collapsed"
        class="metadata-header supports-collapsing d-flex justify-content-between"
      >
        <span>{{ "Integration" | translate }}</span>

        <span
          *ngIf="deepSkyIntegrationTime"
          [innerHTML]="deepSkyIntegrationTime"
          class="no-wrap"
        ></span>

        <span *ngIf="!deepSkyIntegrationTime">
          {{ "n/d" | translate }}
        </span>

        <astrobin-image-viewer-acquisition-dates *ngIf="dates?.length" [dates]="dates"></astrobin-image-viewer-acquisition-dates>

        <span *ngIf="dates?.length && image.averageMoonIllumination !== null" class="no-wrap">
          <fa-icon icon="moon"></fa-icon>
          {{ image.averageMoonIllumination | percent }}
        </span>
      </div>

      <div
        [collapsed]="collapsed"
        collapseAnimation
        class="metadata-section"
      >
        <table class="table table-striped d-none d-md-table m-0">
          <tbody>
          <tr *ngFor="let filterSummary of filterSummaries">
            <td [attr.data-label]="'Filter type' | translate">
              <div class="metadata-item">
                <div class="metadata-label">
                  <a
                    (click)="openDeepSkyIntegrationDetails($event)"
                    astrobinEventPreventDefault
                    data-toggle="offcanvas"
                  >
                    {{ humanizeFilterType(filterSummary.filterType) }}
                  </a>
                </div>
              </div>
            </td>

            <td [attr.data-label]="'Frames' | translate">
              <div class="metadata-item">
                <div class="metadata-label">
                  <ng-container *ngTemplateOutlet="deepSkyFramesTemplate; context: { $implicit: filterSummary }">
                  </ng-container>
                </div>
              </div>
            </td>

            <td [attr.data-label]="'Integration' | translate">
              <div class="metadata-item">
                <div class="metadata-label">
                  <span
                    [innerHTML]="imageService.formatIntegration(filterSummary.summary.totalIntegration)"
                    class="no-wrap"
                  ></span>
                </div>
              </div>
            </td>

            <td *ngIf="dates?.length" [attr.data-label]="'Dates' | translate">
              <div class="metadata-item">
                <div class="metadata-label">
                  <astrobin-image-viewer-acquisition-dates
                    [dates]="filterSummary.summary.dates"
                  ></astrobin-image-viewer-acquisition-dates>
                </div>
              </div>
            </td>

            <td *ngIf="dates?.length" [attr.data-label]="'Avg. moon' | translate">
              <div class="metadata-item">
                <div class="metadata-label">
                <span
                  *ngIf="filterSummary.summary.averageMoonIllumination !== null"
                  class="no-wrap"
                >
                  <fa-icon icon="moon"></fa-icon>
                  {{ filterSummary.summary.averageMoonIllumination | percent }}
                </span>
                </div>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <table class="table table-bordered d-md-none m-0">
          <tbody *ngFor="let filterSummary of filterSummaries; let last = last">
          <tr>
            <th [attr.data-label]="'Filter type' | translate">
              <div class="metadata-item">
                <div class="metadata-label">
                  <a
                    (click)="openDeepSkyIntegrationDetails($event)"
                    astrobinEventPreventDefault
                    data-toggle="offcanvas"
                  >
                    {{ humanizeFilterType(filterSummary.filterType) }}
                  </a>
                </div>
              </div>
            </th>

            <td [attr.data-label]="'Integration' | translate">
              <div class="metadata-item justify-content-end">
                <div class="metadata-label">
                  <ng-container *ngTemplateOutlet="deepSkyFramesTemplate; context: { $implicit: filterSummary }">
                  </ng-container>

                  <span class="px-2 symbol">=</span>
                  <span
                    [innerHTML]="imageService.formatIntegration(filterSummary.summary.totalIntegration)"
                    class="no-wrap"
                  ></span>
                </div>
              </div>
            </td>
          <tr>

          <tr>
            <th *ngIf="dates?.length" [attr.data-label]="'Dates' | translate">
              <div class="metadata-item">
                <div class="metadata-label">
                  <astrobin-image-viewer-acquisition-dates
                    [dates]="filterSummary.summary.dates"
                  ></astrobin-image-viewer-acquisition-dates>
                </div>
              </div>
            </th>

            <td *ngIf="dates?.length" [attr.data-label]="'Avg. moon' | translate">
              <div class="metadata-item justify-content-end">
                <div class="metadata-label">
                <span
                  *ngIf="filterSummary.summary.averageMoonIllumination !== null"
                  class="no-wrap"
                >
                  <fa-icon icon="moon"></fa-icon>
                  {{ filterSummary.summary.averageMoonIllumination | percent }}
                </span>
                </div>
              </div>
            </td>
          </tr>

          <tr *ngIf="dates?.length && !last" class="small-spacer-row">
            <td colspan="2"></td>
          </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <ng-template #deepSkyFramesTemplate let-filterSummary>
      <span
        *ngIf="filterSummary.summary.number && filterSummary.summary.duration"
        class="no-wrap"
      >
        <span class="number">{{ filterSummary.summary.number }}</span>
        <span class="symbol">&times;</span>
        <span class="duration">{{ filterSummary.summary.duration }}</span>
        <span class="symbol">&Prime;</span>
      </span>
      <span
        *ngIf="!filterSummary.summary.number || !filterSummary.summary.duration"
        (click)="openDeepSkyIntegrationDetails($event)"
        data-toggle="offcanvas"
      >
        <fa-icon
          [ngbTooltip]="'Mix of exposure times' | translate"
          class="d-none d-lg-inline"
          container="body"
          icon="bars-staggered"
          triggers="hover click"
        ></fa-icon>
        <span class="d-md-none">{{ "Mix of exposure times" | translate }}</span>
      </span>
    </ng-template>

    <ng-template #deepSkyIntegrationDetailsTemplate let-offcanvas>
      <div class="offcanvas-header">
        <h4 class="offcanvas-title">{{ "Acquisition sessions" | translate }}</h4>
        <button type="button" class="btn-close" aria-label="Close" (click)="offcanvas.dismiss()"></button>
      </div>
      <div class="offcanvas-body offcanvas-users">
        <table class="table mt-0 table-mobile-support-md">
          <ng-container *ngFor="let filterType of filterTypes; let i = index">
            <thead>
            <tr *ngIf="i > 0" class="spacer-row">
              <td colspan="3"></td>
            </tr>
            <tr>
              <th>
                {{ humanizeFilterType(filterType) }}
              </th>
              <th class="d-lg-none"></th>
              <th>
                <span
                  [innerHTML]="imageService.formatIntegration(detailedFilterSummaries[filterType].totalIntegration)">
                </span>
              </th>
            </tr>
            </thead>

            <tbody>
            <tr class="small-spacer-row d-none d-lg-block">
              <td colspan="3"></td>
            </tr>

            <tr *ngFor="let detail of detailedFilterSummaries[filterType].details">
              <td [attr.data-label]="'Date' | translate" class="date">
                <ng-container *ngIf="detail.date">
                  {{ detail.date | localDate | date:"mediumDate" }}
                </ng-container>
                <ng-container *ngIf="!detail.date">
                  {{ "Unknown date" | translate }}
                </ng-container>

                <div
                  *ngIf="
                    detail.binning ||
                    detail.iso ||
                    detail.gain ||
                    detail.fNumber ||
                    detail.sensorCooling ||
                    detail.darks ||
                    detail.flats ||
                    detail.flatDarks ||
                    detail.bias ||
                    detail.bortle ||
                    detail.meanSqm ||
                    detail.meanFwhm ||
                    detail.temperature
                  "
                  class="d-none d-lg-block"
                >
                  <ng-container *ngTemplateOutlet="additionalPropertiesTemplate; context: { $implicit: detail }">
                  </ng-container>
                </div>
              </td>

              <td [attr.data-label]="'Filter' | translate" class="d-lg-none">
                <ng-container *ngIf="detail.name">
                  <span class="brand">{{ detail.brand }}</span>
                  <span class="name">{{ detail.name }}</span>
                </ng-container>
                <ng-container *ngIf="!detail.name">
                  {{ "No filter" | translate }}
                </ng-container>
              </td>

              <td
                *ngIf="
                  detail.binning ||
                  detail.iso ||
                  detail.gain ||
                  detail.fNumber ||
                  detail.sensorCooling ||
                  detail.darks ||
                  detail.flats ||
                  detail.flatDarks ||
                  detail.bias ||
                  detail.bortle ||
                  detail.meanSqm ||
                  detail.meanFwhm ||
                  detail.temperature
                "
                [attr.data-label]="'Additional properties' | translate"
                class="d-lg-none"
              >
                <ng-container *ngTemplateOutlet="additionalPropertiesTemplate; context: { $implicit: detail }">
                </ng-container>
              </td>

              <td [attr.data-label]="'Frames' | translate">
                <span class="number">{{ detail.number }}</span>
                <span class="times">&times;</span>
                <span class="duration">{{ detail.duration }}&Prime;</span>
              </td>
            </tr>
            </tbody>
          </ng-container>
        </table>
      </div>

      <ng-template #additionalPropertiesTemplate let-detail>
        <div class="additional-properties">
          <span *ngIf="detail.binning" class="iso">{{ "Binning" | translate }}: <span class="value">{{ detail.binning }}&times;{{ detail.binning }}</span></span>
          <span *ngIf="detail.iso" class="iso">ISO: <span class="value">{{ detail.iso }}</span></span>
          <span *ngIf="detail.gain" class="gain">Gain: <span class="value">{{ detail.gain }}</span></span>
          <span *ngIf="detail.fNumber" class="f-number"><span class="value">f/{{ detail.fNumber }}</span></span>
          <span *ngIf="detail.sensorCooling" class="sensor-cooling">{{ "Cooling" | translate }}: <span
            class="value">{{ detail.sensorCooling }}</span></span>
          <span *ngIf="detail.darks" class="darks">{{ "Darks" | translate }}: <span
            class="value">{{ detail.darks }}</span></span>
          <span *ngIf="detail.flats" class="flats">{{ "Flats" | translate }}: <span
            class="value">{{ detail.flats }}</span></span>
          <span *ngIf="detail.flatDarks" class="flat-darks">{{ "Flat darks" | translate }}: <span
            class="value">{{ detail.flatDarks }}</span></span>
          <span *ngIf="detail.bias" class="bias">{{ "Bias" | translate }}: <span class="value">{{ detail.bias }}</span></span>
          <span *ngIf="detail.bortle" class="bortle">Bortle: <span class="value">{{ detail.bortle }}</span></span>
          <span *ngIf="detail.meanSqm" class="mean-sqm">{{ "Mean SQM" | translate }}: <span
            class="value">{{ detail.meanSqm }}</span></span>
          <span *ngIf="detail.meanFwhm" class="mean-fwhm">{{ "Mean FWHM" | translate }}: <span
            class="value">{{ detail.meanFwhm }}</span></span>
          <span *ngIf="detail.temperature" class="temperature">{{ "Temperature" | translate }}: <span
            class="value">{{ detail.temperature }}</span></span>
        </div>
      </ng-template>
    </ng-template>
  `,
  styleUrls: ["./image-viewer-acquisition.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageViewerAcquisitionComponent extends ImageViewerSectionBaseComponent implements OnChanges {
  dates: string[];
  deepSkyIntegrationTime: string;
  solarSystemIntegration: string;
  filterTypes: string[];
  filterSummaries: { filterType: string, summary: FilterSummary }[] = [];
  detailedFilterSummaries: { [key: string]: DetailedFilterSummary } = {};

  @ViewChild("deepSkyIntegrationDetailsTemplate")
  deepSkyIntegrationDetailsTemplate: TemplateRef<any>;

  constructor(
    public readonly store$: Store<MainState>,
    public readonly searchService: SearchService,
    public readonly router: Router,
    public readonly imageViewerService: ImageViewerService,
    public readonly imageService: ImageService,
    public readonly offcanvasService: NgbOffcanvas,
    public readonly deviceService: DeviceService,
    public readonly filterService: FilterService,
    public readonly translateService: TranslateService,
    public readonly windowRefService: WindowRefService,
    public readonly cookieService: CookieService,
    public readonly collapseSyncService: CollapseSyncService,
    public readonly changeDetectorRef: ChangeDetectorRef
  ) {
    super(
      store$,
      searchService,
      router,
      imageViewerService,
      windowRefService,
      cookieService,
      collapseSyncService,
      changeDetectorRef
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.image && changes.image.currentValue) {
      const image: ImageInterface = changes.image.currentValue;
      const deepSkyDates = image.deepSkyAcquisitions.map(acquisition => acquisition.date);
      const solarSystemDates = image.solarSystemAcquisitions.map(acquisition => acquisition.date);

      this.setDates([...deepSkyDates, ...solarSystemDates].filter(date => !!date));
      this.setDeepSkyIntegrationTime(image);
      this.setSolarSystemFrames(image);

      this.filterSummaries = this._buildFilterSummaries();
    }
  }

  setDates(dates: string[]) {
    this.dates = dates;
  }

  setDeepSkyIntegrationTime(image: ImageInterface) {
    this.deepSkyIntegrationTime = this.imageService.getDeepSkyIntegration(image);
  }

  setSolarSystemFrames(image: ImageInterface) {
    this.solarSystemIntegration = this.imageService.getSolarSystemIntegration(image);
  }

  humanizeFilterType(filterType: string): string {
    if (filterType === "UNKNOWN") {
      return this.translateService.instant("No filter");
    }

    if (
      !Object.values(FilterType).includes(filterType as FilterType) &&
      !Object.values(LegacyFilterType).includes(filterType as LegacyFilterType)
    ) {
      return filterType;
    }

    return this.filterService.humanizeTypeShort(filterType as FilterType);
  }

  openDeepSkyIntegrationDetails(event: MouseEvent): void {
    event.preventDefault();
    this.detailedFilterSummaries = this._buildDetailedFilterSummaries();
    this.filterTypes = Object.keys(this.detailedFilterSummaries);

    this.filterTypes.sort((a, b) => {
      const priorityA = FilterTypePriority[a as keyof typeof FilterTypePriority] ?? Number.MAX_SAFE_INTEGER;
      const priorityB = FilterTypePriority[b as keyof typeof FilterTypePriority] ?? Number.MAX_SAFE_INTEGER;
      return priorityA - priorityB;
    });

    this.offcanvasService.open(this.deepSkyIntegrationDetailsTemplate, {
      panelClass: "image-viewer-offcanvas offcanvas-deep-sky-integration-details",
      backdropClass: "image-viewer-offcanvas-backdrop",
      position: this.deviceService.offcanvasPosition()
    });
  }

  private _buildFilterSummaries(): { filterType: string, summary: FilterSummary }[] {
    const filterSummaries: { [key: string]: FilterSummary } = {};

    this.image.deepSkyAcquisitions.forEach(acquisition => {
      let filterType = acquisition.filter2Type || acquisition.filterType || "UNKNOWN";

      if (filterType === "UNKNOWN" || filterType === "OTHER" || filterType === "CLEAR_OR_COLOR") {
        if (acquisition.filter2) {
          filterType = `${acquisition.filter2Brand} ${acquisition.filter2Name}`;
        } else if (acquisition.filter) {
          filterType = `${acquisition.filterMake} ${acquisition.filterName}`;
        }
      }

      const date = acquisition.date;
      const duration = parseFloat(acquisition.duration).toFixed(2).replace(".00", "");

      if (!filterSummaries[filterType]) {
        filterSummaries[filterType] = {
          totalIntegration: 0,
          dates: [],
          averageMoonIllumination: null,
          number: 0,
          duration
        };
      }

      if (acquisition.number !== null && acquisition.duration !== null) {
        filterSummaries[filterType].totalIntegration += acquisition.number * parseFloat(acquisition.duration);

        const fixedAcquisitionDuration = parseFloat(acquisition.duration).toFixed(2).replace(".00", "");
        const filterExistingDuration = parseFloat(filterSummaries[filterType].duration).toFixed(2).replace(".00", "");

        if (filterExistingDuration === fixedAcquisitionDuration) {
          filterSummaries[filterType].number += acquisition.number;
        } else {
          filterSummaries[filterType].number = null;
          filterSummaries[filterType].duration = null;
        }
      }

      if (date) {
        filterSummaries[filterType].dates.push(date);
      }
    });

    for (const filterType in filterSummaries) {
      const moonIlluminations = this.image.deepSkyAcquisitions
        .filter(
          acquisition =>
            acquisition.filter2Type === filterType ||
            (acquisition.filter2Type === undefined && filterType === "UNKNOWN") ||
            (acquisition.filterType === undefined && filterType === "UNKNOWN")
        )
        .map(acquisition => acquisition.moonIllumination)
        .filter(moonIllumination => moonIllumination !== null);

      filterSummaries[filterType].averageMoonIllumination = moonIlluminations.reduce(
        (acc, moonIllumination) => acc + moonIllumination,
        0
      ) / moonIlluminations.length || null; // handle the case where there are no valid moonIlluminations
    }

    // Convert the object into an array of entries
    const filterSummaryArray = Object.entries(filterSummaries).map(([filterType, summary]) => ({
      filterType,
      summary
    }));

    // Sort the array based on FilterTypePriority
    filterSummaryArray.sort((a, b) => {
      const priorityA = FilterTypePriority[a.filterType as keyof typeof FilterTypePriority] ?? Number.MAX_SAFE_INTEGER;
      const priorityB = FilterTypePriority[b.filterType as keyof typeof FilterTypePriority] ?? Number.MAX_SAFE_INTEGER;
      return priorityA - priorityB;
    });

    return filterSummaryArray;
  }

  private _buildDetailedFilterSummaries(): { [key: string]: DetailedFilterSummary } {
    const detailedFilterSummaries: { [key: string]: DetailedFilterSummary } = {};

    this.image.deepSkyAcquisitions.forEach(acquisition => {
      let filterType = acquisition.filter2Type || acquisition.filterType || "UNKNOWN";

      if (filterType === "UNKNOWN" || filterType === "OTHER" || filterType === "CLEAR_OR_COLOR") {
        if (acquisition.filter2) {
          filterType = `${acquisition.filter2Brand} ${acquisition.filter2Name}`;
        } else if (acquisition.filter) {
          filterType = `${acquisition.filterMake} ${acquisition.filterName}`;
        }
      }

      const name = acquisition.filter2Name || acquisition.filterName;
      const brand = acquisition.filter2Brand || acquisition.filterMake || this.translateService.instant("DIY");
      const date = acquisition.date;
      const duration = parseFloat(acquisition.duration).toFixed(2).replace(".00", "");
      const binning = acquisition.binning;
      const iso = acquisition.iso;
      const gain = acquisition.gain;
      const fNumber = acquisition.fNumber;
      const sensorCooling = acquisition.sensorCooling;
      const darks = acquisition.darks;
      const flats = acquisition.flats;
      const flatDarks = acquisition.flatDarks;
      const bias = acquisition.bias;
      const bortle = acquisition.bortle;
      const meanSqm = acquisition.meanSqm;
      const meanFwhm = acquisition.meanFwhm;
      const temperature = acquisition.temperature;
      const key = `
        ${date}_
        ${brand}_
        ${name || "UNKNOWN"}_
        ${duration}_
        ${binning || "UNKNOWN"}_
        ${iso || "UNKNOWN"}_
        ${gain || "UNKNOWN"}_
        ${fNumber || "UNKNOWN"}_
        ${sensorCooling || "UNKNOWN"}_
        ${darks || "UNKNOWN"}_
        ${flats || "UNKNOWN"}_
        ${flatDarks || "UNKNOWN"}_
        ${bias || "UNKNOWN"}_
        ${bortle || "UNKNOWN"}_
        ${meanSqm || "UNKNOWN"}_
        ${meanFwhm || "UNKNOWN"}_
        ${temperature || "UNKNOWN"}
      `;

      if (!detailedFilterSummaries[filterType]) {
        detailedFilterSummaries[filterType] = {
          totalIntegration: 0,
          details: []
        };
      }

      const existingDetail = detailedFilterSummaries[filterType].details.find(detail => detail.key === key);

      if (existingDetail) {
        // Aggregate exposures if the same date, brand, name, and duration match
        existingDetail.number += acquisition.number;
      } else {
        // Otherwise, create a new entry
        detailedFilterSummaries[filterType].details.push({
          key, // Store the key for easy aggregation later
          date,
          brand,
          name,
          number: acquisition.number,
          duration,
          binning,
          iso,
          gain,
          fNumber,
          sensorCooling,
          darks,
          flats,
          flatDarks,
          bias,
          bortle,
          meanSqm,
          meanFwhm,
          temperature
        });
      }

      detailedFilterSummaries[filterType].totalIntegration += acquisition.number * parseFloat(acquisition.duration);
    });

    return detailedFilterSummaries;
  }
}
