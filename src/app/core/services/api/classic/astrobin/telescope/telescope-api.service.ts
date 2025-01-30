import { Injectable } from "@angular/core";
import { LoadingService } from "@core/services/loading.service";
import { HttpClient } from "@angular/common/http";
import { MigratableGearItemApiService } from "@core/services/api/classic/astrobin/migratable-gear-item-api.service";

@Injectable({
  providedIn: "root"
})
export class TelescopeApiService extends MigratableGearItemApiService {
  configUrl = this.baseUrl + "/astrobin/telescope";

  constructor(public loadingService: LoadingService, public readonly http: HttpClient) {
    super(loadingService, http);
  }
}
