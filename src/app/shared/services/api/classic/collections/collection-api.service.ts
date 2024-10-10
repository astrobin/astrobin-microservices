import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BaseClassicApiService } from "@shared/services/api/classic/base-classic-api.service";
import { PaginatedApiResultInterface } from "@shared/services/api/interfaces/paginated-api-result.interface";
import { LoadingService } from "@shared/services/loading.service";
import { EMPTY, Observable } from "rxjs";
import { expand, reduce } from "rxjs/operators";
import { CollectionInterface } from "@shared/interfaces/collection.interface";
import { UserInterface } from "@shared/interfaces/user.interface";
import { UtilsService } from "@shared/services/utils/utils.service";

export interface GetCollectionsParamsInterface {
  user?: UserInterface["id"];
  ids?: CollectionInterface["id"][];
  parent?: CollectionInterface["id"];
  page?: number;
}

@Injectable({
  providedIn: "root"
})
export class CollectionApiService extends BaseClassicApiService {
  configUrl = this.baseUrl + "/astrobin/collection/";

  constructor(public readonly loadingService: LoadingService, public readonly http: HttpClient) {
    super(loadingService);
  }

  getAll(params: GetCollectionsParamsInterface): Observable<CollectionInterface[]> {
    const url = this._buildFindUrl(params);

    return this.http.get<PaginatedApiResultInterface<CollectionInterface>>(url).pipe(
      expand(response => (response.next ? this.http.get(response.next) : EMPTY)),
      reduce(
        (accumulator, response) =>
          accumulator.concat((response as PaginatedApiResultInterface<CollectionInterface>).results),
        []
      )
    );
  }

  find(params: GetCollectionsParamsInterface): Observable<PaginatedApiResultInterface<CollectionInterface>> {
    const url = this._buildFindUrl(params);
    return this.http.get<PaginatedApiResultInterface<CollectionInterface>>(url);
  }

  update(collection: CollectionInterface): Observable<CollectionInterface> {
    return this.http.put<CollectionInterface>(`${this.configUrl}${collection.id}/`, collection);
  }

  delete(collectionId: CollectionInterface["id"]): Observable<void> {
    return this.http.delete<void>(`${this.configUrl}${collectionId}/`);
  }

  private _buildFindUrl(params: GetCollectionsParamsInterface): string {
    let url = this.configUrl;

    if (params.user !== undefined) {
      url = UtilsService.addOrUpdateUrlParam(url, "user", params.user.toString());
    }

    if (params.ids !== undefined && params.ids.length > 0) {
      url = UtilsService.addOrUpdateUrlParam(url, "ids", params.ids.join(","));
    }

    if (params.parent !== undefined) {
      if (params.parent === null) {
        url = UtilsService.addOrUpdateUrlParam(url, "parent", "null");
      } else {
        url = UtilsService.addOrUpdateUrlParam(url, "parent", params.parent.toString());
      }
    }

    if (params.page !== undefined) {
      url = UtilsService.addOrUpdateUrlParam(url, "page", params.page.toString());
    }

    return url;
  }
}
