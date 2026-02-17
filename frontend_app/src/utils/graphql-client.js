import { split, HttpLink, ApolloClient, InMemoryCache } from '@apollo/client';

import { endpoints } from './axios';

const httpLinkRewardPoints = new HttpLink({
  uri: endpoints.graphql.rewardPoints,
});

const httpLinkUsers = new HttpLink({
  uri: endpoints.graphql.users,
});

const httpLinkRewardIntegration = new HttpLink({
  uri: endpoints.graphql.rewardIntegration,
});

const httpLinkRewardAuthorization = new HttpLink({
  uri: endpoints.graphql.rewardAuthorization,
});

const httpLinkDealerPortal = new HttpLink({
  uri: endpoints.graphql.dealerportal,
});

const splitLink = split(
  (operation) => operation.getContext().clientName === 'RewardPoints',
  httpLinkRewardPoints,
  split(
    (operation) => operation.getContext().clientName === 'RewardIntegration',
    httpLinkRewardIntegration,
    split(
      (operation) => operation.getContext().clientName === 'RewardAuthorization',
      httpLinkRewardAuthorization,
      split(
        (operation) => operation.getContext().clientName === 'RewardUsers',
        httpLinkUsers,
        httpLinkDealerPortal
      )
    )
  )
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

export default client;

/**
 * @param {Array<string|{ name: string, fields: Array }>} fields
 */
export function buildSelection(fields) {
  return fields
    .map(f => {
      if (typeof f === 'string') {
        return f;
      }
      const nested = buildSelection(f.fields).join('\n        ');
      return `${f.name} {\n        ${nested}\n      }`;
    });
}
