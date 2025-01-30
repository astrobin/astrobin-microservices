import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CameraEditorComponent } from "./camera-editor.component";
import { MockBuilder } from "ng-mocks";
import { provideMockStore } from "@ngrx/store/testing";
import { initialMainState } from "@app/store/state";
import { provideMockActions } from "@ngrx/effects/testing";
import { ReplaySubject } from "rxjs";
import { AppModule } from "@app/app.module";
import { BrandEditorCardComponent } from "@shared/components/equipment/editors/brand-editor-card/brand-editor-card.component";
import { UtilsService } from "@core/services/utils/utils.service";

describe("CameraEditorComponent", () => {
  let component: CameraEditorComponent;
  let fixture: ComponentFixture<CameraEditorComponent>;

  beforeEach(async () => {
    await MockBuilder(CameraEditorComponent, AppModule)
      .provide([provideMockStore({ initialState: initialMainState }), provideMockActions(() => new ReplaySubject<any>()), UtilsService])
      .mock(BrandEditorCardComponent);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameraEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
