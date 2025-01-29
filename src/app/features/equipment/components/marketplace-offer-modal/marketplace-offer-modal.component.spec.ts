import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MarketplaceOfferModalComponent } from "./marketplace-offer-modal.component";
import { MockBuilder } from "ng-mocks";
import { AppModule } from "@app/app.module";
import { provideMockStore } from "@ngrx/store/testing";
import { initialMainState } from "@app/store/state";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { MarketplaceGenerator } from "@features/equipment/generators/marketplace.generator";
import { CurrencyPipe } from "@angular/common";

describe("MarketplaceOfferModalComponent", () => {
  let component: MarketplaceOfferModalComponent;
  let fixture: ComponentFixture<MarketplaceOfferModalComponent>;

  beforeEach(async () => {
    await MockBuilder(MarketplaceOfferModalComponent, AppModule).provide([
      provideMockStore({ initialState: initialMainState }),
      NgbActiveModal,
      CurrencyPipe
    ]);

    fixture = TestBed.createComponent(MarketplaceOfferModalComponent);
    component = fixture.componentInstance;
    component.listing = MarketplaceGenerator.listing();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
