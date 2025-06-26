import React, { useMemo, useContext, createContext } from 'react';

import { useAllRewardStoreProducts } from 'src/_mock/__reward-store-products';

import { fieldsRewardStoreProducts } from '../field-descriptors/field-descriptors-reward-store-products';

const RewardStoreProductsContext = createContext();
export const useRewardStoreProducts = () => useContext(RewardStoreProductsContext);

export function RewardStoreProductsProvider({ children }) {

  const fields = useMemo(() => fieldsRewardStoreProducts, []);

  const allStoreProductsQuery = useAllRewardStoreProducts(fields);

  const loadedAllRewardStoreProducts = allStoreProductsQuery.data;

  const refetchAllRewardStoreProducts = allStoreProductsQuery.refetch;

  const loadingAllRewardStoreProducts = allStoreProductsQuery.loading || false;

  const errorRewardStoreProducts = allStoreProductsQuery.error || null;

  const value = useMemo(
    () => ({
      loadedAllRewardStoreProducts,
      refetchAllRewardStoreProducts,
      loadingAllRewardStoreProducts,
      errorRewardStoreProducts,
    }),
    [
      loadedAllRewardStoreProducts,
      refetchAllRewardStoreProducts,
      loadingAllRewardStoreProducts,
      errorRewardStoreProducts,
    ]
  );

  return (
    <RewardStoreProductsContext.Provider value={value}>
      {children}
    </RewardStoreProductsContext.Provider>
  );
}