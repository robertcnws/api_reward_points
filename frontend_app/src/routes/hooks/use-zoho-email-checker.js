import { useMemo, useRef, useCallback } from 'react';
import { CONFIG } from 'src/config-global';
import { axiosInstanceBackend, endpoints } from 'src/utils/axios';

export function useZohoEmailChecker() {
  const cacheRef = useRef(new Map());
  const abortRef = useRef(null);

  const checkZohoEmail = useCallback(async (email) => {
    const key = email.trim().toLowerCase();

    // cache simple
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key);
    }

    // cancelar petición previa
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const res = await axiosInstanceBackend.get(endpoints.rewardPoints.integration.zoho.fetchCustomerByEmail, {
      signal: abortRef.current.signal,
      params: {
        page: 1,
        page_size: 100,
        email: key,
      },
    });

    const count = Number(res?.data?.count ?? 0);
    cacheRef.current.set(key, count);
    return count;
  }, []);

  return checkZohoEmail;
}