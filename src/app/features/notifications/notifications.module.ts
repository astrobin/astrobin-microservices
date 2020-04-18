import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { routes } from "@features/notifications/notifications.routing";
import { NormalizeNotificationLinkPipe } from "@features/notifications/pipes/normalize-notification-link.pipe";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ComponentsModule } from "@lib/components/components.module";
import { PipesModule } from "@lib/pipes/pipes.module";
import { AuthGuardService } from "@lib/services/guards/auth-guard.service";
import { NgbPaginationModule } from "@ng-bootstrap/ng-bootstrap";
import { TranslateModule } from "@ngx-translate/core";
import { NotificationsPageComponent } from "./pages/notifications-page/notifications-page.component";

@NgModule({
  declarations: [NormalizeNotificationLinkPipe, NotificationsPageComponent],
  imports: [
    CommonModule,
    FontAwesomeModule,
    NgbPaginationModule,
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    ComponentsModule,
    PipesModule
  ],
  providers: [AuthGuardService]
})
export class NotificationsModule {}
