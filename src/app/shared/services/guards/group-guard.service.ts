import { Location } from "@angular/common";
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { State } from "@app/store/state";
import { selectCurrentUser } from "@features/account/store/auth.selectors";
import { Store } from "@ngrx/store";
import { UserInterface } from "@shared/interfaces/user.interface";
import { BaseService } from "@shared/services/base.service";
import { LoadingService } from "@shared/services/loading.service";
import { Observable, Observer } from "rxjs";
import { map } from "rxjs/operators";
import { AuthService } from "../auth.service";

@Injectable()
export class GroupGuardService extends BaseService implements CanActivate {
  constructor(
    public readonly store$: Store<State>,
    public loadingService: LoadingService,
    public authService: AuthService,
    public router: Router,
    public location: Location
  ) {
    super(loadingService);
  }

  canActivate(route: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): Observable<boolean> {
    const onSuccess = (observer: Observer<boolean>) => {
      observer.next(true);
      observer.complete();
    };

    const onError = (observer: Observer<boolean>, redirectTo: string) => {
      this.router.navigateByUrl(redirectTo, { skipLocationChange: true }).then(() => {
        observer.next(false);
        observer.complete();
        this.location.replaceState(routerState.url);
      });
    };

    return new Observable<boolean>(observer => {
      this.authService.isAuthenticated().subscribe(authenticated => {
        if (!authenticated) {
          observer.next(false);
          observer.complete();
          return;
        }

        this.store$
          .select(selectCurrentUser)
          .pipe(
            map((user: UserInterface) => {
              if (!user) {
                return false;
              }

              if (route.data.group) {
                return user.groups.filter(group => group.name === route.data.group).length > 0;
              }

              const intersection = user.groups
                .map(group => group.name)
                .filter(value => route.data.anyOfGroups.includes(value));

              if (route.data.anyOfGroups) {
                return intersection.length > 0;
              }

              if (route.data.allOfGroups) {
                return intersection.length === route.data.allOfGroups;
              }
            })
          )
          .subscribe(canActivate => {
            if (canActivate) {
              onSuccess(observer);
            } else {
              onError(observer, "/permission-denied");
            }
          });
      });
    });
  }
}
