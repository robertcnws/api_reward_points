import React, { useMemo, useContext, createContext } from 'react';
import { useAllDealerportalOrders } from 'src/_mock/__dealerportal-orders';
import { fieldsDealerportalOrders } from '../field-descriptors/field-descriptors-dealerportal-orders';


// import { useFilteredLoginUsers } from '../hooks/use-filtered-user-roles';

const DealerportalOrdersContext = createContext();
export const useDealerportalOrders = () => useContext(DealerportalOrdersContext);

export function DealerportalOrdersProvider({ children }) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const roleName = useMemo(() => {
        const user = userLogged?.data;
        return user?.user_role ? user.user_role.name : '';
    }, [userLogged]);

    const fields = useMemo(() => fieldsDealerportalOrders, []);

    const ownerId =
        roleName === 'client'
            ? userLogged?.data?.id
            : null;

    const allDealerportalOrdersQuery = useAllDealerportalOrders(
        fields,
        ownerId
    );

    const loadedAllDealerportalOrders = useMemo(
        () => allDealerportalOrdersQuery.data || [],
        [allDealerportalOrdersQuery.data]
    );

    const refetchAllDealerportalOrders = useMemo(
        () => allDealerportalOrdersQuery.refetch,
        [allDealerportalOrdersQuery.refetch]
    );

    const loadingAllRewardLoginUsers = allDealerportalOrdersQuery.loading || false;

    const errorRewardLoginUsers = allDealerportalOrdersQuery.error || null;

    const value = useMemo(
        () => ({
            loadedAllDealerportalOrders,
            refetchAllDealerportalOrders,
            loadingAllRewardLoginUsers,
            errorRewardLoginUsers,
        }),
        [
            loadedAllDealerportalOrders,
            refetchAllDealerportalOrders,
            loadingAllRewardLoginUsers,
            errorRewardLoginUsers
        ]
    );

    return (
        <DealerportalOrdersContext.Provider value={value}>
            {children}
        </DealerportalOrdersContext.Provider>
    );
}