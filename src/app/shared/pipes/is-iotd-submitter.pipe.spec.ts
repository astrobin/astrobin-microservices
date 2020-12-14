import { TestBed } from "@angular/core/testing";
import { UserGenerator } from "@shared/generators/user.generator";
import { IsIotdSubmitterPipe } from "./is-iotd-submitter.pipe";
import { MockBuilder } from "ng-mocks";
import { AppModule } from "@app/app.module";

describe("IsIotdSubmitterPipe", () => {
  let pipe: IsIotdSubmitterPipe;

  beforeAll(async () => {
    await MockBuilder(IsIotdSubmitterPipe, AppModule).provide(IsIotdSubmitterPipe);
    pipe = TestBed.inject(IsIotdSubmitterPipe);
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
