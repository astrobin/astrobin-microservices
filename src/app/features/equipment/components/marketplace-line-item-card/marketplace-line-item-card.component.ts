import { Component, Input, OnInit } from "@angular/core";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { MarketplaceListingInterface } from "@features/equipment/types/marketplace-listing.interface";
import { filter, switchMap, take } from "rxjs/operators";
import { Store } from "@ngrx/store";
import { State } from "@app/store/state";
import { EquipmentMarketplaceService } from "@features/equipment/services/equipment-marketplace.service";
import { EquipmentItemService } from "@features/equipment/services/equipment-item.service";
import { CountryService } from "@shared/services/country.service";
import { Router } from "@angular/router";
import { MarketplaceLineItemInterface } from "@features/equipment/types/marketplace-line-item.interface";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "astrobin-marketplace-line-item-card",
  templateUrl: "./marketplace-line-item-card.component.html",
  styleUrls: ["./marketplace-line-item-card.component.scss"]
})
export class MarketplaceLineItemCardComponent extends BaseComponentDirective implements OnInit {
  @Input()
  listing: MarketplaceListingInterface;

  @Input()
  lineItem: MarketplaceLineItemInterface;

  totalPrice: number;
  displayName: string;

  constructor(
    public readonly store$: Store<State>,
    public readonly equipmentMarketplaceService: EquipmentMarketplaceService,
    public readonly equipmentItemService: EquipmentItemService,
    public readonly countryService: CountryService,
    public readonly router: Router,
    public readonly translateService: TranslateService
  ) {
    super(store$);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this._buildDisplayName();
  }

  _buildDisplayName() {
    if (!!this.lineItem && !!this.lineItem.itemObjectId) {
      this.equipmentMarketplaceService
        .getLineItemEquipmentItem$(this.lineItem)
        .pipe(
          filter(item => !!item),
          take(1),
          switchMap(item => this.equipmentItemService.getFullDisplayName$(item)),
          take(1)
        )
        .subscribe(displayName => {
          if (!!this.listing.title) {
            this.displayName = `${this.listing.title} - ${displayName}`;
          } else {
            this.displayName = displayName;
          }
        });
    } else {
      this.displayName = this.lineItem.itemPlainText;
    }
  }
}
