import React, { useMemo, useContext, createContext } from 'react';
import { useAllDealerportalQuotes } from 'src/_mock/__dealerportal-quotes';
import { fieldsDealerportalQuotes } from '../field-descriptors/field-descriptors-dealerportal-quotes';


// import { useFilteredLoginUsers } from '../hooks/use-filtered-user-roles';

const DealerportalQuotesContext = createContext();
export const useDealerportalQuotes = () => useContext(DealerportalQuotesContext);

export function DealerportalQuotesProvider({ children }) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const roleName = useMemo(() => {
        const user = userLogged?.data;
        return user?.user_role ? user.user_role.name : '';
    }, [userLogged]);

    const fields = useMemo(() => fieldsDealerportalQuotes, []);

    const ownerId =
        roleName === 'client'
            ? userLogged?.data?.id
            : null;

    const allDealerportalQuotesQuery = useAllDealerportalQuotes(
        fields,
        ownerId
    );

    const loadedAllDealerportalQuotes = useMemo(
        () => allDealerportalQuotesQuery.data || [],
        [allDealerportalQuotesQuery.data]
    );

    const refetchAllDealerportalQuotes = useMemo(
        () => allDealerportalQuotesQuery.refetch,
        [allDealerportalQuotesQuery.refetch]
    );

    const loadingAllRewardLoginUsers = allDealerportalQuotesQuery.loading || false;

    const errorRewardLoginUsers = allDealerportalQuotesQuery.error || null;

    const value = useMemo(
        () => ({
            loadedAllDealerportalQuotes,
            refetchAllDealerportalQuotes,
            loadingAllRewardLoginUsers,
            errorRewardLoginUsers,
        }),
        [
            loadedAllDealerportalQuotes,
            refetchAllDealerportalQuotes,
            loadingAllRewardLoginUsers,
            errorRewardLoginUsers
        ]
    );

    return (
        <DealerportalQuotesContext.Provider value={value}>
            {children}
        </DealerportalQuotesContext.Provider>
    );
}