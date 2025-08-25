import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';

import { buildSelection } from 'src/utils/graphql-client';

export function useAllRewardIntroSteps(fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query AllRewardIntroSteps {
        allIntroSteps {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'RewardUsers',
    },
  });

  const value = data?.allIntroSteps || [];

  return { loading, error, data: value, refetch };
}