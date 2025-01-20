import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { MainState } from "@app/store/state";
import { Store } from "@ngrx/store";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { Actions, ofType } from "@ngrx/effects";
import { WindowRefService } from "@shared/services/window-ref.service";
import { TitleService } from "@shared/services/title/title.service";
import { TranslateService } from "@ngx-translate/core";
import { UserInterface } from "@shared/interfaces/user.interface";
import { DefaultGallerySortingOption, UserProfileInterface } from "@shared/interfaces/user-profile.interface";
import { filter, map, take, takeUntil } from "rxjs/operators";
import { ImageViewerService } from "@shared/services/image-viewer.service";
import { FindCollections, FindCollectionsSuccess } from "@app/store/actions/collection.actions";
import { AppActionTypes } from "@app/store/actions/app.actions";
import { selectCurrentUser, selectCurrentUserProfile, selectUser, selectUserProfile } from "@features/account/store/auth.selectors";
import { UserSubscriptionService } from "@shared/services/user-subscription/user-subscription.service";
import { ImageService } from "@shared/services/image/image.service";

@Component({
  selector: "astrobin-user-gallery-page",
  template: `
    <div
      *ngIf="currentUserWrapper$ | async as currentUserWrapper"
      class="page has-infinite-scroll"
    >
      <astrobin-ad-manager #ad *ngIf="showAd" configName="wide"></astrobin-ad-manager>

      <astrobin-user-gallery-header
        [user]="user"
        [userProfile]="userProfile"
      ></astrobin-user-gallery-header>

      <p
        *ngIf="currentUserWrapper.userProfile?.shadowBans?.includes(userProfile.id)"
        class="alert alert-warning shadow-ban-alert"
      >
        {{ "You shadow-banned this user. They won't be able to contact you." | translate }}
      </p>

      <astrobin-user-gallery-navigation
        [user]="user"
        [userProfile]="userProfile"
      ></astrobin-user-gallery-navigation>
    </div>
  `,
  styleUrls: ["./user-gallery-page.component.scss"]
})
export class UserGalleryPageComponent extends BaseComponentDirective implements OnInit {
  protected user: UserInterface;
  protected userProfile: UserProfileInterface;
  protected showAd: boolean;

  constructor(
    public readonly store$: Store<MainState>,
    public readonly actions$: Actions,
    public readonly route: ActivatedRoute,
    public readonly windowRefService: WindowRefService,
    public readonly titleService: TitleService,
    public readonly translateService: TranslateService,
    public readonly router: Router,
    public readonly imageViewerService: ImageViewerService,
    public readonly activatedRoute: ActivatedRoute,
    public readonly viewContainerRef: ViewContainerRef,
    public readonly userSubscriptionService: UserSubscriptionService,
    public readonly imageService: ImageService
  ) {
    super(store$);

    router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      if (!this.imageViewerService.slideshow) {
        this.imageViewerService.autoOpenSlideshow(this.componentId, this.activatedRoute, this.viewContainerRef);
      } else {
        this.imageViewerService.closeSlideShow(false);
      }
    });
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.actions$.pipe(
      ofType(AppActionTypes.FIND_COLLECTIONS_SUCCESS),
      map((action: FindCollectionsSuccess) => action.payload.response),
      takeUntil(this.destroyed$)
    ).subscribe(response => {
      if (response.next) {
        const page = response.next.match(/page=(\d+)/)[1];
        if (page) {
          this.store$.dispatch(new FindCollections({ params: { user: this.user.id, page: +page } }));
        }
      }
    });

    this.route.data.pipe(takeUntil(this.destroyed$)).subscribe((data: {
      userData: {
        user: UserInterface, userProfile: UserProfileInterface
      }
    }) => {
      this.user = data.userData.user;
      this.userProfile = data.userData.userProfile;

      this.userSubscriptionService.displayAds$().pipe(
        filter(showAd => typeof showAd !== "undefined"),
        take(1)
      ).subscribe(showAd => {
        // showAd = if the viewer gets ads.
        // this.userProfile.allowAds = if the user allows ads to be shown on their profile.
        this.showAd = showAd && this.userProfile.allowAds;
      });

      if (!this.activatedRoute.snapshot.fragment) {
        switch (this.userProfile.defaultGallerySorting) {
          case DefaultGallerySortingOption.PUBLICATION:
            this.router.navigate([], {
              fragment: "gallery",
              replaceUrl: true,
              queryParamsHandling: "merge"
            });
            break;
          case DefaultGallerySortingOption.SUBJECT_TYPE:
            this.router.navigate([], {
              queryParams: { "folder-type": "subject" },
              fragment: "smart-folders",
              replaceUrl: true,
              queryParamsHandling: "merge"
            });
            break;
          case DefaultGallerySortingOption.YEAR:
            this.router.navigate([], {
              queryParams: { "folder-type": "year" },
              fragment: "smart-folders",
              replaceUrl: true,
              queryParamsHandling: "merge"
            });
            break;
          case DefaultGallerySortingOption.GEAR:
            this.router.navigate([], {
              queryParams: { "folder-type": "gear" },
              fragment: "smart-folders",
              replaceUrl: true,
              queryParamsHandling: "merge"
            });
            break;
          case DefaultGallerySortingOption.CONSTELLATION:
            this.router.navigate([], {
              queryParams: { "folder-type": "constellation" },
              fragment: "smart-folders",
              replaceUrl: true,
              queryParamsHandling: "merge"
            });
            break;
        }
      }

      this._setMetaTags();
      this.windowRefService.scroll({ top: 0, behavior: "auto" });
      this._listenToUserChanges();
      this.store$.dispatch(new FindCollections({ params: { user: this.user.id } }));
    });
  }

  private _listenToUserChanges() {
    this.store$
      .select(selectCurrentUserProfile)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(userProfile => {
        if (userProfile?.id === this.userProfile.id) {
          this.userProfile = { ...userProfile };
        }
      });

    this.store$
      .select(selectCurrentUser)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        if (user?.id === this.user.id) {
          this.user = { ...user };
        }
      });

    this.store$
      .select(selectUserProfile, this.userProfile.id)
      .pipe(
        filter(userProfile => !!userProfile),
        takeUntil(this.destroyed$)
      )
      .subscribe(userProfile => {
        if (userProfile) {
          this.userProfile = { ...userProfile };
        }
      });

    this.store$
      .select(selectUser, this.user.id)
      .pipe(
        filter(user => !!user),
        takeUntil(this.destroyed$)
      )
      .subscribe(user => {
        if (user) {
          this.user = { ...user };
        }
      });
  }

  private _setMetaTags() {
    if (this.route.snapshot.data.image) {
      this.imageService.setMetaTags(this.route.snapshot.data.image);
    } else {
      const title = this.user.displayName;
      const description = this.translateService.instant("A gallery on AstroBin.");

      this.titleService.setTitle(title);
      this.titleService.setDescription(description);
      this.titleService.addMetaTag({ name: "og:title", content: title });
      this.titleService.addMetaTag({ name: "og:description", content: description });

      if (this.user.avatar) {
        this.titleService.addMetaTag({ name: "og:gallery", content: this.user.avatar });
      }
    }
  }
}
