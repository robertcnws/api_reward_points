import React, { useState, useCallback, useMemo, useContext, createContext } from 'react';

import {
  useRewardPoints,
  RewardPointsProvider
} from './contexts/reward-points-context';
import {
  useRewardUserRoles,
  RewardUserRolesProvider
} from './contexts/reward-user-roles-context';
import {
  useRewardLoginUsers,
  RewardLoginUsersProvider
} from './contexts/reward-login-users-context';
import {
  useRewardPointsSettings,
  RewardPointsSettingsProvider
} from './contexts/reward-points-settings';
import {
  useRewardStoreProducts,
  RewardStoreProductsProvider
} from './contexts/reward-store-products-context';
import {
  useRewardExternalUsers,
  RewardExternalUsersProvider
} from './contexts/reward-external-users-context';
import {
  useRewardNotificationUsers,
  RewardNotificationUsersProvider
} from './contexts/reward-notification-users-context';
import {
  useRewardStoreProductSelectionBuy,
  RewardStoreProductSelectionBuyProvider
} from './contexts/reward-store-product-selection-buy-context';
import {
  useRewardStoreProductSelectionCart,
  RewardStoreProductSelectionCartProvider
} from './contexts/reward-store-product-selection-cart-context';

import {
  useRewardJoyRides,
  RewardJoyRidesProvider
} from './contexts/reward-joy-rides-context';

const DataContext = createContext();
export const useDataContext = () => useContext(DataContext);
export function DataProvider({ children }) {
  return (
    // <RewardItemsProvider>
    <RewardJoyRidesProvider>
      <RewardNotificationUsersProvider>
        <RewardStoreProductSelectionCartProvider>
          <RewardStoreProductSelectionBuyProvider>
            <RewardPointsSettingsProvider>
              <RewardUserRolesProvider>
                <RewardExternalUsersProvider>
                  <RewardLoginUsersProvider>
                    <RewardStoreProductsProvider>
                      <RewardPointsProvider>
                        <CombineProviders>{children}</CombineProviders>
                      </RewardPointsProvider>
                    </RewardStoreProductsProvider>
                  </RewardLoginUsersProvider>
                </RewardExternalUsersProvider>
              </RewardUserRolesProvider>
            </RewardPointsSettingsProvider>
          </RewardStoreProductSelectionBuyProvider>
        </RewardStoreProductSelectionCartProvider>
      </RewardNotificationUsersProvider>
    </RewardJoyRidesProvider>
    // </RewardItemsProvider>
  );
}

