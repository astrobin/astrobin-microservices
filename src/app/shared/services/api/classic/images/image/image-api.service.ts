import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MainState } from "@app/store/state";
import { environment } from "@env/environment";
import { Store } from "@ngrx/store";
import { ImageAlias } from "@shared/enums/image-alias.enum";
import { ImageThumbnailInterface } from "@shared/interfaces/image-thumbnail.interface";
import { ImageInterface, ImageRevisionInterface } from "@shared/interfaces/image.interface";
import { BaseClassicApiService } from "@shared/services/api/classic/base-classic-api.service";
import { PaginatedApiResultInterface } from "@shared/services/api/interfaces/paginated-api-result.interface";
import { LoadingService } from "@shared/services/loading.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { UserInterface } from "@shared/interfaces/user.interface";
import { ImageEditModelInterface } from "@features/image/services/image-edit.service";
import { UtilsService } from "@shared/services/utils/utils.service";
import { LoadImageOptionsInterface } from "@app/store/actions/image.actions";
import { ImageIotdTpStatsInterface } from "@features/iotd/types/image-iotd-tp-stats.interface";

export interface FindImagesOptionsInterface {
  userId?: UserInterface["id"],
  q?: string,
  hasDeepSkyAcquisitions?: boolean,
  hasSolarSystemAcquisitions?: boolean,
  page?: number,
  gallerySerializer?: boolean,
  includeStagingArea?: boolean,
  onlyStagingArea?: boolean
}

@Injectable({
  providedIn: "root"
})
export class ImageApiService extends BaseClassicApiService {
  configUrl = this.baseUrl + "/images";

  constructor(
    public readonly loadingService: LoadingService,
    public readonly store$: Store<MainState>,
    public readonly http: HttpClient
  ) {
    super(loadingService);
  }

  getImage(
    id: ImageInterface["pk"] | ImageInterface["hash"],
    options: LoadImageOptionsInterface = { skipThumbnails: false }
  ): Observable<ImageInterface> {
    if (isNaN(Number(id))) {
      let url = `${this.configUrl}/image/`;

      url = UtilsService.addOrUpdateUrlParam(url, "hash", `${id}`);
      url = UtilsService.addOrUpdateUrlParam(url, "skip-thumbnails", `${options.skipThumbnails}`);

      return this.http.get<PaginatedApiResultInterface<ImageInterface>>(url).pipe(
        map(response => {
          if (response.results.length > 0) {
            return response.results[0];
          }
          throw new Error("Image not found");
        })
      );
    }

    return this.http.get<ImageInterface>(`${this.configUrl}/image/${id}/`);
  }

  getImages(ids: ImageInterface["pk"][]): Observable<PaginatedApiResultInterface<ImageInterface>> {
    return this.http.get<PaginatedApiResultInterface<ImageInterface>>(`${this.configUrl}/image/?id=${ids.join(",")}`);
  }

  getPublicImagesCountByUserId(userId: UserInterface["id"]): Observable<number> {
    return this.http.get<number>(`${this.configUrl}/image/public-images-count/?user=${userId}`);
  }

