import { useState, useContext, useEffect, useMemo, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import { Box, Typography, LinearProgress, IconButton, ListItemText, MenuList, MenuItem, InputAdornment, TextField, Tooltip } from '@mui/material';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { Scrollbar } from 'src/components/scrollbar';
import { BoxNoData, TableNoData } from 'src/components/table';

import { Iconify } from 'src/components/iconify';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';
import { useSetState } from 'src/hooks/use-set-state';

import { CustomPopover, usePopover } from 'src/components/custom-popover';
import { 
    matchesClass, 
    matchesColor, 
    matchesComun, 
    matchesType 
} from 'src/sections/itemgroups/view/itemgroup-table-view';

import { DealerportalItemgroupGroupRow } from '../dealerportal-itemgroup-group-row';

import { DealerportalItemgroupTableFilters } from '../dealerportal-itemgroup-table-filters';


// ----------------------------------------------------------------------

const titleOptions = [
    { value: 'allItems', label: 'All Items' },
    { value: 'BG', label: 'Bronze / Gray' },
    { value: 'WG', label: 'White / Gray' },
    { value: 'BGI', label: 'Bronze / Gray (Privacy)' },
    { value: 'WGI', label: 'White / Gray (Privacy)' },
]

export function DealerportalItemgroupGroupView({
    loadedItemgroups,
    refetchItemgroups,
    loadingItemgroups,
    filters,
    options,
    onManageProduct,
}) {

    const { isMobile } = useContext(LoadingContext);

    const [tableData, setTableData] = useState([]);

    const [title, setTitle] = useState(titleOptions[0].label);

    const popoverItemgroup = usePopover();

    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        if (loadedItemgroups) {
            setTableData(loadedItemgroups);
        }
    }, [loadedItemgroups]);

    const dataFiltered = useMemo(() => applyFilter({
        inputData: tableData,
        filters: filters.state,
    }), [tableData, filters.state]);

    const canReset = useMemo(() => (
        !!filters.state.name ||
        // filters.state.option !== 'allItems' ||
        filters.state.type.length > 0 ||
        filters.state.color.length > 0 ||
        filters.state.series.length > 0 ||
        filters.state.class.length > 0 ||
        filters.state.configuration.length > 0
    ), [filters.state]);

    const notFound = useMemo(() => (!dataFiltered.length && canReset) || !dataFiltered.length, [dataFiltered.length, canReset]);

    const handleCloseSelectedItem = () => {
        setSelectedItem(null);
    };

    const handleFilterName = useCallback(
        (event) => {
            filters.setState({ name: event.target.value });
        },
        [filters]
    );

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: 4,
                pb: 4,
                pl: isMobile ? 2 : 4,
                height: isMobile ? 'auto' : 400
            }}
            >

                <Box sx={{
                    width: {
                        xs: '100%',
                        md: '100%',
                    },
                    transition: 'width 0.3s ease'
                }}>
                    {notFound ? (
                        <Box sx={{ 
                            width: '100%', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            display: 'flex', 
                            height: isMobile ? 'auto' : 400 
                            }}>
                            <BoxNoData notFound={notFound} />
                        </Box>
                    ) : (
                        <Scrollbar sx={{ 
                            height:  isMobile ? 'auto' : 640  
                            }}>
                            <MenuList sx={{ p: 0 }}>
                                {dataFiltered?.filter((ig) => ig?.listItems?.length > 0).map((itemgroup) => (
                                    <DealerportalItemgroupGroupRow
                                        key={itemgroup.id}
                                        row={itemgroup}
                                        selectedItem={selectedItem}
                                        setSelectedItem={setSelectedItem}
                                        handleCloseSelectedItem={handleCloseSelectedItem}
                                        onManageProduct={onManageProduct}
                                    />
                                ))}
                            </MenuList>
                        </Scrollbar>
                    )}
                </Box>
            </Box>
        </Box>
    );

}

function applyFilter({ inputData, filters }) {
    const {
        name,
        type,
        color,
        series,
        class: classes,
        configuration
    } = filters;

    const searchText = name ? name.trim().toLowerCase() : '';
    let result = inputData;

    if (searchText) {
        result = result
            .map((item) => {
                const listItems = Array.isArray(item.listItems) ? item.listItems : [];
                const filteredListItems = listItems.filter((listItem) => {
                    let matchesName = true;
                    if (searchText) {
                        const n = (listItem.name || '').toLowerCase();
                        const sku = (listItem.sku || '').toLowerCase();
                        const desc = (listItem.description || '').toLowerCase();
                        matchesName =
                            n.includes(searchText) ||
                            sku.includes(searchText) ||
                            desc.includes(searchText);
                    }
                    if (!matchesName) return false;
                    return true;
                });
                if (!filteredListItems.length) {
                    return null;
                }
                return {
                    ...item,
                    listItems: filteredListItems,
                };
            }).filter(Boolean);
    }
    if (type.length) {
        result = result
            .map((item) => {
                const listItems = Array.isArray(item.listItems) ? item.listItems : [];
                const filteredListItems = matchesType(listItems, type);
                if (!filteredListItems.length) return null;
                return {
                    ...item,
                    listItems: filteredListItems,
                };
            }).filter(Boolean);
    }
    if (color.length) {
        result = result
            .map((item) => {
                const listItems = Array.isArray(item.listItems) ? item.listItems : [];
                const filteredListItems = listItems.filter((listItem) => matchesColor(listItem, color));
                if (!filteredListItems.length) return null;
                return {
                    ...item,
                    listItems: filteredListItems,
                };
            }).filter(Boolean);
    }
    if (classes.length) {
        result = result
            .map((item) => {
                const listItems = Array.isArray(item.listItems) ? item.listItems : [];
                const filteredListItems = listItems.filter((listItem) => matchesClass(listItem, classes));
                if (!filteredListItems.length) return null;
                return {
                    ...item,
                    listItems: filteredListItems,
                };
            }).filter(Boolean);
    }
    if (series.length) {
        result = result
            .map((item) => {
                const listItems = Array.isArray(item.listItems) ? item.listItems : [];
                const filteredListItems = listItems.filter((listItem) => matchesComun(listItem, series));
                if (!filteredListItems.length) return null;
                return {
                    ...item,
                    listItems: filteredListItems,
                };
            }).filter(Boolean);
    }
    if (configuration.length) {
        result = result
            .map((item) => {
                const listItems = Array.isArray(item.listItems) ? item.listItems : [];
                const filteredListItems = listItems.filter((listItem) => matchesComun(listItem, configuration));
                if (!filteredListItems.length) return null;
                return {
                    ...item,
                    listItems: filteredListItems,
                };
            }).filter(Boolean);
    }

    return result;
}