function CombineProviders({ children }) {
  const {
    loadedRewardPoints,
    refetchRewardPoints,
    loadingRewardPoints,
    errorRewardPoints,
    loadedRewardPointsHistory,
    refetchRewardPointsHistory,
    loadingRewardPointsHistory,
    errorRewardPointsHistory,
    loadedRewardPointsGainedHistory,
    refetchRewardPointsGainedHistory,
    loadingRewardPointsGainedHistory,
    errorRewardPointsGainedHistory,
    loadedRewardPointsSpentHistory,
    refetchRewardPointsSpentHistory,
    loadingRewardPointsSpentHistory,
    errorRewardPointsSpentHistory,
  } = useRewardPoints();

  const {
    loadedAllRewardStoreProducts: loadedStoreProducts,
    refetchAllRewardStoreProducts: refetchStoreProducts,
    loadingAllRewardStoreProducts: loadingStoreProducts,
    errorRewardStoreProducts: errorStoreProducts,
  } = useRewardStoreProducts();

  const {
    loadedAllRewardUserRoles: loadedUserRoles,
    refetchAllRewardUserRoles: refetchUserRoles,
    loadingAllRewardUserRoles: loadingUserRoles,
    errorRewardUserRoles: errorUserRoles,
  } = useRewardUserRoles();

  const {
    loadedNotifications,
    refetchNotifications,
    loadingNotifications,
    errorNotifications
  } = useRewardNotificationUsers();

  const {
    listAllRewardLoginUsers: loadedAllUsers,
    loadedAllRewardLoginUsers: loadedUsers,
    loadedPendingRewardLoginUsers: loadedPendingUsers,
    refetchAllRewardLoginUsers: refetchUsers,
    loadingAllRewardLoginUsers: loadingUsers,
    errorRewardLoginUsers: errorUsers,
  } = useRewardLoginUsers();

  const {
    loadedAllRewardPointsSettings: loadedPointsSettings,
    refetchAllRewardPointsSettings: refetchPointsSettings,
    loadingAllRewardPointsSettings: loadingPointsSettings,
    errorRewardPointsSettings: errorPointsSettings,
  } = useRewardPointsSettings();

  const {
    loadedAll: loadedStoreProductSelectionCarts,
    refetchAll: refetchStoreProductSelectionCarts,
    loadingAll: loadingStoreProductSelectionCarts,
    errorAll: errorStoreProductSelectionCarts,
  } = useRewardStoreProductSelectionCart();

  const {
    loadedAll: loadedStoreProductSelectionBuys,
    refetchAll: refetchStoreProductSelectionBuys,
    loadingAll: loadingStoreProductSelectionBuys,
    errorAll: errorStoreProductSelectionBuys,
  } = useRewardStoreProductSelectionBuy();

  const {
    externalUser,
    refetchExternalUser,
    loadingExternalUser,
    errorExternalUser,
  } = useRewardExternalUsers();

  const {
    loadedAllRewardJoyRides,
    refetchAllRewardJoyRides,
    loadingAllRewardJoyRides,
    errorAllRewardJoyRides,
  } = useRewardJoyRides();

  // const {
  //   loadedAllRewardItems,
  //   loadedFilteredRewardItems,
  //   refetchAllRewardItems,
  //   loadingAllRewardItems,
  //   errorRewardItems,
  // } = useRewardItems();

  // console.log('loadedAllRewardItems', loadedAllRewardItems);

  // Onboarding Vars

  const [runDashboard, setRunDashboard] = useState(false);
  const [runNavVertical, setRunNavVertical] = useState(false);
  const [runNavTop, setRunNavTop] = useState(false);

  const finishDashboard = useCallback(() => {
    setRunDashboard(false);
    setRunNavVertical(true);
  }, [setRunDashboard, setRunNavVertical]);

  const finishNavVertical = useCallback(() => {
    setRunNavVertical(false);
    setRunNavTop(true);
  }, [setRunNavVertical, setRunNavTop]);

  const finishNavTop = useCallback(() => {
    setRunNavTop(false);
  }, [setRunNavTop]);

  const value = useMemo(() => ({
    loadedRewardPoints,
    refetchRewardPoints,
    loadingRewardPoints,
    errorRewardPoints,
    loadedRewardPointsHistory,
    refetchRewardPointsHistory,
    loadingRewardPointsHistory,
    errorRewardPointsHistory,
    loadedStoreProducts,
    refetchStoreProducts,
    loadingStoreProducts,
    errorStoreProducts,
    loadedUserRoles,
    refetchUserRoles,
    loadingUserRoles,
    errorUserRoles,
    loadedNotifications,
    refetchNotifications,
    loadingNotifications,
    errorNotifications,
    loadedAllUsers,
    loadedUsers,
    loadedPendingUsers,
    refetchUsers,
    loadingUsers,
    errorUsers,
    loadedPointsSettings,
    refetchPointsSettings,
    loadingPointsSettings,
    errorPointsSettings,
    loadedStoreProductSelectionCarts,
    refetchStoreProductSelectionCarts,
    loadingStoreProductSelectionCarts,
    errorStoreProductSelectionCarts,
    loadedStoreProductSelectionBuys,
    refetchStoreProductSelectionBuys,
    loadingStoreProductSelectionBuys,
    errorStoreProductSelectionBuys,
    loadedRewardPointsGainedHistory,
    refetchRewardPointsGainedHistory,
    loadingRewardPointsGainedHistory,
    errorRewardPointsGainedHistory,
    loadedRewardPointsSpentHistory,
    refetchRewardPointsSpentHistory,
    loadingRewardPointsSpentHistory,
    errorRewardPointsSpentHistory,
    externalUser,
    refetchExternalUser,
    loadingExternalUser,
    errorExternalUser,
    loadedAllRewardJoyRides,
    refetchAllRewardJoyRides,
    loadingAllRewardJoyRides,
    errorAllRewardJoyRides,
    // loadedAllRewardItems,
    // loadedFilteredRewardItems,
    // refetchAllRewardItems,
    // loadingAllRewardItems,
    // errorRewardItems,
    runDashboard,
    setRunDashboard,
    finishDashboard,
    runNavVertical,
    setRunNavVertical,
    finishNavVertical,
    runNavTop,
    setRunNavTop,
    finishNavTop,
  }), [
    loadedRewardPoints,
    refetchRewardPoints,
    loadingRewardPoints,
    errorRewardPoints,
    loadedRewardPointsHistory,
    refetchRewardPointsHistory,
    loadingRewardPointsHistory,
    errorRewardPointsHistory,
    loadedStoreProducts,
    refetchStoreProducts,
    loadingStoreProducts,
    errorStoreProducts,
    loadedUserRoles,
    refetchUserRoles,
    loadingUserRoles,
    errorUserRoles,
    loadedNotifications,
    refetchNotifications,
    loadingNotifications,
    errorNotifications,
    loadedAllUsers,
    loadedUsers,
    loadedPendingUsers,
    refetchUsers,
    loadingUsers,
    errorUsers,
    loadedPointsSettings,
    refetchPointsSettings,
    loadingPointsSettings,
    errorPointsSettings,
    loadedStoreProductSelectionCarts,
    refetchStoreProductSelectionCarts,
    loadingStoreProductSelectionCarts,
    errorStoreProductSelectionCarts,
    loadedStoreProductSelectionBuys,
    refetchStoreProductSelectionBuys,
    loadingStoreProductSelectionBuys,
    errorStoreProductSelectionBuys,
    loadedRewardPointsGainedHistory,
    refetchRewardPointsGainedHistory,
    loadingRewardPointsGainedHistory,
    errorRewardPointsGainedHistory,
    loadedRewardPointsSpentHistory,
    refetchRewardPointsSpentHistory,
    loadingRewardPointsSpentHistory,
    errorRewardPointsSpentHistory,
    externalUser,
    refetchExternalUser,
    loadingExternalUser,
    errorExternalUser,
    loadedAllRewardJoyRides,
    refetchAllRewardJoyRides,
    loadingAllRewardJoyRides,
    errorAllRewardJoyRides,
    // loadedAllRewardItems,
    // loadedFilteredRewardItems,
    // refetchAllRewardItems,
    // loadingAllRewardItems,
    // errorRewardItems,
    runDashboard,
    setRunDashboard,
    finishDashboard,
    runNavVertical,
    setRunNavVertical,
    finishNavVertical,
    runNavTop,
    setRunNavTop,
    finishNavTop,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;

}