import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedModule } from "@shared/shared.module";
import { StoreModule } from "@ngrx/store";
import { equipmentFeatureKey, equipmentReducer } from "@features/equipment/store/equipment.reducer";
import { equipmentRoutes } from "@features/equipment/equipment.routing";
import { MigrationToolComponent } from "./pages/migration/migration-tool/migration-tool.component";
import { MigrationReviewComponent } from "./pages/migration/migration-review/migration-review.component";
import { MigrationReviewItemComponent } from "./pages/migration/migration-review-item/migration-review-item.component";
import { RejectMigrationModalComponent } from "./components/migration/reject-migration-modal/reject-migration-modal.component";
import { MigrationExplorerComponent } from "./pages/migration/migration-explorer/migration-explorer.component";
import { ItemTypeNavComponent } from "./components/item-type-nav/item-type-nav.component";
import { MigrationNavComponent } from "@features/equipment/components/migration/migration-nav/migration-nav.component";
import { MigrationGuidelinesComponent } from "./components/migration/migration-guidelines/migration-guidelines.component";
import { ExplorerPageComponent } from "./pages/explorer/explorer-page.component";
import { ItemEditProposalComponent } from "./components/item-edit-proposal/item-edit-proposal.component";
import { PendingEditExplorerComponent } from "@features/equipment/pages/pending-edit-explorer/pending-edit-explorer.component";
import { PendingReviewExplorerComponent } from "@features/equipment/pages/pending-review-explorer/pending-review-explorer.component";
import { RejectItemModalComponent } from "./components/reject-item-modal/reject-item-modal.component";
import { ApproveItemModalComponent } from "@features/equipment/components/approve-item-modal/approve-item-modal.component";
import { RejectEditProposalModalComponent } from "@features/equipment/components/reject-edit-proposal-modal/reject-edit-proposal-modal.component";
import { ApproveEditProposalModalComponent } from "@features/equipment/components/approve-edit-proposal-modal/approve-edit-proposal-modal.component";
import { ExplorerComponent } from "@features/equipment/components/explorer/explorer.component";
import { MergeIntoModalComponent } from "./components/migration/merge-into-modal/merge-into-modal.component";
import { ReviewGearRenamingProposalsComponent } from "./pages/review-gear-renaming-proposals/review-gear-renaming-proposals.component";
import { RejectReviewGearRenamingProposalsModalComponent } from "@features/equipment/components/reject-review-gear-renaming-proposals-modal/reject-review-gear-renaming-proposals-modal.component";
import { PendingExplorerBaseComponent } from "@features/equipment/pages/explorer-base/pending-explorer-base.component";
import { ExplorerBaseComponent } from "@features/equipment/pages/explorer-base/explorer-base.component";
import { ExplorerFiltersComponent } from "./pages/explorer/explorer-filters/explorer-filters.component";
import { BrandExplorerPageComponent } from "./pages/explorer/brand-explorer-page/brand-explorer-page.component";
import { UnapproveItemModalComponent } from "@features/equipment/components/unapprove-item-modal/unapprove-item-modal.component";
import { ContributorsPageComponent } from "./pages/contributors-page/contributors-page.component";
import { EquipmentCompareComponent } from "./components/equipment-compare/equipment-compare.component";
import { EquipmentCompareModalComponent } from "./components/equipment-compare-modal/equipment-compare-modal.component";
import { EquipmentListingsComponent } from "./components/equipment-listings/equipment-listings.component";
import { FollowedExplorerComponent } from "@features/equipment/pages/followed-explorer/followed-explorer.component";
import { MarketplaceListingsPageComponent } from "./pages/marketplace/listings/marketplace-listings-page.component";
import { MarketplaceCreateListingPageComponent } from "./pages/marketplace/create-listing/marketplace-create-listing-page.component";
import { MarketplaceLineItemComponent } from "./components/marketplace-listing-line-item/marketplace-line-item.component";
import { MarketplaceListingComponent } from "./components/marketplace-listing/marketplace-listing.component";
import { MarketplaceListingLineItemPriceComponent } from "./components/marketplace-listing-line-item-price/marketplace-listing-line-item-price.component";
import { MarketplaceLineItemConditionComponent } from "./components/marketplace-listing-line-item-condition/marketplace-line-item-condition.component";
import { MarketplaceImagesComponent } from "./components/marketplace-listing-line-item-images/marketplace-images.component";
import { MarketplaceListingPageComponent } from "./pages/marketplace/listing/marketplace-listing.page.component";
import { MarketplaceUserCardComponent } from "./components/marketplace-user-card/marketplace-user-card.component";
import { MarketplaceFeedbackWidgetComponent } from "./components/marketplace-feedback-widget/marketplace-feedback-widget.component";
import { MarketplaceListingFormComponent } from "./components/marketplace-listing-form/marketplace-listing-form.component";
import { MarketplaceEditListingPageComponent } from "@features/equipment/pages/marketplace/edit-listing/marketplace-edit-listing-page.component";
import { MarketplaceNavComponent } from "./components/marketplace-nav/marketplace-nav.component";
import { MarketplaceSidebarComponent } from "./components/marketplace-sidebar/marketplace-sidebar.component";
import { MarketplaceUserListingsPageComponent } from "./pages/marketplace/user-listings/marketplace-user-listings-page.component";
import { MarketplaceFilterComponent } from "./components/marketplace-filter/marketplace-filter.component";
import { MarketplaceMoreFromUserComponent } from "./components/marketplace-more-from-user/marketplace-more-from-user.component";
import { MarketplaceSearchBarComponent } from "./components/marketplace-search-bar/marketplace-search-bar.component";
import { MarketplaceOfferModalComponent } from "./components/marketplace-offer-modal/marketplace-offer-modal.component";
import { MarketplaceUserOffersPageComponent } from "@features/equipment/pages/marketplace/user-offers/marketplace-user-offers-page.component";
import { MarketplaceSoldListingsPageComponent } from "@features/equipment/pages/marketplace/sold-listings/marketplace-sold-listings-page.component";
import { MarketplaceUserSoldListingsPageComponent } from "@features/equipment/pages/marketplace/user-sold-listings/marketplace-user-sold-listings-page.component";
import { MarketplaceUserExpiredListingsPageComponent } from "@features/equipment/pages/marketplace/user-expired-listings/marketplace-user-expired-listings-page.component";
import { MarketplaceUserPurchasesPageComponent } from "@features/equipment/pages/marketplace/user-purchases/marketplace-user-purchases-page.component";
import { MarketplaceUserFollowedListingsPageComponent } from "@features/equipment/pages/marketplace/user-followed-listings/marketplace-user-followed-listings-page.component";
import { MarketplaceFeedbackModalComponent } from "./components/marketplace-feedback-modal/marketplace-feedback-modal.component";
import { MarketplacePendingModerationListingsPageComponent } from "@features/equipment/pages/marketplace/pending-moderation-listings/marketplace-pending-moderation-listings-page.component";
import { MarketplaceMarkLineItemsAsSoldModalComponent } from "@features/equipment/components/marketplace-mark-line-items-as-sold-modal/marketplace-mark-line-items-as-sold-modal.component";
import { MarketplaceOfferSummaryComponent } from "./components/marketplace-offer-summary/marketplace-offer-summary.component";
import { MarketplaceUserFeedbackListPageComponent } from "./pages/marketplace/user-feedback-list/marketplace-user-feedback-list-page.component";
import { MarketplaceUserFeedbackPageComponent } from "./pages/marketplace/marketplace-user-feedback/marketplace-user-feedback-page.component";
import { MarketplaceFeedbackComponent } from "./components/marketplace-feedback/marketplace-feedback.component";
import { MarketplaceAcceptRejectRetractOfferModalComponent } from "./components/marketplace-accept-reject-retract-offer-modal/marketplace-accept-reject-retract-offer-modal.component";

