import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';

import { buildSelection } from 'src/utils/graphql-client';

export function useDealerportalOrderById(orderId, fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query DealerportalOrderById($orderId: String!) {
        dealerportalOrderById(orderId: $orderId) {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'Dealerportal',
    },
    variables: { orderId },
    skip: !orderId,
  });

  const value = data?.dealerportalOrderById || {};

  return { loading, error, data: value, refetch };
}


export function useAllDealerportalOrders(fieldsDescriptor, ownerId=null) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query AllDealerportalOrders($ownerId: String) {
        allDealerportalOrders(ownerId: $ownerId) {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'Dealerportal',
    },
    variables: { ownerId },
    // skip: !ownerId,
  });

  const value = data?.allDealerportalOrders || [];

  return { loading, error, data: value, refetch };
}