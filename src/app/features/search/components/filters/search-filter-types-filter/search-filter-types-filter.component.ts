import { Component } from "@angular/core";
import { SearchBaseFilterComponent } from "@features/search/components/filters/search-base-filter/search-base-filter.component";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { TranslateService } from "@ngx-translate/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FilterType } from "@features/equipment/types/filter.interface";
import { FilterService } from "@features/equipment/services/filter.service";
import { SearchFilterCategory } from "@core/interfaces/search-filter-component.interface";
import { SearchFilterService } from "@features/search/services/search-filter.service";
import { SearchAutoCompleteType } from "@features/search/enums/search-auto-complete-type.enum";

@Component({
  selector: "astrobin-search-filter-types-filter.search-filter-component",
  templateUrl: "../search-base-filter/search-base-filter.component.html",
  styleUrls: ["../search-base-filter/search-base-filter.component.scss"]
})
export class SearchFilterTypesFilterComponent extends SearchBaseFilterComponent {
  static key = SearchAutoCompleteType.FILTER_TYPES;

  readonly category = SearchFilterCategory.EQUIPMENT_ATTRIBUTES;
  readonly label = this.searchFilterService.humanizeSearchAutoCompleteType(
    SearchFilterTypesFilterComponent.key as SearchAutoCompleteType
  );
  readonly editFields = [
    {
      key: SearchFilterTypesFilterComponent.key,
      fieldGroup: [
        {
          key: "value",
          type: "ng-select",
          wrappers: ["default-wrapper"],
          expressions: {
            className: () => {
              return this.value?.value?.length <= 1 ? "mb-0" : "";
            }
          },
          props: {
            closeOnSelect: true,
            hideOptionalMarker: true,
            multiple: true,
            label: this.label,
            description: this.translateService.instant("Only show images acquired with certain filter types."),
            options: Object.keys(FilterType).map(key => ({
              value: key,
              label: this.filterService.humanizeType(key as FilterType)
            }))
          }
        },
        this.getMatchTypeField(`${SearchFilterTypesFilterComponent.key}.value`)
      ]
    }
  ];

  constructor(
    public readonly store$: Store<MainState>,
    public readonly translateService: TranslateService,
    public readonly domSanitizer: DomSanitizer,
    public readonly modalService: NgbModal,
    public readonly searchFilterService: SearchFilterService,
    public readonly filterService: FilterService
  ) {
    super(store$, translateService, domSanitizer, modalService, searchFilterService);
  }

  render(): SafeHtml {
    if (!this.value) {
      return "";
    }

    const filterTypes = this.value.value as FilterType[];
    let renderedValue;

    if (filterTypes.length === 1) {
      renderedValue = this.filterService.humanizeType(filterTypes[0]);
    } else {
      renderedValue = filterTypes
        .map(filterType => this.filterService.humanizeType(filterType))
        .join(", ");
    }

    return this.domSanitizer.bypassSecurityTrustHtml(renderedValue);
  }
}
