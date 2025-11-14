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
import { ItemgroupRow } from '../itemgroup-row';
import { ItemgroupItemDetails } from '../itemgroup-item-details';


// ----------------------------------------------------------------------

const titleOptions = [
    { value: 'allItems', label: 'All Items' },
    { value: 'BG', label: 'Bronze / Gray' },
    { value: 'WG', label: 'White / Gray' },
    { value: 'BGI', label: 'Bronze / Gray (Privacy)' },
    { value: 'WGI', label: 'White / Gray (Privacy)' },
]

export function ItemgroupView() {

    const { isMobile } = useContext(LoadingContext);

    const [tableData, setTableData] = useState([]);

    const filters = useSetState({ name: '', option: 'allItems' });

    const {
        loadedItemgroups,
        refetchItemgroups,
        loadingItemgroups,
    } = useDataContext();

    const [title, setTitle] = useState(titleOptions[0].label);

    const [titleLinearProgress, setTitleLinearProgress] = useState('Loading itemgroups data...');

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
        filters.state.option !== 'allItems'
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
        <>
            {
                (loadingItemgroups) ? (
                    <Box
                        sx={{
                            width: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '80vh',
                            margin: 'auto'
                        }}
                    >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            {titleLinearProgress}
                        </Typography>
                        <LinearProgress
                            key="error"
                            sx={{
                                mb: 2,
                                width: '100%',
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: 'black',
                                },
                                backgroundColor: '#e0e0e0',
                            }}
                        />
                    </Box>
                ) : (
                    <>
                        <DashboardContent>

                            <Stack
                                spacing={2.5}
                                sx={{ my: { xs: 3, md: 3 } }}
                                display='flex'
                                flexDirection='row'
                                alignItems='center'
                                justifyContent='space-between'
                            >
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: selectedItem ? '35%' : '100%',
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 2 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                                popoverItemgroup.onOpen(e);
                                            }}>
                                            <Typography variant="h5" color="text.primary">{title}</Typography>
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
                                    </Box>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 0,
                                        width: '80%'
                                    }}>
                                        <Tooltip title="Search item(s) by NAME, SKU or description..." arrow>
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
                                                sx={{ width: '100%' }}
                                            />
                                        </Tooltip>
                                    </Box>
                                </Box>

                                {selectedItem && (

                                    <Box>
                                        <Tooltip title={`Close selected item ${selectedItem?.name || ''}`} arrow>
                                            <IconButton
                                                variant="contained"
                                                color="default"
                                                onClick={handleCloseSelectedItem}
                                            >
                                                <Iconify icon="vaadin:close" width={20} height={20} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                )}
                            </Stack>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                gap: 4,
                                pb: 4,
                                pl: isMobile ? 2 : 4,
                                height: 540
                            }}
                            >
                                <Box sx={{ width: selectedItem ? '35%' : '100%', transition: 'width 0.3s ease' }}>
                                    {notFound ? (
                                        <Box sx={{ width: '100%', justifyContent: 'center', alignItems: 'center', display: 'flex', height: 400 }}>
                                            <BoxNoData notFound={notFound} />
                                        </Box>
                                    ) : (
                                        <Scrollbar sx={{ height: 720 }}>
                                            <MenuList sx={{ p: 0 }}>
                                                {dataFiltered?.filter((ig) => ig?.listItems?.length > 0).map((itemgroup) => (
                                                    <ItemgroupRow
                                                        key={itemgroup.id}
                                                        row={itemgroup}
                                                        selectedItem={selectedItem}
                                                        setSelectedItem={setSelectedItem}
                                                    />
                                                ))}
                                            </MenuList>
                                        </Scrollbar>
                                    )}
                                </Box>
                                {selectedItem && (
                                    <ItemgroupItemDetails selectedItem={selectedItem} />
                                )}
                            </Box>

                        </DashboardContent>
                    </>
                )}
        </>
    );

}

function applyFilter({ inputData, filters }) {
    const { name, option } = filters;

    const searchText = name ? name.trim().toLowerCase() : '';
    const optionText =
        option && option !== 'allItems' ? option.trim().toLowerCase() : '';

    const result = inputData
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

                if (optionText) {
                    const sku = (listItem.sku || '').toLowerCase();
                    return sku.includes(optionText);
                }

                return true;
            });

            if (!filteredListItems.length) {
                return null;
            }

            return {
                ...item,
                listItems: filteredListItems,
            };
        })
        .filter(Boolean);

    return result;
}
