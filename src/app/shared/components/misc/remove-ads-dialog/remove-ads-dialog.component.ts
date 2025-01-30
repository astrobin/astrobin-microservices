import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { LoadingService } from "@core/services/loading.service";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { ClassicRoutesService } from "@core/services/classic-routes.service";

@Component({
  selector: "astrobin-remove-ads-dialog",
  templateUrl: "./remove-ads-dialog.component.html",
  styleUrls: ["./remove-ads-dialog.component.scss"]
})
export class RemoveAdsDialogComponent extends BaseComponentDirective {
  constructor(
    public readonly store$: Store<MainState>,
    public readonly modal: NgbActiveModal,
    public readonly loadingService: LoadingService,
    public readonly classicRoutesService: ClassicRoutesService
  ) {
    super(store$);
  }
}
