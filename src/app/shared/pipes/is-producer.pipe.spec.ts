import { TestBed } from "@angular/core/testing";
import { UserGenerator } from "@shared/generators/user.generator";
import { IsProducerPipe } from "./is-producer.pipe";
import { MockBuilder } from "ng-mocks";
import { AppModule } from "@app/app.module";

describe("IsProducerPipe", () => {
  let pipe: IsProducerPipe;

  beforeAll(async () => {
    await MockBuilder(IsProducerPipe, AppModule).provide(IsProducerPipe);
    pipe = TestBed.inject(IsProducerPipe);
  });

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("pipe be true when user is in group", () => {
    jest.spyOn(pipe.userService, "isInGroup").mockReturnValue(true);
    expect(pipe.transform(UserGenerator.user())).toBe(true);
  });

  it("pipe be false when user is in not group", () => {
    jest.spyOn(pipe.userService, "isInGroup").mockReturnValue(false);
    expect(pipe.transform(UserGenerator.user())).toBe(false);
  });
});
