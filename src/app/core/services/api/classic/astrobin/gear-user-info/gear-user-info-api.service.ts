import { Injectable } from "@angular/core";
import { LoadingService } from "@core/services/loading.service";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { MigratableGearItemApiService } from "@core/services/api/classic/astrobin/migratable-gear-item-api.service";
import { UserInterface } from "@core/interfaces/user.interface";
import { PaginatedApiResultInterface } from "@core/services/api/interfaces/paginated-api-result.interface";
import { GearUserInfoInterface } from "@core/interfaces/gear-user-info.interface";

@Injectable({
  providedIn: "root"
})
export class GearUserInfoApiService extends MigratableGearItemApiService {
  configUrl = this.baseUrl + "/astrobin/gear-user-info";

  constructor(public readonly loadingService: LoadingService, public readonly http: HttpClient) {
    super(loadingService, http);
  }

  get(id: number): Observable<any> {
    return this.http.get<any>(`${this.configUrl}/${id}/`);
  }

  getForUserAndGear(
    userId: UserInterface["id"],
    gearId: number
  ): Observable<PaginatedApiResultInterface<GearUserInfoInterface>> {
    return this.http.get<PaginatedApiResultInterface<GearUserInfoInterface>>(
      `${this.configUrl}/?user=${userId}&gear=${gearId}`
    );
  }
}
