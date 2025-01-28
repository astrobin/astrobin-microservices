import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BrandEditorFormComponent } from "./brand-editor-form.component";
import { MockBuilder } from "ng-mocks";
import { provideMockStore } from "@ngrx/store/testing";
import { initialMainState } from "@app/store/state";
import { AppModule } from "@app/app.module";
import { UtilsService } from "@core/services/utils/utils.service";

describe("BrandEditorComponent", () => {
  let component: BrandEditorFormComponent;
  let fixture: ComponentFixture<BrandEditorFormComponent>;

  beforeEach(async () => {
    await MockBuilder(BrandEditorFormComponent, AppModule).provide([provideMockStore({ initialState: initialMainState }), UtilsService]);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandEditorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