  findImages(options: FindImagesOptionsInterface): Observable<PaginatedApiResultInterface<ImageInterface>> {
    let url = `${this.configUrl}/image/`;

    const params: { [key: string]: any } = {
      user: options.userId,
      q: options.q,
      "has-deepsky-acquisitions": options.hasDeepSkyAcquisitions ? "1" : null,
      "has-solarsystem-acquisitions": options.hasSolarSystemAcquisitions ? "1" : null,
      page: options.page,
      "gallery-serializer": options.gallerySerializer ? "1" : null,
      "include-staging-area": options.includeStagingArea ? "true" : null,
      "only-staging-area": options.onlyStagingArea ? "true" : null,
    };

    // Filter out null or undefined values
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url = UtilsService.addOrUpdateUrlParam(url, key, params[key]);
      }
    });

    return this.http.get<PaginatedApiResultInterface<ImageInterface>>(url);
  }

  getThumbnail(
    id: ImageInterface["pk"] | ImageInterface["hash"],
    revision: ImageRevisionInterface["label"],
    alias: ImageAlias,
    bustCache = false
  ): Observable<ImageThumbnailInterface> {
    let url = `${environment.classicBaseUrl}/${id}/${revision}/thumb/${alias}/`;

    if (bustCache) {
      url = `${url}?t=${new Date().getTime()}`;
    }

    return this.http.get<ImageThumbnailInterface>(url);
  }

  updateImage(pk: ImageInterface["pk"], image: ImageEditModelInterface): Observable<ImageInterface> {
    return this.http.put<ImageInterface>(`${this.configUrl}/image/${pk}/`, image);
  }

  updateImageRevision(imageRevision: Partial<ImageRevisionInterface>): Observable<ImageRevisionInterface> {
    return this.http.patch<ImageRevisionInterface>(`${this.configUrl}/image-revision/${imageRevision.pk}/`, imageRevision);
  }

  publishImage(
    pk: ImageInterface["pk"],
    skipNotifications: boolean,
    skipActivityStream: boolean
  ): Observable<ImageInterface> {
    return this.http.put<ImageInterface>(`${this.configUrl}/image/${pk}/publish/`, {
      skipNotifications,
      skipActivityStream
    });
  }

  unpublishImage(pk: ImageInterface["pk"]): Observable<ImageInterface> {
    return this.http.put<ImageInterface>(`${this.configUrl}/image/${pk}/unpublish/`, {});
  }

  markAsFinal(pk: ImageInterface["pk"], revisionLabel: ImageRevisionInterface["label"]): Observable<ImageInterface> {
    return this.http.put<ImageInterface>(`${this.configUrl}/image/${pk}/mark-as-final/`, { revisionLabel });
  }

  deleteOriginal(pk: ImageInterface["pk"]): Observable<ImageInterface> {
    return this.http.patch<ImageInterface>(`${this.configUrl}/image/${pk}/delete-original/`, {});
  }

  deleteRevision(pk: ImageRevisionInterface["pk"]): Observable<ImageInterface> {
    return this.http.delete<ImageInterface>(`${this.configUrl}/image-revision/${pk}/`);
  }

  delete(pk: ImageInterface["pk"]): Observable<ImageInterface> {
    return this.http.delete<ImageInterface>(`${this.configUrl}/image/${pk}/`);
  }

  download(
    pk: ImageInterface["pk"],
    revisionLabel: ImageRevisionInterface["label"],
    version: ImageAlias | "original" | "basic_annotations" | "advanced_annotations"
  ): void {
  }

  deleteUncompressedSourceFile(pk: ImageInterface["pk"]): Observable<ImageInterface> {
    return this.http.patch<ImageInterface>(`${this.configUrl}/image/${pk}/delete-uncompressed-source-file/`, {});
  }

  maySubmitForIotdTpConsideration(pk: ImageInterface["pk"]): Observable<{
    may: boolean,
    reason: string,
    humanizedReason: string
  }> {
    return this.http.get<{
      may: boolean,
      reason: string,
      humanizedReason: string
    }>(
      `${this.configUrl}/image/${pk}/may-submit-for-iotd-tp-consideration/`
    );
  }

  submitForIotdTpConsideration(pk: ImageInterface["pk"]): Observable<ImageInterface> {
    return this.http.patch<ImageInterface>(`${this.configUrl}/image/${pk}/submit-for-iotd-tp-consideration/`, {
      agreedToIotdTpRulesAndGuidelines: true
    });
  }

  getImageStats(imageId: (ImageInterface["hash"] | ImageInterface["pk"])): Observable<ImageIotdTpStatsInterface> {
    return this.http.get<ImageIotdTpStatsInterface>(`${this.baseUrl}/iotd/image-stats/${imageId}/`);
  }

  getVideoEncodingProgress(pk: ImageInterface["pk"]): Observable<number> {
    return this.http.get<number>(`${this.configUrl}/image/${pk}/video-encoding-progress/`);
  }

  getRevisionVideoEncodingProgress(pk: ImageRevisionInterface["pk"]): Observable<number> {
    return this.http.get<number>(`${this.configUrl}/image-revision/${pk}/video-encoding-progress/`);
  }

  acceptCollaboratorRequest(pk: ImageInterface["pk"], userId: UserInterface["id"]): Observable<ImageInterface> {
    return this.http.patch<ImageInterface>(`${this.configUrl}/image/${pk}/accept-collaborator-request/`, { userId });
  }

  denyCollaboratorRequest(pk: ImageInterface["pk"], userId: UserInterface["id"]): Observable<ImageInterface> {
    return this.http.patch<ImageInterface>(`${this.configUrl}/image/${pk}/deny-collaborator-request/`, { userId });
  }

  removeCollaborator(pk: ImageInterface["pk"], userId: UserInterface["id"]): Observable<ImageInterface> {
    return this.http.patch<ImageInterface>(`${this.configUrl}/image/${pk}/remove-collaborator/`, { userId });
  }
}
