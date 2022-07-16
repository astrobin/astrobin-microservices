import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MountEditorComponent } from "./mount-editor.component";
import { MockBuilder } from "ng-mocks";
import { EquipmentModule } from "@features/equipment/equipment.module";
import { provideMockStore } from "@ngrx/store/testing";
import { initialState } from "@app/store/state";
import { provideMockActions } from "@ngrx/effects/testing";
import { ReplaySubject } from "rxjs";
import { AppModule } from "@app/app.module";
import { BrandEditorCardComponent } from "@shared/components/equipment/editors/brand-editor-card/brand-editor-card.component";
import { UtilsService } from "@shared/services/utils/utils.service";

describe("MountEditorComponent", () => {
  let component: MountEditorComponent;
  let fixture: ComponentFixture<MountEditorComponent>;

  beforeEach(async () => {
    await MockBuilder(MountEditorComponent, EquipmentModule)
      .mock(AppModule)
      .provide([provideMockStore({ initialState }), provideMockActions(() => new ReplaySubject<any>()), UtilsService])
      .mock(BrandEditorCardComponent);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MountEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
