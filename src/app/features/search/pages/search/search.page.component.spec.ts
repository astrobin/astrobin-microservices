import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SearchPageComponent } from "./search.page.component";
import { MockBuilder } from "ng-mocks";
import { AppModule } from "@app/app.module";
import { provideMockStore } from "@ngrx/store/testing";
import { initialMainState } from "@app/store/state";
import { ActivatedRoute, Router } from "@angular/router";
import { EMPTY } from "rxjs";

describe("SearchPageComponent", () => {
  let component: SearchPageComponent;
  let fixture: ComponentFixture<SearchPageComponent>;

  beforeEach(async () => {
    await MockBuilder(SearchPageComponent, AppModule).provide([
      provideMockStore({ initialState: initialMainState }),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParams: {}
          },
          queryParams: EMPTY
        }
      },
      {
        provide: Router,
        useValue: {
          events: EMPTY
        }
      }
    ]);
    fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
