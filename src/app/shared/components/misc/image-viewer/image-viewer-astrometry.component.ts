import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnChanges, SimpleChanges, TemplateRef, ViewChild } from "@angular/core";
import { ImageService } from "@core/services/image/image.service";
import { ImageViewerSectionBaseComponent } from "@shared/components/misc/image-viewer/image-viewer-section-base.component";
import { SearchService } from "@core/services/search.service";
import { Router } from "@angular/router";
import { MainState } from "@app/store/state";
import { Store } from "@ngrx/store";
import { ImageViewerService } from "@core/services/image-viewer.service";
import { NgbOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { DeviceService } from "@core/services/device.service";
import { ImageInterface, ImageRevisionInterface } from "@core/interfaces/image.interface";
import { WindowRefService } from "@core/services/window-ref.service";
import { AstroUtilsService } from "@core/services/astro-utils/astro-utils.service";
import { SearchCoordsFilterComponent } from "@features/search/components/filters/search-coords-filter/search-coords-filter.component";
import { TranslateService } from "@ngx-translate/core";
import { SearchFilterService } from "@features/search/services/search-filter.service";
import { CookieService } from "ngx-cookie";
import { CollapseSyncService } from "@core/services/collapse-sync.service";
import { ConstellationsService } from "@features/explore/services/constellations.service";

@Component({
  selector: "astrobin-image-viewer-astrometry",
  template: `
    <div *ngIf="image?.solution" class="metadata-section">
      <div *ngIf="celestialHemisphere" class="metadata-item">
        <div class="metadata-icon">
          <fa-icon
            [ngbTooltip]="'Celestial hemisphere' | translate"
            triggers="hover click"
            container="body"
            icon="globe"
          ></fa-icon>
        </div>
        <div class="metadata-label">
          {{ celestialHemisphere }}
        </div>
      </div>

      <div *ngIf="constellation" class="metadata-item">
        <div class="metadata-icon">
          <img
            [ngbTooltip]="'Constellation' | translate"
            triggers="hover click"
            container="body"
            src="/assets/images/subject-types/constellation-white.png?v=1"
            alt=""
          />
        </div>
        <div
          (click)="constellationClicked($event, constellation)"
          [ngbTooltip]="isTouchDevice ? null : constellationFull"
          triggers="hover click"
          container="body"
          class="metadata-link search"
        >
          {{ constellation }}
        </div>
      </div>

      <div *ngIf="coordinates" class="metadata-item">
        <div class="metadata-icon">
          <fa-icon
            [ngbTooltip]="'Coordinates' | translate"
            triggers="hover click"
            container="body"
            icon="crosshairs"
          ></fa-icon>
        </div>
        <div class="metadata-label">
          <span
            (click)="openMoreInfo($event)"
            [innerHTML]="coordinates"
            astrobinEventPreventDefault
            class="coordinates"
            data-toggle="offcanvas"
          >
          </span>
        </div>
      </div>

      <div *ngIf="fieldRadius" class="metadata-item">
        <div class="metadata-icon">
          <fa-icon
            [ngbTooltip]="'Field radius' | translate"
            triggers="hover click"
            container="body"
            icon="arrows-left-right-to-line"
          ></fa-icon>
        </div>
        <div [innerHTML]="fieldRadius" class="metadata-label">
        </div>
      </div>

      <div *ngIf="pixelScale" class="metadata-item">
        <div class="metadata-icon">
          <fa-icon
            [ngbTooltip]="'Pixel scale' | translate"
            triggers="hover click"
            container="body"
            icon="square"
          ></fa-icon>
        </div>
        <div [innerHTML]="pixelScale" class="metadata-label">
        </div>
      </div>

      <div *ngIf="orientation" class="metadata-item">
        <div class="metadata-icon">
          <fa-icon
            [ngbTooltip]="'Orientation' | translate"
            triggers="hover click"
            container="body"
            icon="rotate-left"
          ></fa-icon>
        </div>
        <div [innerHTML]="orientation" class="metadata-label">
        </div>
      </div>
    </div>

    <ng-template #moreInfoTemplate let-offcanvas>
      <div class="offcanvas-header">
        <h4 class="offcanvas-title">{{ "Astrometry details" | translate }}</h4>
        <button type="button" class="btn-close" aria-label="Close" (click)="offcanvas.dismiss()"></button>
      </div>
      <div class="offcanvas-body offcanvas-users">
        <table class="table table-striped">
          <tbody>
          <tr *ngIf="celestialHemisphere">
            <th>{{ "Celestial hemisphere" | translate }}</th>
            <td>{{ celestialHemisphere }}</td>
          </tr>
          <tr *ngIf="constellation">
            <th>{{ "Constellation" | translate }}</th>
            <td>{{ constellationFull }} ({{ constellation }})</td>
          </tr>
          <tr *ngIf="coordinates">
            <th>{{ "Coordinates" | translate }}</th>
            <td [innerHTML]="coordinates"></td>
          </tr>
          <tr *ngIf="fieldRadius">
            <th>{{ "Field radius" | translate }}</th>
            <td [innerHTML]="fieldRadius"></td>
          </tr>
          <tr *ngIf="pixelScale">
            <th>{{ "Pixel scale" | translate }}</th>
            <td [innerHTML]="pixelScale"></td>
          </tr>
          <tr *ngIf="orientation">
            <th>{{ "Orientation" | translate }}</th>
            <td [innerHTML]="orientation"></td>
          </tr>
          <tr *ngIf="astrometryNetJobId">
            <th>Astrometry.net ID</th>
            <td>
              <a
                [href]="'https://nova.astrometry.net/status/' + astrometryNetJobId"
                [innerHTML]="astrometryNetJobId"
                target="_blank"
              ></a>
            </td>
          </tr>
          </tbody>
        </table>

        <hr class="my-4" />

        <h5 class="offcanvas-title">{{ "Copy coordinates" | translate }}</h5>

        <p class="mt-1">
          {{ "Copy the coordinates in decimal or sexagesimal format to your clipboard." | translate }}
        </p>

        <textarea
          class="form-control mt-1"
          rows="6"
          readonly
        >{{ coordinatesTextArea }}</textarea>

        <hr class="my-4" />

        <h5 class="offcanvas-title">{{ "Find images in the same area" | translate }}</h5>

        <p class="mt-2">
          {{
            "Select how many degrees around the center coordinates you'd like to search for astro images, " +
            "ranging from 1 to 5 degrees." | translate
          }}
        </p>
        <div class="degree-choices d-flex flex-nowrap gap-3 mt-4">
          <button
            *ngFor="let degree of [1, 2, 3, 4, 5]"
            (click)="findImagesInTheSameArea(degree)"
            astrobinEventPreventDefault
            class="btn btn-outline-secondary m-0 p-2"
          >
            <span class="symbol">±</span><span class="value">{{ degree }}</span><span class="symbol">°</span>
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styleUrls: ["./image-viewer-astrometry.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageViewerAstrometryComponent extends ImageViewerSectionBaseComponent implements OnChanges {
  protected readonly isTouchDevice: boolean;

  revision: ImageInterface | ImageRevisionInterface;
  celestialHemisphere: string;
  constellation: string;
  constellationFull: string;
  coordinates: string;
  coordinatesTextArea: string;
  fieldRadius: string;
  pixelScale: string;
  orientation: string;
  astrometryNetJobId: string;

  @ViewChild("moreInfoTemplate")
  moreInfoTemplate: TemplateRef<any>;

  constructor(
    public readonly store$: Store<MainState>,
    public readonly searchService: SearchService,
    public readonly searchFilterService: SearchFilterService,
    public readonly router: Router,
    public readonly imageViewerService: ImageViewerService,
    public readonly imageService: ImageService,
    public readonly offcanvasService: NgbOffcanvas,
    public readonly deviceService: DeviceService,
    public readonly windowRefService: WindowRefService,
    public readonly astroUtilsService: AstroUtilsService,
    public readonly translateService: TranslateService,
    public readonly changeDetectorRef: ChangeDetectorRef,
    public readonly cookieService: CookieService,
    public readonly collapseSyncService: CollapseSyncService,
    public readonly constellationsService: ConstellationsService
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

    this.isTouchDevice = deviceService.isTouchEnabled();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.image && changes.image.currentValue || changes.revisionLabel && changes.revisionLabel.currentValue) {
      const image = this.image;
      this.revision = this.imageService.getRevision(image, this.revisionLabel);
      this.celestialHemisphere = this.imageService.getCelestialHemisphere(image, this.revisionLabel);
      this.constellation = this.imageService.getConstellation(image, this.revisionLabel);
      this.constellationFull = this.constellationsService.getConstellationFullName(this.constellation, this.translateService.currentLang);
      this.coordinates = this.imageService.getCoordinates(image, this.revisionLabel);
      this.coordinatesTextArea =
        this.translateService.instant("Decimal") + ": \n" +
        this.imageService.getCoordinatesInDecimalFormat(image, this.revisionLabel) + "\n\n" +
        this.translateService.instant("Sexagesimal") + ": \n" +
        this.imageService.getCoordinates(image, this.revisionLabel, false, false, true, 2);
      this.fieldRadius = this.imageService.getFieldRadius(image, this.revisionLabel);
      this.pixelScale = this.imageService.getPixelScale(image, this.revisionLabel);
      this.orientation = this.imageService.getOrientation(image, this.revisionLabel);
      this.astrometryNetJobId = this.revision?.solution?.submissionId?.toString();
    }
  }

  constellationClicked(event: MouseEvent, constellation: string): void {
    event.preventDefault();

    this.search({ constellation });
  }

  openMoreInfo(event: MouseEvent): void {
    event.preventDefault();
    this.offcanvasService.open(this.moreInfoTemplate, {
      panelClass: "image-viewer-offcanvas offcanvas-more-info",
      backdropClass: "image-viewer-offcanvas-backdrop",
      position: this.deviceService.offcanvasPosition()
    });
  }


  findImagesInTheSameArea(degree: number): void {
    this.offcanvasService.dismiss();

    const minimumSubscription = SearchCoordsFilterComponent.minimumSubscription;

    this.searchFilterService.allowFilter$(minimumSubscription).subscribe(allow => {
      if (allow) {
        this._doFindImagesInTheSameArea(degree);
        this.changeDetectorRef.markForCheck();
      } else {
        this.searchFilterService.openSubscriptionRequiredModal(minimumSubscription);
      }
    });
  }

  private _doFindImagesInTheSameArea(degrees: number): void {
    const ra = parseFloat(this.revision.solution.advancedRa || this.revision.solution.ra);
    const dec = parseFloat(this.revision.solution.advancedDec || this.revision.solution.dec);

    const raMin = this.astroUtilsService.raDegreesToMinutes(Math.max(ra - degrees, 0));
    const raMax = this.astroUtilsService.raDegreesToMinutes(Math.min(ra + degrees, 360));
    const decMin = Math.max(dec - degrees, -90);
    const decMax = Math.min(dec + degrees, 90);

    this.search({
      coords: {
        ra: {
          min: raMin,
          max: raMax
        },
        dec: {
          min: decMin,
          max: decMax
        }
      },
      field_radius: {
        min: 0,
        max: degrees
      }
    });
  }
}
