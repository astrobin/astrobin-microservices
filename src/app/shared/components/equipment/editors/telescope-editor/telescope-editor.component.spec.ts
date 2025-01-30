import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TelescopeEditorComponent } from "./telescope-editor.component";
import { MockBuilder } from "ng-mocks";
import { EquipmentModule } from "@features/equipment/equipment.module";
import { provideMockStore } from "@ngrx/store/testing";
import { initialMainState } from "@app/store/state";
import { provideMockActions } from "@ngrx/effects/testing";
import { ReplaySubject } from "rxjs";
import { AppModule } from "@app/app.module";
import { BrandEditorCardComponent } from "@shared/components/equipment/editors/brand-editor-card/brand-editor-card.component";
import { UtilsService } from "@core/services/utils/utils.service";

describe("TelescopeEditorComponent", () => {
  let component: TelescopeEditorComponent;
  let fixture: ComponentFixture<TelescopeEditorComponent>;

  beforeEach(async () => {
    await MockBuilder(TelescopeEditorComponent, EquipmentModule)
      .mock(AppModule, { export: true })
      .provide([provideMockStore({ initialState: initialMainState }), provideMockActions(() => new ReplaySubject<any>()), UtilsService])
      .mock(BrandEditorCardComponent);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TelescopeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
