import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';

import { buildSelection } from 'src/utils/graphql-client';

// By Email
export function useRewardLoginUserRecoveryCodeByEmail(email, fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query RewardLoginUserRecoveryCodeByEmail($email: String!) {
        recoveryCodeByEmail(email: $email) {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'RewardAuthorization',
    },
    variables: { email },
    skip: !email,
  });

  const value = data?.recoveryCodeByEmail || {};

  return { loading, error, data: value, refetch };
}