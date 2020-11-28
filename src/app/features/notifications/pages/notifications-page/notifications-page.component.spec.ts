import {NotificationInterfaceGenerator} from "@features/notifications/generators/notification.interface.generator";
import {NotificationServiceMock} from "@features/notifications/services/notification.service-mock";
import {NotificationsService} from "@features/notifications/services/notifications.service";
import {NotificationsPageComponent} from "./notifications-page.component";
import {MockBuilder, MockRender} from "ng-mocks";
import {NotificationsModule} from "@features/notifications/notifications.module";
import {AppModule} from "@app/app.module";

describe("NotificationsPageComponent", () => {
  let component: NotificationsPageComponent;

  beforeEach((() =>
    MockBuilder(NotificationsPageComponent, NotificationsModule)
      .mock(AppModule) // parent module
      .provide({
          provide: NotificationsService,
          useClass: NotificationServiceMock
        },
      )),
  );

  beforeEach(() => {
    const fixture = MockRender(NotificationsPageComponent);
    component = fixture.point.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("toggleRead", () => {
    it("should call the right service method", () => {
      const notification = NotificationInterfaceGenerator.notification();
      notification.read = true;

      component.toggleRead(notification);

      expect(component.notificationsService.markAsUnread).toHaveBeenCalledWith(notification);

      notification.read = false;
      component.toggleRead(notification);

      expect(component.notificationsService.markAsRead).toHaveBeenCalledWith(notification);
    });
  });

  describe("markAllAsRead", () => {
    it("should call the service method", () => {
      component.markAllAsRead();

      expect(component.notificationsService.markAllAsRead).toHaveBeenCalled();
    });
  });

  describe("pageChange", () => {
    it("should get notification for that page from the service", () => {
      component.pageChange(2);

      expect(component.notificationsService.getAll).toHaveBeenCalledWith(2);
    });
  });
});
