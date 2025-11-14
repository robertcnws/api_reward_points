import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';

import { buildSelection } from 'src/utils/graphql-client';

export function useRewardItemgroupsById(groupId, fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query RewardItemgroupById($groupId: String!) {
        rewardFullItemgroupById(groupId: $groupId) {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'RewardIntegration',
    },
    variables: { groupId },
    skip: !groupId,
  });

  const value = data?.rewardFullItemgroupById || {};

  return { loading, error, data: value, refetch };
}


export function useRewardItemgroupsByZohoOrgId(zohoOrgId, fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query RewardItemgroupsByZohoOrgId($zohoOrgId: String!) {
        rewardFullItemgroupsByZohoOrgId(zohoOrgId: $zohoOrgId) {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'RewardIntegration',
    },
    variables: { zohoOrgId },
    skip: !zohoOrgId,
  });

  const value = data?.rewardFullItemgroupsByZohoOrgId || [];

  return { loading, error, data: value, refetch };
}