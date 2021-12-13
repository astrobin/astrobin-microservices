import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AppModule } from "@app/app.module";
import { initialState } from "@app/store/state";
import { provideMockStore } from "@ngrx/store/testing";
import { MockBuilder, MockInstance, MockService } from "ng-mocks";
import { JudgementQueueComponent } from "./judgement-queue.component";
import { ActivatedRoute, ActivatedRouteSnapshot } from "@angular/router";
import { QueueSortButtonComponent } from "@features/iotd/components/queue-sort-button/queue-sort-button.component";

describe("SubmissionQueueComponent", () => {
  let component: JudgementQueueComponent;
  let fixture: ComponentFixture<JudgementQueueComponent>;

  beforeEach(async () => {
    await MockBuilder(JudgementQueueComponent, AppModule)
      .provide(provideMockStore({ initialState }))
      .mock(QueueSortButtonComponent);
  });

  beforeEach(() =>
    MockInstance(ActivatedRoute, () => ({
      snapshot: MockService(ActivatedRouteSnapshot, {
        queryParamMap: {
          has: jest.fn(),
          get: jest.fn(),
          getAll: jest.fn(),
          keys: []
        }
      })
    }))
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(JudgementQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
