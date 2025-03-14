import { Injectable } from "@angular/core";
import { BaseService } from "@core/services/base.service";
import { LoadingService } from "@core/services/loading.service";
import { EquipmentItemServiceInterface } from "@features/equipment/services/equipment-item.service-interface";
import { SoftwareInterface } from "@features/equipment/types/software.interface";
import { TranslateService } from "@ngx-translate/core";
import { Observable } from "rxjs";
import { UtilsService } from "@core/services/utils/utils.service";

export enum SoftwareDisplayProperty {
  BRAND = "BRAND"
}

@Injectable({
  providedIn: "root"
})
export class SoftwareService extends BaseService implements EquipmentItemServiceInterface {
  constructor(
    public readonly loadingService: LoadingService,
    public readonly translateService: TranslateService,
    public readonly utilsService: UtilsService
  ) {
    super(loadingService);
  }

  getSupportedPrintableProperties(): string[] {
    return [SoftwareDisplayProperty.BRAND];
  }

  getPrintableProperty$(
    item: SoftwareInterface,
    property: SoftwareDisplayProperty,
    propertyValue?: any,
    shortForm?: boolean
  ): Observable<string | null> {
    throw Error(`Invalid property: ${property}`);
  }

  getPrintablePropertyName(propertyName: SoftwareDisplayProperty, shortForm = false): string {
    if (propertyName === SoftwareDisplayProperty.BRAND) {
      return (
        `${this.translateService.instant("Brand")} / ` +
        `${this.translateService.instant("Company")} / ` +
        this.translateService.instant("Developer(s)")
      );
    }
    throw Error(`Invalid property: ${propertyName}`);
  }
}
