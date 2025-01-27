import { Component, Input } from "@angular/core";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { LoadingService } from "@shared/services/loading.service";
import { Store } from "@ngrx/store";
import { MainState } from "@app/store/state";

@Component({
  selector: "astrobin-refresh-button",
  templateUrl: "./refresh-button.component.html",
  styleUrls: ["./refresh-button.component.scss"]
})
export class RefreshButtonComponent extends BaseComponentDirective {
  @Input() loading: boolean;

  constructor(public readonly store$: Store<MainState>, public readonly loadingService: LoadingService) {
    super(store$);
  }
}
