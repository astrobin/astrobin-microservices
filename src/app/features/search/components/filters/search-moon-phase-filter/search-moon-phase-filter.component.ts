import { Component } from "@angular/core";
import { SearchBaseSliderFilterComponent } from "@features/search/components/filters/search-base-slider-filter/search-base-slider-filter.component";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { TranslateService } from "@ngx-translate/core";
import { DomSanitizer } from "@angular/platform-browser";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { PayableProductInterface } from "@features/subscriptions/interfaces/payable-product.interface";
import { SearchFilterCategory } from "@features/search/interfaces/search-filter-component.interface";
import { SearchFilterService } from "@features/search/services/search-filter.service";
import { SearchAutoCompleteType } from "@features/search/enums/search-auto-complete-type.enum";

@Component({
  selector: "astrobin-search-moon-phase-filter.search-filter-component",
  templateUrl: "../search-base-filter/search-base-filter.component.html",
  styleUrls: ["../search-base-filter/search-base-filter.component.scss"]
})
export class SearchMoonPhaseFilterComponent extends SearchBaseSliderFilterComponent {
  static key = SearchAutoCompleteType.MOON_PHASE;
  static minimumSubscription = PayableProductInterface.LITE;

  readonly category = SearchFilterCategory.SKY_AND_SUBJECTS;
  readonly unit = "%";
  readonly label = this.searchFilterService.humanizeSearchAutoCompleteType(
    SearchMoonPhaseFilterComponent.key as SearchAutoCompleteType
  );

  constructor(
    public readonly store$: Store<MainState>,
    public readonly translateService: TranslateService,
    public readonly domSanitizer: DomSanitizer,
    public readonly modalService: NgbModal,
    public readonly searchFilterService: SearchFilterService
  ) {
    super(store$, translateService, domSanitizer, modalService, searchFilterService);

    this.initFields(SearchMoonPhaseFilterComponent.key, { floor: 0, ceil: 100, step: 1 });
  }
}
