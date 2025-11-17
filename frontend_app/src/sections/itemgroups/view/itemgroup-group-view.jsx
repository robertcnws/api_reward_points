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
import { ItemgroupGroupRow } from '../itemgroup-group-row';
import { ItemgroupGroupItemDetails } from '../itemgroup-group-item-details';
import { itemClasses, itemColors, itemSeries, itemTypes, matchesClass, matchesColor, matchesComun, matchesType } from './itemgroup-table-view';
import { ItemgroupTableFilters } from '../itemgroup-table-filters';
import { ItemgroupTableFiltersResult } from '../itemgroup-table-filters-result';


// ----------------------------------------------------------------------

const titleOptions = [
    { value: 'allItems', label: 'All Items' },
    { value: 'BG', label: 'Bronze / Gray' },
    { value: 'WG', label: 'White / Gray' },
    { value: 'BGI', label: 'Bronze / Gray (Privacy)' },
    { value: 'WGI', label: 'White / Gray (Privacy)' },
]

export function ItemgroupGroupView({
    loadedItemgroups,
    refetchItemgroups,
    loadingItemgroups,
}) {

    const { isMobile } = useContext(LoadingContext);

    const [tableData, setTableData] = useState([]);

    const filters = useSetState({
        name: '',
        // option: 'allItems',
        type: [],
        color: [],
        series: [],
        class: [],
        configuration: [],
    });

    const options = useSetState({
        types: itemTypes,
        colors: itemColors,
        series: itemSeries,
        classes: itemClasses,
        configurations: [],
        // configurations: itemConfigurations,
    });

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
            <Stack
                spacing={2.5}
                sx={{ my: { xs: 3, md: 3 } }}
                display='flex'
                flexDirection='row'
                alignItems='center'
                justifyContent='flex-start'
            >

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    width: '100%'
                }}>
                    {/* <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 2,
                        width: '100%',
                        minWidth: 0,
                    }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                cursor: 'pointer',
                                width: '100%',
                                minWidth: 0,
                            }}
                            onClick={(e) => {
                                popoverItemgroup.onOpen(e);
                            }}>
                            <Typography
                                variant="h5"
                                color="text.primary"
                                sx={{
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {title}
                            </Typography>
                            <IconButton
                                onClick={
                                    (e) => {
                                        popoverItemgroup.onOpen(e);
                                    }
                                }
                            >
                                <Iconify
                                    icon={`icon-park-solid:${popoverItemgroup.open ? 'up' : 'down'}-one`}
                                    width={20} height={20}
                                />
                            </IconButton>
                        </Box>
                        <CustomPopover
                            open={popoverItemgroup.open}
                            anchorEl={popoverItemgroup.anchorEl}
                            onClose={(e) => {
                                popoverItemgroup.onClose(e);
                            }}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            slotProps={{ paper: { sx: { p: 0, width: 260 } } }}
                            sx={{ maxHeight: 800, overflowY: 'auto', overflowX: 'hidden' }}
                        >
                            <Stack spacing={0} sx={{ py: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: 500, p: 1 }}>
                                    <MenuList sx={{ p: 1 }}>
                                        {titleOptions.map((option) => (
                                            <MenuItem key={option.value} sx={{ py: 1 }} onClick={
                                                (e) => {
                                                    setTitle(option.label);
                                                    setSelectedItem(null);
                                                    filters.setState({ option: option.value });
                                                    popoverItemgroup.onClose(e);
                                                }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <ListItemText primary={option.label} />
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </MenuList>
                                </Box>
                            </Stack>
                        </CustomPopover>
                    </Box> */}
                    {/* <Box sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-start',
                        p: 0,
                        width: '100%',
                        minWidth: 0,
                    }}> */}
                    {/* <Tooltip title="Search item(s) by NAME, SKU or description..." arrow>
                            <TextField
                                value={filters.state.name}
                                onChange={handleFilterName}
                                placeholder="Search item(s) by NAME, SKU or description..."
                                onKeyDown={(e) => e.stopPropagation()}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => filters.setState({ name: '' })}
                                                variant='text'
                                                sx={{ color: 'text.disabled' }}
                                            >
                                                <Iconify icon="eva:close-circle-fill" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: '100%', minWidth: 0 }}
                            />
                        </Tooltip> */}
                    <Box sx={{ mt: 2, width: '100%', display: 'flex', flexDirection: 'row' }}>
                        <ItemgroupTableFilters
                            filters={filters}
                            options={options}
                        />
                    </Box>

                    {canReset && (
                        <ItemgroupTableFiltersResult
                            filters={filters}
                            options={options}
                            totalResults={dataFiltered.length}
                            sx={{ p: 2.5, pt: 0 }}
                        />
                    )}
                    {/* </Box> */}
                </Box>


            </Stack>

            <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: 4,
                pb: 4,
                pl: isMobile ? 2 : 4,
                height: 400
            }}
            >

                <Box sx={{
                    width: {
                        xs: selectedItem ? '0%' : '100%',
                        md: selectedItem ? '50%' : '100%',
                    },
                    transition: 'width 0.3s ease'
                }}>
                    {notFound ? (
                        <Box sx={{ width: '100%', justifyContent: 'center', alignItems: 'center', display: 'flex', height: 400 }}>
                            <BoxNoData notFound={notFound} />
                        </Box>
                    ) : (
                        <Scrollbar sx={{ height: !canReset ? 560 : 450 }}>
                            <MenuList sx={{ p: 0 }}>
                                {dataFiltered?.filter((ig) => ig?.listItems?.length > 0).map((itemgroup) => (
                                    <ItemgroupGroupRow
                                        key={itemgroup.id}
                                        row={itemgroup}
                                        selectedItem={selectedItem}
                                        setSelectedItem={setSelectedItem}
                                        handleCloseSelectedItem={handleCloseSelectedItem}
                                    />
                                ))}
                            </MenuList>
                        </Scrollbar>
                    )}
                </Box>
                {selectedItem && (
                    <ItemgroupGroupItemDetails
                        selectedItem={selectedItem}
                        setSelectedItem={setSelectedItem}
                        handleCloseSelectedItem={handleCloseSelectedItem}
                    />
                )}
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
