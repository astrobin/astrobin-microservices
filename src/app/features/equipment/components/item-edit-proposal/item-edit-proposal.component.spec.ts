import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ItemEditProposalComponent } from "./item-edit-proposal.component";
import { MockBuilder } from "ng-mocks";
import { provideMockStore } from "@ngrx/store/testing";
import { initialMainState } from "@app/store/state";
import { AppModule } from "@app/app.module";
import { CameraGenerator } from "@features/equipment/generators/camera.generator";
import { NestedCommentsComponent } from "@shared/components/misc/nested-comments/nested-comments.component";
import { EquipmentItemType } from "@features/equipment/types/equipment-item-base.interface";
import { WindowRefService } from "@core/services/window-ref.service";

describe("ItemEditProposalComponent", () => {
  let component: ItemEditProposalComponent;
  let fixture: ComponentFixture<ItemEditProposalComponent>;

  beforeEach(async () => {
    await MockBuilder(ItemEditProposalComponent, AppModule)
      .provide([provideMockStore({ initialState: initialMainState }), WindowRefService])
      .mock(NestedCommentsComponent);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemEditProposalComponent);
    component = fixture.componentInstance;
    jest.spyOn(component.equipmentItemService, "getType").mockReturnValue(EquipmentItemType.CAMERA);
    component.editProposal = CameraGenerator.editProposal();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
