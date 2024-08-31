import { Injectable } from "@angular/core";
import { All, AppActionTypes } from "@app/store/actions/app.actions";
import { LoadImageFailure, LoadImagesSuccess, LoadImageSuccess, MarkAsFinalFailure, MarkAsFinalSuccess, PublishImageFailure, PublishImageSuccess, SaveImageFailure, SaveImageRevisionFailure, SaveImageRevisionSuccess, SaveImageSuccess, UnpublishImageFailure, UnpublishImageSuccess } from "@app/store/actions/image.actions";
import { MainState } from "@app/store/state";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { TranslateService } from "@ngx-translate/core";
import { ImageApiService } from "@shared/services/api/classic/images/image/image-api.service";
import { LoadingService } from "@shared/services/loading.service";
import { PopNotificationsService } from "@shared/services/pop-notifications.service";
import { EMPTY, Observable, of } from "rxjs";
import { catchError, map, mergeMap, tap } from "rxjs/operators";
import { loadResourceEffect } from "@app/store/effects/load-resource.effect";

@Injectable()
export class ImageEffects {
  LoadImage: Observable<LoadImageSuccess | LoadImageFailure> = loadResourceEffect(
    this.actions$,
    this.store$,
    AppActionTypes.LOAD_IMAGE,
    action => action.payload.imageId, // Extracting imageId from action
    (state, id) => state.app.images.find(
      image => image.pk === id || image.hash === id
    ), // Selector for the image
    id => this.imageApiService.getImage(id), // API call to load image
    image => new LoadImageSuccess(image), // Success action
    error => new LoadImageFailure(error), // Failure action
    this.loadingService,
    "image"
  );

  LoadImages: Observable<LoadImagesSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.LOAD_IMAGES),
      mergeMap(action =>
        this.imageApiService.getImages(action.payload).pipe(
          map(response => new LoadImagesSuccess(response)),
          catchError(() => EMPTY)
        )
      )
    )
  );

  SaveImage: Observable<SaveImageSuccess | SaveImageFailure> = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.SAVE_IMAGE),
      tap(() => this.loadingService.setLoading(true)),
      mergeMap(action =>
        this.imageApiService.updateImage(action.payload.pk, action.payload.image).pipe(
          map(() => new SaveImageSuccess({ image: action.payload.image })),
          catchError(error => of(new SaveImageFailure({ error })))
        )
      )
    )
  );

  SaveImageSuccess: Observable<SaveImageSuccess> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.SAVE_IMAGE_SUCCESS),
        tap(() => this.loadingService.setLoading(false))
      ),
    {
      dispatch: false
    }
  );

  SaveImageFailure: Observable<SaveImageFailure> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.SAVE_IMAGE_FAILURE),
        map(action => action.payload.error),
        tap(error => {
          this.loadingService.setLoading(false);
          this.popNotificationsService.error(
            this.translateService.instant("The server responded with an error: " + error.statusText)
          );
        })
      ),
    {
      dispatch: false
    }
  );

  SaveImageRevision: Observable<SaveImageRevisionSuccess | SaveImageRevisionFailure> = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.SAVE_IMAGE_REVISION),
      tap(() => this.loadingService.setLoading(true)),
      mergeMap(action =>
        this.imageApiService.updateImageRevision(action.payload.revision).pipe(
          map(updatedRevision => new SaveImageRevisionSuccess({ revision: updatedRevision })),
          catchError(error => of(new SaveImageRevisionFailure({ revision: action.payload.revision, error })))
        )
      )
    )
  );

  SaveImageRevisionSuccess: Observable<SaveImageRevisionSuccess> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.SAVE_IMAGE_REVISION_SUCCESS),
        tap(() => this.loadingService.setLoading(false))
      ),
    {
      dispatch: false
    }
  );

  SaveImageRevisionFailure: Observable<SaveImageRevisionFailure> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.SAVE_IMAGE_REVISION_FAILURE),
        map(action => action.payload.error),
        tap(error => {
          this.loadingService.setLoading(false);
          this.popNotificationsService.error(
            this.translateService.instant("The server responded with an error: " + error.statusText)
          );
        })
      ),
    {
      dispatch: false
    }
  );

  PublishImage: Observable<PublishImageSuccess | PublishImageFailure> = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.PUBLISH_IMAGE),
      tap(() => this.loadingService.setLoading(true)),
      mergeMap(action =>
        this.imageApiService.publishImage(
          action.payload.pk,
          action.payload.skipNotifications,
          action.payload.skipActivityStream
        ).pipe(
          map(() => new PublishImageSuccess({ pk: action.payload.pk })),
          catchError(error => of(new PublishImageFailure({ pk: action.payload.pk, error })))
        )
      )
    )
  );

  PublishImageSuccess: Observable<PublishImageSuccess> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.PUBLISH_IMAGE_SUCCESS),
        tap(() => this.loadingService.setLoading(false))
      ),
    {
      dispatch: false
    }
  );

  PublishImageFailure: Observable<PublishImageFailure> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.PUBLISH_IMAGE_FAILURE),
        tap(error => {
          this.loadingService.setLoading(false);
        })
      ),
    {
      dispatch: false
    }
  );

  UnpublishImage: Observable<UnpublishImageSuccess | UnpublishImageFailure> = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.UNPUBLISH_IMAGE),
      tap(() => this.loadingService.setLoading(true)),
      mergeMap(action =>
        this.imageApiService.unpublishImage(action.payload.pk).pipe(
          map(() => new UnpublishImageSuccess({ pk: action.payload.pk })),
          catchError(error => of(new UnpublishImageFailure({ pk: action.payload.pk, error })))
        )
      )
    )
  );

  UnpublishImageSuccess: Observable<UnpublishImageSuccess> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.UNPUBLISH_IMAGE_SUCCESS),
        tap(() => this.loadingService.setLoading(false))
      ),
    {
      dispatch: false
    }
  );

  UnpublishImageFailure: Observable<UnpublishImageFailure> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.UNPUBLISH_IMAGE_FAILURE),
        tap(error => {
          this.loadingService.setLoading(false);
        })
      ),
    {
      dispatch: false
    }
  );

  MarkAsFinal: Observable<MarkAsFinalSuccess | MarkAsFinalFailure> = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.MARK_AS_FINAL),
      tap(() => this.loadingService.setLoading(true)),
      mergeMap(action =>
        this.imageApiService.markAsFinal(action.payload.pk, action.payload.revisionLabel).pipe(
          map(() => new MarkAsFinalSuccess(action.payload)),
          catchError(error => of(new MarkAsFinalFailure({ ...action.payload, error })))
        )
      )
    )
  );

  MarkAsFinalSuccess: Observable<MarkAsFinalSuccess> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.MARK_AS_FINAL_SUCCESS),
        tap(() => {
          this.loadingService.setLoading(false);
          this.popNotificationsService.success(
            this.translateService.instant("The revision has been marked as final.")
          );
        })
      ),
    {
      dispatch: false
    }
  );

  MarkAsFinalFailure: Observable<MarkAsFinalFailure> = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AppActionTypes.MARK_AS_FINAL_FAILURE),
        tap(error => {
          this.loadingService.setLoading(false);
        })
      ),
    {
      dispatch: false
    }
  );

  constructor(
    public readonly store$: Store<MainState>,
    public readonly actions$: Actions<All>,
    public readonly imageApiService: ImageApiService,
    public readonly loadingService: LoadingService,
    public readonly popNotificationsService: PopNotificationsService,
    public readonly translateService: TranslateService
  ) {
  }
}
