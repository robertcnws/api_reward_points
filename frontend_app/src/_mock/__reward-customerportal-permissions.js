import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';

import { buildSelection } from 'src/utils/graphql-client';

export function useRewardCustomerportalPermissionByKey(key, fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query RewardCustomerportalPermissionByKey($key: String!) {
        customerportalPermissionByKey(key: $key) {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'RewardAuthorization',
    },
    variables: { key },
    skip: !key,
  });

  const value = data?.customerportalPermissionByKey || {};

  return { loading, error, data: value, refetch };
}


export function useAllRewardCustomerportalPermissions(fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query AllRewardCustomerportalPermissions {
        allCustomerportalPermissions {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'RewardAuthorization',
    },
  });

  const value = data?.allCustomerportalPermissions || [];

  return { loading, error, data: value, refetch };
}