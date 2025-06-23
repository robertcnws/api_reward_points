import React, { useMemo, useContext, createContext } from 'react';

import { useRewardPointsByUsername } from 'src/_mock/__reward-points';

const RewardPointsContext = createContext();
export const useRewardPoints = () => useContext(RewardPointsContext);

export function RewardPointsProvider({ children }) {

  const fields = [
    'createdTime',
    'totalSpentPoints',
    'totalGainedPoints',
    'totalAmountInvoices',
    {
      name: 'invoices',
      fields: [
        'date',
        'invoiceNumber',
        'invoiceId',
        {
          name: 'lineItems',
          fields: ['quantity', 'name', 'rate', 'sku', 'itemTotal'],
        },
        {
          name: 'taxes',
          fields: ['taxName', 'taxAmount'],
        },
      ],
    },
    {
      name: 'user',
      fields: ['companyName', 'firstName', 'email', 'lastName', 'phoneNumber'],
    },
  ];

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    data: loadedRewardPoints = [],
    refetch: refetchRewardPoints,
    loading: loadingRewardPoints,
    error: errorRewardPoints
  } = useRewardPointsByUsername(userLogged?.data?.username, fields);

  const value = useMemo(() => ({
    loadedRewardPoints,
    refetchRewardPoints,
    loadingRewardPoints,
    errorRewardPoints
  }), [
    loadedRewardPoints,
    refetchRewardPoints,
    loadingRewardPoints,
    errorRewardPoints
  ]);

  return <RewardPointsContext.Provider value={value}>{children}</RewardPointsContext.Provider>;

}