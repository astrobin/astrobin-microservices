import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import {
  ApproveEquipmentItem,
  ApproveEquipmentItemSuccess,
  CreateBrand,
  CreateBrandSuccess,
  CreateCamera,
  CreateCameraSuccess,
  CreateSensor,
  CreateSensorSuccess,
  EquipmentActionTypes,
  FindAllBrands,
  FindAllBrandsSuccess,
  FindAllEquipmentItems,
  FindAllEquipmentItemsSuccess,
  FindSimilarInBrand,
  FindSimilarInBrandSuccess,
  GetOthersInBrand,
  GetOthersInBrandSuccess,
  LoadBrand,
  LoadBrandSuccess,
  LoadSensor,
  LoadSensorSuccess,
  RejectEquipmentItem,
  RejectEquipmentItemSuccess
} from "@features/equipment/store/equipment.actions";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { State } from "@app/store/state";
import { All } from "@app/store/actions/app.actions";
import { EquipmentApiService } from "@features/equipment/services/equipment-api.service";
import { filter, map, mergeMap } from "rxjs/operators";
import { selectBrand, selectEquipmentItem } from "@features/equipment/store/equipment.selectors";
import { SensorInterface } from "@features/equipment/interfaces/sensor.interface";
import { BrandInterface } from "@features/equipment/interfaces/brand.interface";
import { UtilsService } from "@shared/services/utils/utils.service";
import { EquipmentItemType } from "@features/equipment/interfaces/equipment-item-base.interface";
import { SelectorWithProps } from "@ngrx/store/src/models";

function getFromStoreOrApiByIdAndType<T>(
  store$: Store<State>,
  id: number,
  type: EquipmentItemType,
  selector: SelectorWithProps<any, { id: number; type: EquipmentItemType }, T>,
  apiCall: (number) => Observable<T>,
  apiContext: any
): Observable<T> {
  const fromApi: Observable<T> = apiCall.apply(apiContext, [id]);
  return store$
    .select(selector, { id, type })
    .pipe(mergeMap(fromStore => (fromStore !== null ? of(fromStore) : fromApi)));
}

@Injectable()
export class EquipmentEffects {
  LoadBrand: Observable<LoadBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.LOAD_BRAND),
      map((action: LoadBrand) => action.payload.id),
      mergeMap(id =>
        this.utilsService
          .getFromStoreOrApiById<BrandInterface>(
            this.store$,
            id,
            selectBrand,
            this.equipmentApiService.getBrand,
            this.equipmentApiService
          )
          .pipe(
            filter(brand => !!brand),
            map(brand => new LoadBrandSuccess({ brand }))
          )
      )
    )
  );

  CreateBrand: Observable<CreateBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_BRAND),
      map((action: CreateBrand) => action.payload.brand),
      mergeMap(brand =>
        this.equipmentApiService
          .createBrand(brand)
          .pipe(map(createdBrand => new CreateBrandSuccess({ brand: createdBrand })))
      )
    )
  );

  FindAllBrands: Observable<FindAllBrandsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_ALL_BRANDS),
      map((action: FindAllBrands) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService.findAllBrands(payload.q).pipe(map(brands => new FindAllBrandsSuccess({ brands })))
      )
    )
  );

  FindAllEquipmentItems: Observable<FindAllEquipmentItemsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_ALL_EQUIPMENT_ITEMS),
      map((action: FindAllEquipmentItems) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .findAllEquipmentItems(payload.q, payload.type)
          .pipe(map(items => new FindAllEquipmentItemsSuccess({ items })))
      )
    )
  );

  FindSimilarInBrand: Observable<FindSimilarInBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_SIMILAR_IN_BRAND),
      map((action: FindSimilarInBrand) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .findSimilarInBrand(payload.brand, payload.q, payload.type)
          .pipe(map(items => new FindSimilarInBrandSuccess({ items })))
      )
    )
  );

  GetOthersInBrand: Observable<GetOthersInBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_SIMILAR_IN_BRAND),
      map((action: GetOthersInBrand) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .getOthersInBrand(payload.brand, payload.type)
          .pipe(map(items => new GetOthersInBrandSuccess({ items })))
      )
    )
  );

  ApproveEquipmentItem: Observable<ApproveEquipmentItemSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.APPROVE_EQUIPMENT_ITEM),
      map((action: ApproveEquipmentItem) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .approveEquipmentItem(payload.item)
          .pipe(map(item => new ApproveEquipmentItemSuccess({ item })))
      )
    )
  );

  RejectEquipmentItem: Observable<RejectEquipmentItemSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.REJECT_EQUIPMENT_ITEM),
      map((action: RejectEquipmentItem) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .rejectEquipmentItem(payload.item, payload.comment)
          .pipe(map(item => new RejectEquipmentItemSuccess({ item })))
      )
    )
  );

  LoadSensor: Observable<LoadSensorSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.LOAD_SENSOR),
      map((action: LoadSensor) => action.payload.id),
      mergeMap(id =>
        getFromStoreOrApiByIdAndType<SensorInterface>(
          this.store$,
          id,
          EquipmentItemType.SENSOR,
          selectEquipmentItem,
          this.equipmentApiService.getSensor,
          this.equipmentApiService
        ).pipe(map(sensor => new LoadSensorSuccess({ item: sensor as SensorInterface })))
      )
    )
  );

  CreateSensor: Observable<CreateSensorSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_SENSOR),
      map((action: CreateSensor) => action.payload.sensor),
      mergeMap(sensor =>
        this.equipmentApiService
          .createSensor(sensor)
          .pipe(map(createdSensor => new CreateSensorSuccess({ item: createdSensor })))
      )
    )
  );

  CreateCamera: Observable<CreateCameraSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_CAMERA),
      map((action: CreateCamera) => action.payload.camera),
      mergeMap(camera =>
        this.equipmentApiService
          .createCamera(camera)
          .pipe(map(createdCamera => new CreateCameraSuccess({ item: createdCamera })))
      )
    )
  );

  constructor(
    public readonly store$: Store<State>,
    public readonly actions$: Actions<All>,
    public readonly equipmentApiService: EquipmentApiService,
    public readonly utilsService: UtilsService
  ) {}
}
