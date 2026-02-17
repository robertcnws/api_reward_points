import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';

import { buildSelection } from 'src/utils/graphql-client';

export function useDealerportalQuoteById(quoteId, fieldsDescriptor) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query DealerportalQuoteById($quoteId: String!) {
        dealerportalQuoteById(quoteId: $quoteId) {
          ${selection}
        }
      }
    `;
  }, [fieldsDescriptor]);

  const { loading, error, data, refetch } = useQuery(QUERY, {
    context: {
      clientName: 'Dealerportal',
    },
    variables: { quoteId },
    skip: !quoteId,
  });

  const value = data?.dealerportalQuoteById || {};

  return { loading, error, data: value, refetch };
}


export function useAllDealerportalQuotes(fieldsDescriptor, ownerId=null) {
  const QUERY = useMemo(() => {
    const selection = buildSelection(fieldsDescriptor).join('\n      ');
    return gql`
      query AllDealerportalQuotes($ownerId: String) {
        allDealerportalQuotes(ownerId: $ownerId) {
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

  const value = data?.allDealerportalQuotes || [];

  return { loading, error, data: value, refetch };
}