import { Injectable } from "@angular/core";
import { BaseClassicApiService } from "@shared/services/api/classic/base-classic-api.service";
import { BaseService } from "@shared/services/base.service";
import { LoadingService } from "@shared/services/loading.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { EMPTY, Observable, of } from "rxjs";
import {
  EquipmentItemBaseInterface,
  EquipmentItemReviewerRejectionReason,
  EquipmentItemType
} from "@features/equipment/interfaces/equipment-item-base.interface";
import { PaginatedApiResultInterface } from "@shared/services/api/interfaces/paginated-api-result.interface";
import { catchError, map, switchMap, take } from "rxjs/operators";
import { BrandInterface } from "@features/equipment/interfaces/brand.interface";
import { ContentTypeInterface } from "@shared/interfaces/content-type.interface";
import { CommonApiService } from "@shared/services/api/classic/common/common-api.service";
import { CameraInterface } from "@features/equipment/interfaces/camera.interface";
import { SensorInterface } from "@features/equipment/interfaces/sensor.interface";
import { TelescopeInterface } from "@features/equipment/interfaces/telescope.interface";
import { PopNotificationsService } from "@shared/services/pop-notifications.service";
import { TranslateService } from "@ngx-translate/core";
import { EquipmentItemService } from "@features/equipment/services/equipment-item.service";
import { EditProposalInterface } from "@features/equipment/interfaces/edit-proposal.interface";
import { UtilsService } from "@shared/services/utils/utils.service";

@Injectable({
  providedIn: "root"
})
export class EquipmentApiService extends BaseClassicApiService implements BaseService {
  configUrl = this.baseUrl + "/equipment";

