import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';

import { buildSelection } from 'src/utils/graphql-client';


export function useRewardLastMonthFunctionalities(fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query RewardLastMonthFunctionalities {
        lastMonthFunctionalities {
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

  const value = data?.lastMonthFunctionalities || [];

  return { loading, error, data: value, refetch };
}