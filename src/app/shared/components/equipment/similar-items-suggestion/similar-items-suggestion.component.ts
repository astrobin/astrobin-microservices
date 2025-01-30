import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { EquipmentItemBaseInterface } from "@features/equipment/types/equipment-item-base.interface";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { BrandInterface } from "@features/equipment/types/brand.interface";
import { MainState } from "@app/store/state";
import { Store } from "@ngrx/store";
import { TranslateService } from "@ngx-translate/core";
import { EquipmentItemService } from "@core/services/equipment-item.service";

@Component({
  selector: "astrobin-similar-items-suggestion",
  templateUrl: "./similar-items-suggestion.component.html",
  styleUrls: ["./similar-items-suggestion.component.scss"]
})
export class SimilarItemsSuggestionComponent extends BaseComponentDirective implements OnInit {
  @Input()
  items: EquipmentItemBaseInterface[] | BrandInterface[];

  @Input()
  preamble: string;

  @Output()
  itemSelected = new EventEmitter<EquipmentItemBaseInterface | BrandInterface>();

  constructor(
    public readonly store$: Store<MainState>,
    public readonly translateService: TranslateService,
    public readonly equipmentItemService: EquipmentItemService
  ) {
    super(store$);
  }

  ngOnInit() {
    super.ngOnInit();

    if (!this.preamble) {
      this.preamble = this.translateService.instant(
        "We found the following similar items. Click the correct one to use it, or ignore this message."
      );
    }
  }
}
