import React, { useMemo, useState, useContext, useCallback, createContext } from 'react';

import {
  useRewardPoints,
  RewardPointsProvider
} from './contexts/reward-points-context';
import {
  useRewardJoyRides,
  RewardJoyRidesProvider
} from './contexts/reward-joy-rides-context';
import {
  useRewardUserRoles,
  RewardUserRolesProvider
} from './contexts/reward-user-roles-context';
import {
  useRewardCustomerportalPermissions,
  RewardCustomerportalPermissionsProvider
} from './contexts/reward-customerportal-permissions-context';
import {
  useRewardLoginUsers,
  RewardLoginUsersProvider
} from './contexts/reward-login-users-context';
import {
  useRewardIntroSteps,
  RewardIntroStepsProvider
} from './contexts/reward-intro-steps-context';
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
  RewardClientsProvider,
  useRewardClients
} from './contexts/reward-clients-context';

import {
  useRewardItemgroups,
  RewardItemgroupsProvider
} from './contexts/reward-itemgroups-context';

const DataContext = createContext();
export const useDataContext = () => useContext(DataContext);
export function DataProvider({ children }) {
  return (
    // <RewardItemsProvider>
    <RewardIntroStepsProvider>
      <RewardJoyRidesProvider>
        <RewardNotificationUsersProvider>
          <RewardStoreProductSelectionCartProvider>
            <RewardStoreProductSelectionBuyProvider>
              <RewardPointsSettingsProvider>
                <RewardUserRolesProvider>
                  <RewardCustomerportalPermissionsProvider>
                    <RewardExternalUsersProvider>
                      <RewardLoginUsersProvider>
                        <RewardClientsProvider>
                          <RewardItemgroupsProvider>
                            <RewardStoreProductsProvider>
                              <RewardPointsProvider>
                                <CombineProviders>{children}</CombineProviders>
                              </RewardPointsProvider>
                            </RewardStoreProductsProvider>
                          </RewardItemgroupsProvider>
                        </RewardClientsProvider>
                      </RewardLoginUsersProvider>
                    </RewardExternalUsersProvider>
                  </RewardCustomerportalPermissionsProvider>
                </RewardUserRolesProvider>
              </RewardPointsSettingsProvider>
            </RewardStoreProductSelectionBuyProvider>
          </RewardStoreProductSelectionCartProvider>
        </RewardNotificationUsersProvider>
      </RewardJoyRidesProvider>
    </RewardIntroStepsProvider>
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
    loadedAllRewardCustomerportalPermissions: loadedCustomerportalPermissions,
    refetchAllRewardCustomerportalPermissions: refetchCustomerportalPermissions,
    loadingAllRewardCustomerportalPermissions: loadingCustomerportalPermissions,
    errorRewardCustomerportalPermissions: errorCustomerportalPermissions,
  } = useRewardCustomerportalPermissions();

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
    loadedAllRewardOfficeStaffUsers: loadedOfficeStaffUsers,
    refetchAllRewardLoginUsers: refetchUsers,
    loadingAllRewardLoginUsers: loadingUsers,
    errorRewardLoginUsers: errorUsers,
    userByUsername,
    refetchUserByUsername,
    loadingUserByUsername,
    errorUserByUsername,
  } = useRewardLoginUsers();

  const {
    loadedAllRewardClients: loadedClients,
    loadedPendingRewardClients: loadedPendingClients,
    refetchAllRewardClients: refetchClients,
    loadingAllRewardClients: loadingClients,
    errorRewardClients: errorClients,
  } = useRewardClients();

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

  const {
    loadedAllRewardIntroSteps,
    refetchAllRewardIntroSteps,
    loadingAllRewardIntroSteps,
    errorAllRewardIntroSteps,
  } = useRewardIntroSteps();

  const {
    loadedAllRewardItemgroups: loadedItemgroups,
    refetchAllRewardItemgroups: refetchItemgroups,
    loadingAllRewardItemgroups: loadingItemgroups,
    errorRewardItemgroups: errorItemgroups,
  } = useRewardItemgroups();

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
    loadedOfficeStaffUsers,
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
    loadedAllRewardIntroSteps,
    refetchAllRewardIntroSteps,
    loadingAllRewardIntroSteps,
    errorAllRewardIntroSteps,
    userByUsername,
    refetchUserByUsername,
    loadingUserByUsername,
    errorUserByUsername,
    // loadedAllRewardItems,
    // loadedFilteredRewardItems,
    // refetchAllRewardItems,
    // loadingAllRewardItems,
    // errorRewardItems,
    loadedClients,
    loadedPendingClients,
    refetchClients,
    loadingClients,
    errorClients,
    loadedCustomerportalPermissions,
    refetchCustomerportalPermissions,
    loadingCustomerportalPermissions,
    errorCustomerportalPermissions,
    loadedItemgroups,
    refetchItemgroups,
    loadingItemgroups,
    errorItemgroups,
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
    loadedOfficeStaffUsers,
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
    loadedAllRewardIntroSteps,
    refetchAllRewardIntroSteps,
    loadingAllRewardIntroSteps,
    errorAllRewardIntroSteps,
    userByUsername,
    refetchUserByUsername,
    loadingUserByUsername,
    errorUserByUsername,
    // loadedAllRewardItems,
    // loadedFilteredRewardItems,
    // refetchAllRewardItems,
    // loadingAllRewardItems,
    // errorRewardItems,
    loadedClients,
    loadedPendingClients,
    refetchClients,
    loadingClients,
    errorClients,
    loadedCustomerportalPermissions,
    refetchCustomerportalPermissions,
    loadingCustomerportalPermissions,
    errorCustomerportalPermissions,
    loadedItemgroups,
    refetchItemgroups,
    loadingItemgroups,
    errorItemgroups,
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