@NgModule({
  declarations: [
    MigrationToolComponent,
    MigrationReviewComponent,
    MigrationReviewItemComponent,
    RejectMigrationModalComponent,
    MigrationExplorerComponent,
    ItemTypeNavComponent,
    MigrationNavComponent,
    MigrationGuidelinesComponent,
    ItemEditProposalComponent,
    PendingExplorerBaseComponent,
    ExplorerBaseComponent,
    ExplorerPageComponent,
    ExplorerComponent,
    PendingReviewExplorerComponent,
    FollowedExplorerComponent,
    PendingEditExplorerComponent,
    ApproveItemModalComponent,
    UnapproveItemModalComponent,
    RejectItemModalComponent,
    ApproveEditProposalModalComponent,
    RejectEditProposalModalComponent,
    MergeIntoModalComponent,
    ReviewGearRenamingProposalsComponent,
    RejectReviewGearRenamingProposalsModalComponent,
    ExplorerFiltersComponent,
    BrandExplorerPageComponent,
    ContributorsPageComponent,
    EquipmentCompareComponent,
    EquipmentCompareModalComponent,
    EquipmentListingsComponent,
    MarketplaceListingsPageComponent,
    MarketplacePendingModerationListingsPageComponent,
    MarketplaceSoldListingsPageComponent,
    MarketplaceCreateListingPageComponent,
    MarketplaceLineItemComponent,
    MarketplaceListingComponent,
    MarketplaceListingLineItemPriceComponent,
    MarketplaceLineItemConditionComponent,
    MarketplaceImagesComponent,
    MarketplaceListingPageComponent,
    MarketplaceUserCardComponent,
    MarketplaceFeedbackWidgetComponent,
    MarketplaceListingFormComponent,
    MarketplaceEditListingPageComponent,
    MarketplaceNavComponent,
    MarketplaceSidebarComponent,
    MarketplaceUserListingsPageComponent,
    MarketplaceUserSoldListingsPageComponent,
    MarketplaceUserExpiredListingsPageComponent,
    MarketplaceUserOffersPageComponent,
    MarketplaceUserPurchasesPageComponent,
    MarketplaceUserFollowedListingsPageComponent,
    MarketplaceFilterComponent,
    MarketplaceMoreFromUserComponent,
    MarketplaceSearchBarComponent,
    MarketplaceOfferModalComponent,
    MarketplaceFeedbackModalComponent,
    MarketplaceMarkLineItemsAsSoldModalComponent,
    MarketplaceOfferSummaryComponent,
    MarketplaceUserFeedbackListPageComponent,
    MarketplaceUserFeedbackPageComponent,
    MarketplaceFeedbackComponent,
    MarketplaceAcceptRejectRetractOfferModalComponent
  ],
  imports: [
    RouterModule.forChild(equipmentRoutes),
    SharedModule,
    StoreModule.forFeature(equipmentFeatureKey, equipmentReducer)
  ]
})
export class EquipmentModule {
}
