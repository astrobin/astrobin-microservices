import { Component } from "@angular/core";
import { SearchAutoCompleteType, SearchService } from "@features/search/services/search.service";
import { SearchBaseSliderFilterComponent } from "@features/search/components/filters/search-base-slider-filter/search-base-slider-filter.component";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { TranslateService } from "@ngx-translate/core";
import { DomSanitizer } from "@angular/platform-browser";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "astrobin-telescope-focal-length-filter.search-filter-component",
  templateUrl: "../search-base-filter/search-base-filter.component.html",
  styleUrls: ["../search-base-filter/search-base-filter.component.scss"]
})
export class SearchTelescopeFocalLengthFilterComponent extends SearchBaseSliderFilterComponent {
  static key = SearchAutoCompleteType.TELESCOPE_FOCAL_LENGTH;
  unit = "mm";
  label = this.searchService.humanizeSearchAutoCompleteType(
    SearchTelescopeFocalLengthFilterComponent.key as SearchAutoCompleteType
  );

  constructor(
    public readonly store$: Store<MainState>,
    public readonly translateService: TranslateService,
    public readonly domSanitizer: DomSanitizer,
    public readonly modalService: NgbModal,
    public readonly searchService: SearchService
  ) {
    super(store$, translateService, domSanitizer, modalService, searchService);

    this.initFields(SearchTelescopeFocalLengthFilterComponent.key, { floor: 0, ceil: 10000, step: 1 });
  }
}
