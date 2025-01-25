import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { BaseComponentDirective } from "@shared/components/base-component.directive";

@Component({
  selector: "astrobin-loading-indicator",
  templateUrl: "./loading-indicator.component.html",
  styleUrls: ["./loading-indicator.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingIndicatorComponent extends BaseComponentDirective {
  @Input()
  progress: number;

  @Input()
  message: string;
}