  constructor(
    public readonly loadingService: LoadingService,
    public readonly http: HttpClient,
    public readonly commonApiService: CommonApiService,
    public readonly popNotificationService: PopNotificationsService,
    public readonly translateService: TranslateService,
    public readonly equipmentItemService: EquipmentItemService
  ) {
    super(loadingService);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // GENERIC API
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getEquipmentItem(
    id: EquipmentItemBaseInterface["id"],
    type: EquipmentItemType
  ): Observable<EquipmentItemBaseInterface> {
    return this.http.get<EquipmentItemBaseInterface>(`${this.configUrl}/${type.toLowerCase()}/${id}/`);
  }

  getAllEquipmentItems(type: EquipmentItemType): Observable<PaginatedApiResultInterface<EquipmentItemBaseInterface>> {
    return this.http.get<PaginatedApiResultInterface<EquipmentItemBaseInterface>>(
      `${this.configUrl}/${type.toLowerCase()}/`
    );
  }

  getAllEquipmentItemsPendingReview(
    type: EquipmentItemType
  ): Observable<PaginatedApiResultInterface<EquipmentItemBaseInterface>> {
    return this.http.get<PaginatedApiResultInterface<EquipmentItemBaseInterface>>(
      `${this.configUrl}/${type.toLowerCase()}/?pending_review=true`
    );
  }

  getAllEquipmentItemsPendingEdit(
    type: EquipmentItemType
  ): Observable<PaginatedApiResultInterface<EquipmentItemBaseInterface>> {
    return this.http.get<PaginatedApiResultInterface<EquipmentItemBaseInterface>>(
      `${this.configUrl}/${type.toLowerCase()}/?pending_edit=true`
    );
  }

  findAllEquipmentItems(q: string, type: EquipmentItemType): Observable<EquipmentItemBaseInterface[]> {
    if (!q) {
      return of([]);
    }

    return this.http
      .get<PaginatedApiResultInterface<EquipmentItemBaseInterface>>(`${this.configUrl}/${type.toLowerCase()}/?q=${q}`)
      .pipe(map(response => response.results));
  }

  findSimilarInBrand(
    brand: BrandInterface["id"],
    q: string,
    type: EquipmentItemType
  ): Observable<EquipmentItemBaseInterface[]> {
    if (!brand || !q) {
      return of([]);
    }

    return this.http.get<EquipmentItemBaseInterface[]>(
      `${this.configUrl}/${type.toLowerCase()}/find-similar-in-brand/?brand=${brand}&q=${q}`
    );
  }

  getOthersInBrand(brand: BrandInterface["id"], type: EquipmentItemType): Observable<EquipmentItemBaseInterface[]> {
    if (!brand) {
      return of([]);
    }

    return this.http.get<EquipmentItemBaseInterface[]>(
      `${this.configUrl}/${type.toLowerCase()}/others-in-brand/?brand=${brand}`
    );
  }

  getByContentTypeAndObjectId(
    contentTypeId: ContentTypeInterface["id"],
    objectId: EquipmentItemBaseInterface["id"]
  ): Observable<EquipmentItemBaseInterface> {
    return this.commonApiService.getContentTypeById(contentTypeId).pipe(
      switchMap(contentType => {
        // TODO: complete
        switch (contentType.model) {
          case "camera":
            return this.getCamera(objectId);
          case "sensor":
            return this.getSensor(objectId);
          case "telescope":
            return this.getTelescope(objectId);
        }
      })
    );
  }

  getByNameAndType(
    name: EquipmentItemBaseInterface["name"],
    type: EquipmentItemType
  ): Observable<EquipmentItemBaseInterface | null> {
    const path = EquipmentItemType[type].toLowerCase();
    return this.http
      .get<PaginatedApiResultInterface<EquipmentItemBaseInterface>>(`${this.configUrl}/${path}/?name=${name}`)
      .pipe(map(response => (response.count > 0 ? response.results[0] : null)));
  }

  approveEquipmentItem(item: EquipmentItemBaseInterface, comment: string): Observable<EquipmentItemBaseInterface> {
    const type = this.equipmentItemService.getType(item);
    const path = EquipmentItemType[type].toLowerCase();

    return this.http.post<EquipmentItemBaseInterface>(`${this.configUrl}/${path}/${item.id}/approve/`, { comment });
  }

  rejectEquipmentItem(
    item: EquipmentItemBaseInterface,
    reason: EquipmentItemReviewerRejectionReason,
    comment: string
  ): Observable<EquipmentItemBaseInterface> {
    const type = this.equipmentItemService.getType(item);
    const path = EquipmentItemType[type].toLowerCase();

    return this.http.post<EquipmentItemBaseInterface>(`${this.configUrl}/${path}/${item.id}/reject/`, {
      reason,
      comment
    });
  }

  getEditProposals(
    item: EquipmentItemBaseInterface
  ): Observable<PaginatedApiResultInterface<EditProposalInterface<EquipmentItemBaseInterface>>> {
    const type = this.equipmentItemService.getType(item);
    const path = EquipmentItemType[type].toLowerCase();

    return this.http.get<PaginatedApiResultInterface<EditProposalInterface<EquipmentItemBaseInterface>>>(
      `${this.configUrl}/${path}-edit-proposal/?edit_proposal_target=${item.id}`
    );
  }

  approveEditProposal(
    editProposal: EditProposalInterface<EquipmentItemBaseInterface>,
    comment: string
  ): Observable<EditProposalInterface<EquipmentItemBaseInterface>> {
    const type = this.equipmentItemService.getType(editProposal);
    const path = EquipmentItemType[type].toLowerCase();

    return this.http.post<EditProposalInterface<EquipmentItemBaseInterface>>(
      `${this.configUrl}/${path}-edit-proposal/${editProposal.id}/approve/`,
      { comment }
    );
  }

  rejectEditProposal(
    editProposal: EditProposalInterface<EquipmentItemBaseInterface>,
    comment: string
  ): Observable<EditProposalInterface<EquipmentItemBaseInterface>> {
    const type = this.equipmentItemService.getType(editProposal);
    const path = EquipmentItemType[type].toLowerCase();

    return this.http.post<EditProposalInterface<EquipmentItemBaseInterface>>(
      `${this.configUrl}/${path}-edit-proposal/${editProposal.id}/reject/`,
      { comment }
    );
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // BRAND API
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getBrand(id: BrandInterface["id"]): Observable<BrandInterface> {
    return this.http.get<BrandInterface>(`${this.configUrl}/brand/${id}/`);
  }

  getBrandsByName(name: BrandInterface["name"]): Observable<PaginatedApiResultInterface<BrandInterface>> {
    return this.http.get<PaginatedApiResultInterface<BrandInterface>>(`${this.configUrl}/brand/?name=${name}`);
  }

  getBrandsByWebsite(website: BrandInterface["website"]): Observable<PaginatedApiResultInterface<BrandInterface>> {
    return this.http.get<PaginatedApiResultInterface<BrandInterface>>(`${this.configUrl}/brand/?website=${website}`);
  }

  createBrand(brand: Omit<BrandInterface, "id">): Observable<BrandInterface> {
    const { logo, ...brandWithoutLogo } = brand;

    return new Observable<BrandInterface>(observer => {
      this.http
        .post<BrandInterface>(`${this.configUrl}/brand/`, brandWithoutLogo)
        .pipe(take(1))
        .subscribe(createdBrand => {
          if (brand.logo && brand.logo.length > 0) {
            this.uploadBrandLogo(createdBrand.id, (brand.logo as File[])[0])
              .pipe(
                take(1),
                catchError(error => {
                  let message = "";

                  if (error && error.error && error.error.logo && error.error.logo.length > 0) {
                    message = error.error.logo[0];
                  }

                  this.popNotificationService.warning(
                    this.translateService.instant(
                      `Something went wrong with uploading the logo, but this brand was created anyway. ${message}`
                    )
                  );

                  return of(createdBrand);
                })
              )
              .subscribe(() => {
                observer.next(createdBrand);
                observer.complete();
              });
          } else {
            observer.next(createdBrand);
            observer.complete();
          }
        });
    });
  }

  uploadBrandLogo(id: BrandInterface["id"], logo: File): Observable<BrandInterface> {
    const formData: FormData = new FormData();
    formData.append("logo", logo);

    const httpOptions = {
      headers: new HttpHeaders({
        // Unsetting the Content-Type is necessary so it gets set to multipart/form-data with the correct boundary.
        "Content-Type": "__unset__",
        "Content-Disposition": `form-data; name="logo"; filename=${logo.name}`
      })
    };

    return this.http.post<BrandInterface>(`${this.configUrl}/brand/${id}/logo/`, formData, httpOptions);
  }

  findAllBrands(q: string): Observable<BrandInterface[]> {
    if (!q) {
      return of([]);
    }

    return this.http
      .get<PaginatedApiResultInterface<BrandInterface>>(`${this.configUrl}/brand/?q=${q}`)
      .pipe(map(response => response.results));
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // SENSOR API
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  createSensor(sensor: Omit<SensorInterface, "id">): Observable<SensorInterface> {
    return this._createItem<SensorInterface>(sensor, "sensor");
  }

  createSensorEditProposal(
    editProposal: Omit<EditProposalInterface<SensorInterface>, "id">
  ): Observable<EditProposalInterface<SensorInterface>> {
    return this._createItemEditProposal<SensorInterface>(editProposal, "sensor");
  }

  getSensor(id: SensorInterface["id"]): Observable<SensorInterface> {
    return this.http.get<SensorInterface>(`${this.configUrl}/sensor/${id}/`);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // CAMERA API
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  createCamera(camera: Omit<CameraInterface, "id">): Observable<CameraInterface> {
    return this._createItem<CameraInterface>(camera, "camera");
  }

  createCameraEditProposal(
    editProposal: Omit<EditProposalInterface<CameraInterface>, "id">
  ): Observable<EditProposalInterface<CameraInterface>> {
    return this._createItemEditProposal<CameraInterface>(editProposal, "camera");
  }

  getCamera(id: CameraInterface["id"]): Observable<CameraInterface> {
    return this.http.get<CameraInterface>(`${this.configUrl}/camera/${id}/`);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // TELESCOPE API
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  getTelescope(id: TelescopeInterface["id"]): Observable<TelescopeInterface> {
    return this.http.get<TelescopeInterface>(`${this.configUrl}/telescope/${id}/`);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // PRIVATE
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  private _createItem<T extends EquipmentItemBaseInterface>(item: Omit<T, "id">, path: string): Observable<T> {
    const { image, ...itemWithoutImage } = item;

    return new Observable<T>(observer => {
      this.http
        .post<T>(`${this.configUrl}/${path}/`, itemWithoutImage)
        .pipe(take(1))
        .subscribe(createdItem => {
          if (item.image && item.image.length > 0) {
            this._uploadItemImage<T>(createdItem.id, (item.image as File[])[0], path)
              .pipe(
                take(1),
                catchError(error => {
                  let message = "";

                  if (error && error.error && error.error.image && error.error.image.length > 0) {
                    message = error.error.image[0];
                  }

                  this.popNotificationService.warning(
                    this.translateService.instant(
                      `Something went wrong with uploading the image, but this item was created anyway. ${message}`
                    )
                  );

                  return of(createdItem);
                })
              )
              .subscribe(createdItemWithImage => {
                observer.next({ ...createdItem, ...createdItemWithImage });
                observer.complete();
              });
          } else {
            observer.next(createdItem);
            observer.complete();
          }
        });
    });
  }

  private _uploadItemImage<T extends EquipmentItemBaseInterface>(
    id: T["id"],
    image: File,
    path: string
  ): Observable<T> {
    const formData: FormData = new FormData();
    formData.append("image", image);

    const httpOptions = {
      headers: new HttpHeaders({
        // Unsetting the Content-Type is necessary so it gets set to multipart/form-data with the correct boundary.
        "Content-Type": "__unset__",
        "Content-Disposition": `form-data; name="image"; filename=${image.name}`
      })
    };

    return this.http.post<T>(`${this.configUrl}/${path}/${id}/image/`, formData, httpOptions);
  }

  private _createItemEditProposal<T extends EquipmentItemBaseInterface>(
    item: Omit<EditProposalInterface<T>, "id">,
    path: string
  ): Observable<EditProposalInterface<T>> {
    const { image, ...itemWithoutImage } = item;

    return new Observable<EditProposalInterface<T>>(observer => {
      this.http
        .post<EditProposalInterface<T>>(`${this.configUrl}/${path}-edit-proposal/`, itemWithoutImage)
        .pipe(
          take(1),
          catchError(error => {
            this.popNotificationService.error(`Something went wrong: ${JSON.stringify(error.error)}`);
            return EMPTY;
          })
        )
        .subscribe(createdEditProposal => {
          if (item.image && !UtilsService.isString(item.image) && item.image.length > 0) {
            this._uploadEditProposalImage<T>(createdEditProposal.id, (item.image as File[])[0], path)
              .pipe(
                take(1),
                catchError(error => {
                  let message = "";

                  if (error && error.error && error.error.image && error.error.image.length > 0) {
                    message = error.error.image[0];
                  }

                  this.popNotificationService.warning(
                    this.translateService.instant(
                      `Something went wrong with uploading the image, but the form was submitted anyway. ${message}`
                    )
                  );

                  return of(createdEditProposal);
                })
              )
              .subscribe(createdEditProposalWithImage => {
                observer.next({ ...createdEditProposal, ...createdEditProposalWithImage });
                observer.complete();
              });
          } else {
            observer.next(createdEditProposal);
            observer.complete();
          }
        });
    });
  }

  private _uploadEditProposalImage<T extends EquipmentItemBaseInterface>(
    id: T["id"],
    image: File,
    path: string
  ): Observable<EditProposalInterface<T>> {
    const formData: FormData = new FormData();
    formData.append("image", image);

    const httpOptions = {
      headers: new HttpHeaders({
        // Unsetting the Content-Type is necessary so it gets set to multipart/form-data with the correct boundary.
        "Content-Type": "__unset__",
        "Content-Disposition": `form-data; name="image"; filename=${image.name}`
      })
    };

    return this.http.post<EditProposalInterface<T>>(
      `${this.configUrl}/${path}-edit-proposal/${id}/image/`,
      formData,
      httpOptions
    );
  }
}
