import { useState, useContext, useCallback } from 'react';

import { Box, Typography, LinearProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';
import { ItemgroupGroupView } from './itemgroup-group-view';
import { ItemgroupTableView } from './itemgroup-table-view';




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

    const {
        loadedItemgroups,
        refetchItemgroups,
        loadingItemgroups,
    } = useDataContext();

    const [titleLinearProgress, setTitleLinearProgress] = useState('Loading itemgroups data...');

    const [view, setView] = useState(localStorage.getItem('itemgroupView') || 'table');

    const [title, setTitle] = useState(localStorage.getItem('itemgroupTitle') || 'Products');

    const handleChangeView = useCallback((event, newView) => {
        if (newView !== null) {
            localStorage.setItem('itemgroupView', newView);
            setTitle(newView === 'table' ? 'Products' : newView === 'group' ? 'Groups' : 'List');
            localStorage.setItem('itemgroupTitle', newView === 'table' ? 'Products' : newView === 'group' ? 'Groups' : 'List');
            setView(newView);
        }
    }, []);

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
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="h4" gutterBottom>
                                    {title}
                                </Typography>
                                <Box sx={{ mb: -2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <ToggleButtonGroup size="small" value={view} exclusive onChange={handleChangeView}>
                                        <ToggleButton value="table" color={view === 'table' ? 'primary' : 'standard'}>
                                            <Iconify icon="material-symbols:table-chart-outline" />
                                        </ToggleButton>

                                        <ToggleButton value="group" color={view === 'group' ? 'primary' : 'standard'}>
                                            <Iconify icon="formkit:group" />
                                        </ToggleButton>

                                        <ToggleButton value="list" color={view === 'list' ? 'primary' : 'standard'}>
                                            <Iconify icon="material-symbols:list-alt-outline-rounded" />
                                        </ToggleButton>

                                    </ToggleButtonGroup>
                                </Box>
                            </Box>
                            {view === 'group' && (
                                <ItemgroupGroupView
                                    loadedItemgroups={loadedItemgroups}
                                    refetchItemgroups={refetchItemgroups}
                                    loadingItemgroups={loadingItemgroups}
                                />
                            )}
                            {view === 'table' && (
                                <Box sx={{ width: '100%', overflowX: isMobile ? 'scroll' : 'hidden' }}>
                                    <ItemgroupTableView
                                        loadedItemgroups={loadedItemgroups}
                                        refetchItemgroups={refetchItemgroups}
                                        loadingItemgroups={loadingItemgroups}
                                    />
                                </Box>
                            )}

                        </DashboardContent>
                    </>
                )}
        </>
    );

}