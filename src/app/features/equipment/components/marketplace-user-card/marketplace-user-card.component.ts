import { Component, Input, OnChanges } from "@angular/core";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { MainState } from "@app/store/state";
import { Store } from "@ngrx/store";
import { UserInterface } from "@core/interfaces/user.interface";
import { LoadUser } from "@features/account/store/auth.actions";
import { Observable } from "rxjs";
import { selectUser } from "@features/account/store/auth.selectors";
import { filter, takeUntil } from "rxjs/operators";
import { EquipmentMarketplaceService } from "@core/services/equipment-marketplace.service";
import { MarketplaceListingInterface } from "@features/equipment/types/marketplace-listing.interface";
import { CountryService } from "@core/services/country.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "astrobin-marketplace-user-card",
  templateUrl: "./marketplace-user-card.component.html",
  styleUrls: ["./marketplace-user-card.component.scss"]
})
export class MarketplaceUserCardComponent extends BaseComponentDirective implements OnChanges {
  @Input()
  listing: MarketplaceListingInterface;

  user$: Observable<UserInterface>;

  constructor(
    public readonly store$: Store<MainState>,
    public readonly equipmentMarketplaceService: EquipmentMarketplaceService,
    public readonly countryService: CountryService,
    public readonly translateService: TranslateService
  ) {
    super(store$);
  }

  ngOnChanges(): void {
    this.user$ = this.store$.select(selectUser, this.listing.user).pipe(
      filter(user => !!user),
      takeUntil(this.destroyed$)
    );

    this.store$.dispatch(new LoadUser({ id: this.listing.user }));
  }
}
