import { FormControl, ValidationErrors } from "@angular/forms";
import { FormlyFieldConfig } from "@ngx-formly/core";
import { TranslateService } from "@ngx-translate/core";
import { FormlyFieldChunkedFileComponent } from "@shared/components/misc/formly-field-chunked-file/formly-field-chunked-file.component";
import { FormlyFieldImageCropperComponent } from "@shared/components/misc/formly-field-image-cropper/formly-field-image-cropper.component";
import { FormlyFieldNgSelectComponent } from "@shared/components/misc/formly-field-ng-select/formly-field-ng-select.component";
import { FormlyFieldStepperComponent } from "@shared/components/misc/formly-field-stepper/formly-field-stepper.component";

export interface FileSizeValidatorOptionsInterface {
  max: number;
}

function fileSizeValidator(
  control: FormControl,
  field: FormlyFieldConfig,
  options: FileSizeValidatorOptionsInterface
): ValidationErrors {
  let value;

  if (Array.isArray(control.value)) {
    value = control.value[0];
  } else {
    value = control.value;
  }
  return value?.size < options.max ? null : { "file-size": true };
}

export function formlyValidationConfig(translate: TranslateService) {
  return {
    types: [
      {
        name: "chunked-file",
        component: FormlyFieldChunkedFileComponent,
        wrappers: ["form-field"]
      },
      {
        name: "stepper",
        component: FormlyFieldStepperComponent,
        wrappers: []
      },
      {
        name: "ng-select",
        component: FormlyFieldNgSelectComponent,
        wrappers: ["form-field"]
      },
      {
        name: "image-cropper",
        component: FormlyFieldImageCropperComponent,
        wrappers: ["form-field"]
      }
    ],
    validators: [{ name: "file-size", validation: fileSizeValidator }],
    validationMessages: [
      {
        name: "required",
        message() {
          return translate.stream("This field is required");
        }
      }
    ]
  };
}
