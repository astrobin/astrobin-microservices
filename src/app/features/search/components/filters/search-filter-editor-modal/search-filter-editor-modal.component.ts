import { Component, Input } from "@angular/core";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { FormGroup } from "@angular/forms";
import { FormlyFieldConfig } from "@ngx-formly/core";

@Component({
  selector: "astrobin-search-filter-editor-modal",
  templateUrl: "./search-filter-editor-modal.component.html",
  styleUrls: ["./search-filter-editor-modal.component.scss"]
})
export class SearchFilterEditorModalComponent extends BaseComponentDirective {
  @Input()
  form: FormGroup;

  @Input()
  model: any;

  @Input()
  fields: FormlyFieldConfig[];

  constructor(
    public readonly store$: Store<MainState>,
    public readonly modal: NgbActiveModal
  ) {
    super(store$);
  }

  onSearch(event: Event) {
    event.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
    } else {
      this.modal.close(this.model);
    }
  }
}
