import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { UploaderGuardService } from "@features/uploader/services/guards/uploader-guard.service";
import { uploaderRoutes } from "@features/uploader/uploader.routing";
import { PremiumSubscriptionGuardService } from "@core/services/guards/premium-subscription-guard.service";
import { UltimateSubscriptionGuardService } from "@core/services/guards/ultimate-subscription-guard.service";
import { SharedModule } from "@shared/shared.module";
import { UploadxModule } from "ngx-uploadx";
import { RevisionUploaderPageComponent } from "./pages/revision-uploader-page/revision-uploader-page.component";
import { UncompressedSourceUploaderPageComponent } from "./pages/uncompressed-source-uploader-page/uncompressed-source-uploader-page.component";
import { UploaderPageComponent } from "./pages/uploader-page/uploader-page.component";

@NgModule({
  declarations: [RevisionUploaderPageComponent, UncompressedSourceUploaderPageComponent, UploaderPageComponent],
  imports: [RouterModule.forChild(uploaderRoutes), SharedModule, UploadxModule],
  providers: [PremiumSubscriptionGuardService, UltimateSubscriptionGuardService, UploaderGuardService]
})
export class UploaderModule {
}
