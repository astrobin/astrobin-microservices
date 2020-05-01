import { TestBed } from "@angular/core/testing";
import { UserGenerator } from "@shared/generators/user.generator";
import { UserServiceMock } from "@shared/services/user.service-mock";
import { IsProducerPipe } from "./is-producer.pipe";

describe("IsProducerPipe", () => {
  let pipe: IsProducerPipe;

  beforeAll(() => {
    pipe = new IsProducerPipe(TestBed.inject(UserServiceMock));
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
