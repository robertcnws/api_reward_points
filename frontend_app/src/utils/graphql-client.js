import { split, HttpLink, ApolloClient, InMemoryCache } from '@apollo/client';

import { CONFIG } from '../config-global';

const httpLinkRewardPoints = new HttpLink({
  uri: `${CONFIG.apiUrl}/reward-points/graphql/`,
});

const httpLinkUsers = new HttpLink({
  uri: `${CONFIG.apiUrl}/users/graphql/`,
});

const httpLinkRewardIntegration = new HttpLink({
  uri: `${CONFIG.apiUrl}/integration/graphql/`,
});

const httpLinkRewardAuthorization = new HttpLink({
  uri: `${CONFIG.apiUrl}/authorization/graphql/`,
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
      httpLinkUsers
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
