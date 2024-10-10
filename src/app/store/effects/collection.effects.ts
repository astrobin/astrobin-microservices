import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, mergeMap, tap } from "rxjs/operators";
import { CollectionApiService } from "@shared/services/api/classic/collections/collection-api.service";
import { DeleteCollection, DeleteCollectionFailure, DeleteCollectionSuccess, FindCollections, FindCollectionsFailure, FindCollectionsSuccess, LoadCollections, LoadCollectionsFailure, LoadCollectionsSuccess, UpdateCollection, UpdateCollectionFailure, UpdateCollectionSuccess } from "@app/store/actions/collection.actions";
import { AppActionTypes } from "@app/store/actions/app.actions";
import { LoadingService } from "@shared/services/loading.service";

@Injectable()
export class CollectionEffects {
  loadCollections$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.LOAD_COLLECTIONS),
      mergeMap((action: LoadCollections) =>
        this.collectionApiService.getAll(action.payload.params).pipe(
          tap(() => this.loadingService.setLoading(true)),
          map(collections => new LoadCollectionsSuccess({ params: action.payload.params, collections })),
          catchError(error => of(new LoadCollectionsFailure({ params: action.payload.params, error })))
        )
      )
    )
  );

  loadCollectionsSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.LOAD_COLLECTIONS_SUCCESS),
      tap(() => this.loadingService.setLoading(false))
    ),
    { dispatch: false }
  );

  loadCollectionsFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.LOAD_COLLECTIONS_FAILURE),
      tap(() => this.loadingService.setLoading(false))
    ),
    { dispatch: false }
  );

  findCollections$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.FIND_COLLECTIONS),
      mergeMap((action: FindCollections) =>
        this.collectionApiService.find(action.payload.params).pipe(
          tap(() => this.loadingService.setLoading(true)),
          map(response => new FindCollectionsSuccess({ params: action.payload.params, response })),
          catchError(error => of(new FindCollectionsFailure({ params: action.payload.params, error })))
        )
      )
    )
  );

  findCollectionsSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.FIND_COLLECTIONS_SUCCESS),
      tap(() => this.loadingService.setLoading(false))
    ),
    { dispatch: false }
  );

  findCollectionsFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.FIND_COLLECTIONS_FAILURE),
      tap(() => this.loadingService.setLoading(false))
    ),
    { dispatch: false }
  );

  updateCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.UPDATE_COLLECTION),
      mergeMap((action: UpdateCollection) => {
          this.loadingService.setLoading(true);
          return this.collectionApiService.update(action.payload.collection).pipe(
            map(collection => new UpdateCollectionSuccess({ collection })),
            catchError(error => of(new UpdateCollectionFailure({ collection: action.payload.collection, error })))
          );
        }
      )
    )
  );

  updateCollectionSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AppActionTypes.UPDATE_COLLECTION_SUCCESS),
        tap(() => this.loadingService.setLoading(false))
      ),
    { dispatch: false }
  );

  updateCollectionFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.UPDATE_COLLECTION_FAILURE),
      tap(() => this.loadingService.setLoading(false))
    ),
    { dispatch: false }
  );

  deleteCollection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.DELETE_COLLECTION),
      mergeMap((action: DeleteCollection) => {
          this.loadingService.setLoading(true);
          return this.collectionApiService.delete(action.payload.collectionId).pipe(
            map(() => new DeleteCollectionSuccess({ collectionId: action.payload.collectionId })),
            catchError(error => of(new DeleteCollectionFailure({ collectionId: action.payload.collectionId, error })))
          );
        }
      )
    )
  );

  deleteCollectionSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AppActionTypes.DELETE_COLLECTION_SUCCESS),
        tap(() => this.loadingService.setLoading(false))
      ),
    { dispatch: false }
  );

  deleteCollectionFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AppActionTypes.DELETE_COLLECTION_FAILURE),
      tap(() => this.loadingService.setLoading(false))
    ),
    { dispatch: false }
  );


  constructor(
    private actions$: Actions,
    private collectionApiService: CollectionApiService,
    public readonly loadingService: LoadingService
  ) {
  }
}
