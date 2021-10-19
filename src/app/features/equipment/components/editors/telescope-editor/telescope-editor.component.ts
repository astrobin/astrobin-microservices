import { AfterViewInit, Component, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Actions } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { BaseItemEditorComponent } from "@features/equipment/components/editors/base-item-editor/base-item-editor.component";
import { LoadingService } from "@shared/services/loading.service";
import { WindowRefService } from "@shared/services/window-ref.service";
import { State } from "@app/store/state";
import { EquipmentApiService } from "@features/equipment/services/equipment-api.service";
import { EquipmentItemService } from "@features/equipment/services/equipment-item.service";
import { FormlyFieldService } from "@shared/services/formly-field.service";
import { TelescopeDisplayProperty, TelescopeService } from "@features/equipment/services/telescope.service";
import { TelescopeInterface, TelescopeType } from "@features/equipment/types/telescope.interface";
import { FormlyFieldConfig } from "@ngx-formly/core";
import { takeUntil } from "rxjs/operators";
import { AbstractControl } from "@angular/forms";

@Component({
  selector: "astrobin-telescope-editor",
  templateUrl: "./telescope-editor.component.html",
  styleUrls: ["./telescope-editor.component.scss", "../base-item-editor/base-item-editor.component.scss"]
})
export class TelescopeEditorComponent extends BaseItemEditorComponent<TelescopeInterface, null>
  implements OnInit, AfterViewInit {
  constructor(
    public readonly store$: Store<State>,
    public readonly actions$: Actions,
    public readonly loadingService: LoadingService,
    public readonly translateService: TranslateService,
    public readonly windowRefService: WindowRefService,
    public readonly equipmentApiService: EquipmentApiService,
    public readonly equipmentItemService: EquipmentItemService,
    public readonly formlyFieldService: FormlyFieldService,
    public readonly telescopeService: TelescopeService
  ) {
    super(
      store$,
      actions$,
      loadingService,
      translateService,
      windowRefService,
      equipmentApiService,
      equipmentItemService,
      formlyFieldService
    );
  }

  ngOnInit() {
    if (!this.returnToSelector) {
      this.returnToSelector = "#telescope-editor-form";
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this._initFields();
    }, 1);

    super.ngAfterViewInit();
  }

  private _initFields() {
    this.fields = [
      this._getBrandField(),
      this._getNameField(),
      {
        key: "type",
        type: "ng-select",
        id: "telescope-field-type",
        expressionProperties: {
          "templateOptions.disabled": () => this.subCreation.inProgress || this.brandCreation.inProgress
        },
        templateOptions: {
          label: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.TYPE),
          required: true,
          clearable: true,
          options: Object.keys(TelescopeType).map(telescopeType => ({
            value: TelescopeType[telescopeType],
            label: this.telescopeService.humanizeType(TelescopeType[telescopeType])
          }))
        }
      },
      {
        key: "aperture",
        type: "input",
        wrappers: ["default-wrapper"],
        id: "telescope-field-aperture",
        hideExpression: () => this.model.type === TelescopeType.CAMERA_LENS,
        expressionProperties: {
          "templateOptions.disabled": () => this.subCreation.inProgress || this.brandCreation.inProgress
        },
        templateOptions: {
          type: "number",
          min: 0,
          max: 10000,
          step: 0.1,
          label: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.APERTURE)
        }
      },
      {
        key: "fixedFocalLength",
        type: "checkbox",
        wrappers: ["default-wrapper"],
        id: "telescope-field-fixed-focal-length",
        defaultValue: this.model.minFocalLength === this.model.maxFocalLength,
        expressionProperties: {
          "templateOptions.disabled": () => this.subCreation.inProgress || this.brandCreation.inProgress
        },
        templateOptions: {
          label: this.translateService.instant("Fixed focal length")
        }
      },
      {
        key: "focalLength",
        type: "input",
        wrappers: ["default-wrapper"],
        id: "telescope-field-focal-length",
        defaultValue: this.model.minFocalLength === this.model.maxFocalLength ? this.model.minFocalLength : null,
        hideExpression: () => !this.form.get("fixedFocalLength").value,
        expressionProperties: {
          "templateOptions.disabled": () => this.subCreation.inProgress || this.brandCreation.inProgress
        },
        templateOptions: {
          type: "number",
          min: 0,
          max: 10000,
          step: 0.1,
          label: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.FOCAL_LENGTH)
        },
        hooks: {
          onInit: (field: FormlyFieldConfig) => {
            field.formControl.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
              this.model.minFocalLength = value;
              this.model.maxFocalLength = value;
            });
          }
        }
      },
      {
        fieldGroupClassName: "row",
        fieldGroup: [
          {
            className: "col-12 col-lg-6",
            key: "minFocalLength",
            type: "input",
            wrappers: ["default-wrapper"],
            id: "telescope-field-min-focal-length",
            defaultValue: this.model.minFocalLength,
            hideExpression: () => !!this.form.get("fixedFocalLength").value,
            expressionProperties: {
              "templateOptions.disabled": () => this.subCreation.inProgress || this.brandCreation.inProgress,
              "templateOptions.required": model => !model.fixedFocalLength
            },
            templateOptions: {
              type: "number",
              min: 0,
              max: 10000,
              step: 0.1,
              label: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.MIN_FOCAL_LENGTH)
            },
            validators: {
              maxGreaterEqualThanMin: {
                expression: (control: AbstractControl) => {
                  return control.value <= this.model.maxFocalLength;
                },
                message: this.translateService.instant(`"{{0}}" must be smaller than "{{1}}".`, {
                  0: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.MIN_FOCAL_LENGTH),
                  1: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.MAX_FOCAL_LENGTH)
                })
              }
            },
            hooks: {
              onInit: (field: FormlyFieldConfig) => {
                field.formControl.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
                  this.form.get("maxFocalLength")?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
                });
              }
            }
          },
          {
            className: "col-12 col-lg-6",
            key: "maxFocalLength",
            type: "input",
            wrappers: ["default-wrapper"],
            id: "telescope-field-max-focal-length",
            defaultValue: this.model.maxFocalLength,
            hideExpression: () => !!this.form.get("fixedFocalLength").value,
            expressionProperties: {
              "templateOptions.disabled": () => this.subCreation.inProgress || this.brandCreation.inProgress,
              "templateOptions.required": model => !model.fixedFocalLength
            },
            templateOptions: {
              type: "number",
              min: 0,
              max: 10000,
              step: 0.1,
              label: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.MAX_FOCAL_LENGTH)
            },
            validators: {
              maxGreaterEqualThanMin: {
                expression: (control: AbstractControl) => {
                  return control.value > this.model.minFocalLength;
                },
                message: this.translateService.instant(`"{{0}}" must be smaller than "{{1}}".`, {
                  0: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.MIN_FOCAL_LENGTH),
                  1: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.MAX_FOCAL_LENGTH)
                })
              }
            },
            hooks: {
              onInit: (field: FormlyFieldConfig) => {
                field.formControl.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
                  this.form.get("minFocalLength")?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
                });
              }
            }
          }
        ]
      },
      {
        key: "weight",
        type: "input",
        wrappers: ["default-wrapper"],
        id: "telescope-field-weight",
        expressionProperties: {
          "templateOptions.disabled": () => this.subCreation.inProgress || this.brandCreation.inProgress
        },
        templateOptions: {
          type: "number",
          min: 0,
          max: 10000,
          step: 0.1,
          label: this.telescopeService.getPrintablePropertyName(TelescopeDisplayProperty.WEIGHT)
        }
      },
      this._getImageField()
    ];

    this._addBaseItemEditorFields();
  }
}
