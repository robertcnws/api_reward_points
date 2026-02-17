import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { Autocomplete, Chip, LinearProgress, ListItem, TextField } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { isClient } from 'src/utils/check-permissions';

import { endpoints, wsEndpoints, axiosInstanceBackend } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';
import {
    useTable,
    rowInPage,
    TableNoData,
    getComparator,
    TableHeadCustom,
    TableSelectedAction,
} from 'src/components/table';

import { LoadingContext } from 'src/auth/context/loading-context';
import { useDataContext } from 'src/auth/context/data/data-context';

import { DealerportalQuoteTableRow } from '../dealerportal-quote-table-row';
import { DealerportalQuoteTableToolbar } from '../dealerportal-quote-table-toolbar';
import { DealerportalQuoteTableFiltersResult } from '../dealerportal-quote-table-filters-result';
import { DealerportalQuoteAutocompleteOwners } from '../component/dealerportal-quote-autocomplete-owners';
import { DealerportalQuoteModalFilterOwner } from '../dealerportal-quote-modal-filter-owner';
import { DealerportalQuoteModalAddNew } from '../dealerportal-quote-modal-add-new';


// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All Quotes' }].concat([
    { value: 'active', label: 'Active' },
    // { value: 'inactive', label: 'Inactive' },
    { value: 'ordered', label: 'Ordered' },
]);

const headersCSV = [
    { label: 'Name', key: 'name' },
    { label: 'Description', key: 'description' },
]

const getValidTabValue = (options, currentValue) => options.some(
    (tab) => tab.value === currentValue
) ? currentValue : false;

// ----------------------------------------------------------------------

export function DealerportalQuoteListView() {

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const roleName = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);

    const {
        loadedQuotes,
        loadingQuotes,
        errorQuotes,
        refetchQuotes,
        loadedUsers,
    } = useDataContext();

    const [updating, setUpdating] = useState(false);

    const [titleLinearProgress, setTitleLinearProgress] = useState('Loading quotes data...');

    const TABLE_HEAD = [
        { id: 'number', label: isMobile ? '#' : 'Quote #' },
        { id: 'date', label: 'Date' },
        ...isMobile ? [] : [
            { id: 'status', label: 'Status' },
        ],
        { id: 'name', label: 'Job Name' },
        ...isMobile ? [] : [
            { id: 'dealerAccount', label: 'Dealer Account' },
            { id: 'createdBy', label: 'Created By' },
            { id: 'totalSell', label: 'Total Sell' },
            { id: 'totalCost', label: 'Total Cost' },
            { id: 'lastModified', label: 'Last Modified' },
        ],
        { id: '' },
    ];

    const table = useTable({ defaultDense: true, defaultOrderBy: 'updatedAt', defaultOrder: 'desc' });

    const router = useRouter();

    const confirm = useBoolean();

    const [tableData, setTableData] = useState([]);

    const filters = useSetState({
        name: '',
        owner: {
            id: '',
            name: ''
        },
        status: localStorage.getItem('dealerportalQuoteStatus') || 'all'
    });

    const collapse = useBoolean(
        filters.state.status === 'active' ||
        filters.state.status === 'inactive' ||
        filters.state.status === 'ordered'
    );

    const statusValue = getValidTabValue(STATUS_OPTIONS, filters.state.status);


    useEffect(() => {
        const page = localStorage.getItem('itemPage');
        if (page) {
            table.setPage(parseInt(page, 10));
        }
        const rowsPerPage = localStorage.getItem('itemRowsPerPage');
        if (rowsPerPage) {
            table.setRowsPerPage(parseInt(rowsPerPage, 10));
        }
    }, [table]);


    // useEffect(() => {
    //     if (refetchQuotes) {
    //         refetchQuotes();
    //     }
    //     setTableData(loadedQuotes || []);
    // }, [refetchQuotes, loadedQuotes]);

    useEffect(() => {
        if (loadedQuotes) {
            setTableData(loadedQuotes);
        }
    }, [loadedQuotes]);

    useEffect(() => {
        const socket = new WebSocket(wsEndpoints.dealerportal.quotes.all);
        socket.onerror = (errorEvent) => {
            console.dir(errorEvent);
            console.error('WebSocket error (toString):', errorEvent.toString());
        };
        socket.onmessage = (event) => {
            // console.log('WebSocket message event:', event);
            const message = JSON.parse(event.data);
            // console.log('WebSocket message received:', message);
            if (message.type === 'created' || message.type === 'updated' || message.type === 'deleted') {
                refetchQuotes?.().then(() => {
                    console.log('Quotes refetched successfully after WebSocket message.');
                }).catch((error) => {
                    console.error('Error refetching quotes after WebSocket message:', error);
                });
            }
        };
        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, [refetchQuotes]);


    const dataFiltered = applyFilter({
        inputData: tableData,
        comparator: getComparator(table.order, table.orderBy),
        filters: filters.state,
    });

    const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

    const canReset =
        !!filters.state.name || filters.state.status !== 'all' || !!filters.state.owner.id;

    const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

    const handleDeleteRow = useCallback(
        async (id) => {
            try {
                await axiosInstanceBackend.delete(endpoints.dealerportal.quote.delete(id), {
                    data: {
                        userReporter: JSON.stringify(userLogged?.data),
                    }
                });
                const updatedRows = tableData.filter((row) => row.id !== id);
                setTableData(updatedRows);
                table.onUpdatePageDeleteRow(dataInPage.length);
                toast.success('Delete success!');
            } catch (error) {
                console.error(error);
                toast.error(error.response.data.error);
            }
        },
        [dataInPage.length, table, tableData, userLogged?.data]
    );
    
    const handleReturnList = useCallback(
        () => {
            router.push(paths.dashboard.quote.list);
        },
        [router]
    );

    const handleFilterStatus = useCallback(
        (event, newValue) => {
            table.onResetPage();
            localStorage.setItem('dealerportalQuoteStatus', newValue);
            filters.setState({ status: newValue });
            if (newValue === 'ordered' ||
                newValue === 'active' ||
                newValue === 'inactive') {
                collapse.onTrue();
            }
            else {
                collapse.onFalse();
            }
        },
        [filters, table, collapse]
    );

    const handleViewRow = useCallback(
        (id) => {
            localStorage.setItem('dealerportalQuoteStatus', filters.state.status);
            router.push(paths.dashboard.quote.details(id));
        },
        [router, filters]
    );

    const handleCloneRow = useCallback(
        async (id) => {
            try {
                await axiosInstanceBackend.post(endpoints.dealerportal.quote.clone(id), {
                    userReporter: JSON.stringify(userLogged?.data),
                });
                toast.success('Quote cloned successfully!');
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.error || 'Error cloning quote');
            }
        }, [userLogged]);

    const openOwnerFilter = useBoolean();

    const openAddNewQuote = useBoolean();

    const [selectedOwner, setSelectedOwner] = useState(null);

    const sortedUsers = useMemo(() => loadedUsers
        ? [...loadedUsers].sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
        })
        : []
        , [loadedUsers]);

    const renderFilterOwner = (

        <>
            <Button
                color="inherit"
                onClick={openOwnerFilter.onTrue}
                endIcon={
                    <Iconify
                        icon={openOwnerFilter.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
                        sx={{ ml: -0.5 }}
                    />
                }
            >
                {!!filters.state.owner.id && !!filters.state.owner.name
                    ? `Owner: ${filters.state.owner.name}`
                    : 'Select Owner'}
            </Button>

            <DealerportalQuoteModalFilterOwner
                loadedUsers={sortedUsers}
                filters={filters}
                openOwnerFilter={openOwnerFilter}
                setOpenOwnerFilter={openOwnerFilter.setValue}
                selectedOwner={selectedOwner}
                setSelectedOwner={setSelectedOwner}
                filterFunc={isClient}
            />
        </>
    );


    if (errorQuotes) {
        return (
            <DashboardContent>
                <Box display="flex" alignItems="center" mb={5}>
                    <Alert severity="error" sx={{ borderRadius: 0 }}>
                        <Typography>Error fetching quotes: {errorQuotes.message}</Typography>
                    </Alert>
                </Box>
            </DashboardContent>
        );
    }

    if (loadingQuotes) {
        return (
            <DashboardContent>
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
            </DashboardContent>
        );
    }

    return (
        <>
            <DashboardContent>
                <CustomBreadcrumbs
                    // heading="List"
                    links={[
                        { name: 'Dashboard', href: paths.dashboard.general.analytics },
                        { name: 'Quote', href: paths.dashboard.quote.root },
                        { name: 'List' },
                    ]}
                    action={
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 3 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 3 }}>
                                {!isClient(roleName) && renderFilterOwner}
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<Iconify icon="mingcute:add-line" />}
                                sx={{
                                    bgcolor: 'primary.dark',
                                    '&:hover': {
                                        bgcolor: 'primary.main',
                                    },
                                }}
                                onClick={openAddNewQuote.onTrue}
                            >
                                New Quote
                            </Button>
                        </Box>
                    }
                    sx={{ mb: { xs: 3, md: 5 } }}
                />

                <Card>
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Tabs
                            value={statusValue}
                            onChange={handleFilterStatus}
                            sx={{
                                px: 2.5,
                                width: '97%',
                            }}
                        >
                            {STATUS_OPTIONS.map((tab) => (
                                <Tab
                                    key={tab.value}
                                    iconPosition="end"
                                    value={tab.value}
                                    label={tab.label}
                                    icon={
                                        <Label
                                            variant={
                                                ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                                                'soft'
                                            }
                                            color={
                                                (tab.value === 'active' && 'success') ||
                                                (tab.value === 'inactive' && 'error') ||
                                                (tab.value === 'ordered' && 'warning') ||
                                                'default'
                                            }
                                        >
                                            {
                                                tab.value === 'active' ?
                                                    tableData.filter((it) => it.status?.toLowerCase() === 'active').length :
                                                    tab.value === 'inactive' ?
                                                        tableData.filter((it) => it.status?.toLowerCase() === 'inactive').length :
                                                        tab.value === 'ordered' ?
                                                            tableData.filter((it) => it.status?.toLowerCase() === 'ordered').length :
                                                            tableData.length
                                            }
                                        </Label>
                                    }
                                />
                            ))}
                        </Tabs>
                    </Box>

                    <DealerportalQuoteTableToolbar
                        filters={filters}
                        onResetPage={table.onResetPage}
                        options={{ values: STATUS_OPTIONS.map((option) => option.label) }}
                        dataFiltered={dataFiltered}
                        headersCSV={headersCSV}
                        setUpdating={setUpdating}
                        setTitleLinearProgress={setTitleLinearProgress}
                        title={filters.state.status === 'all' ? 'All Quotes' :
                            filters.state.status === 'active' ? 'Active Quotes' :
                                filters.state.status === 'inactive' ? 'Inactive Quotes' :
                                    filters.state.status === 'ordered' ? 'Ordered Quotes' :
                                        filters.state.status
                        }
                    />

                    {canReset && (
                        <DealerportalQuoteTableFiltersResult
                            filters={filters}
                            totalResults={dataFiltered.length}
                            onResetPage={table.onResetPage}
                            sx={{ p: 2.5, pt: 0 }}
                        />
                    )}

                    <Box sx={{ position: 'relative' }}>
                        <TableSelectedAction
                            dense={table.dense}
                            numSelected={table.selected.length}
                            rowCount={dataFiltered.length}
                            // onSelectAllRows={(checked) =>
                            //     table.onSelectAllRows(
                            //         checked,
                            //         dataFiltered.map((row) => row.id)
                            //     )
                            // }
                            // action={
                            //     <Tooltip title="Delete">
                            //         <IconButton color="primary" onClick={confirm.onTrue}>
                            //             <Iconify icon="solar:trash-bin-trash-bold" />
                            //         </IconButton>
                            //     </Tooltip>
                            // }
                        />
                        <Scrollbar>
                            {tableData && tableData.length > 0 ? (
                                <TableContainer sx={{ maxHeight: filters.state.status !== 'all' ? 500 : 590 }}>
                                    <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: !isMobile ? 960 : 380 }} stickyHeader>
                                        <TableHeadCustom
                                            order={table.order}
                                            orderBy={table.orderBy}
                                            headLabel={TABLE_HEAD}
                                            rowCount={dataFiltered.length}
                                            numSelected={table.selected.length}
                                            onSort={table.onSort}
                                            // onSelectAllRows={(checked) =>
                                            //     table.onSelectAllRows(
                                            //         checked,
                                            //         dataFiltered.map((row) => row.id)
                                            //     )
                                            // }
                                        />

                                        <TableBody>
                                            {dataFiltered
                                                .slice(
                                                    table.page * table.rowsPerPage,
                                                    table.page * table.rowsPerPage + table.rowsPerPage
                                                )
                                                .map((row, index) => (
                                                    <DealerportalQuoteTableRow
                                                        key={row.id}
                                                        row={row}
                                                        index={index}
                                                        selected={table.selected.includes(row.id)}
                                                        onSelectRow={() => table.onSelectRow(row.id)}
                                                        onDeleteRow={() => handleDeleteRow(row.id)}
                                                        onReturnList={() => handleReturnList()}
                                                        onViewRow={() => handleViewRow(row.id)}
                                                        onCloneRow={() => handleCloneRow(row.id)}
                                                        isMobile={isMobile}
                                                    />
                                                ))}

                                            {dataFiltered.length > 0 && (
                                                <TableCustomPaginationZohoStyleRow
                                                    columnsLength={TABLE_HEAD.length}
                                                    data={dataFiltered}
                                                    page={table.page}
                                                    rowsPerPage={table.rowsPerPage}
                                                    handleChangePage={(event, newPage) => {
                                                        localStorage.setItem('itemPage', newPage);
                                                        table.onChangePage(event, newPage);
                                                    }}
                                                    handleChangeRowsPerPage={(event) => {
                                                        localStorage.setItem('itemRowsPerPage', event.target.value);
                                                        table.onChangeRowsPerPage(event);
                                                    }}
                                                    dense={table.dense}
                                                    onChangeDense={table.onChangeDense}
                                                />
                                            )}

                                            <TableNoData notFound={notFound} />
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableBody>
                                            <TableNoData notFound={tableData.length === 0} />
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Scrollbar>
                    </Box>
                </Card>
            </DashboardContent >

            <DealerportalQuoteModalAddNew
                loadedUsers={sortedUsers}
                openOwnerFilter={openAddNewQuote}
                setOpenOwnerFilter={openAddNewQuote.setValue}
                selectedOwner={selectedOwner}
                setSelectedOwner={setSelectedOwner}
                filterFunc={isClient}
                roleName={roleName}
                userLogged={userLogged}
                refetchQuotes={refetchQuotes}
            />
        </>
    );
}

function applyFilter({ inputData, comparator, filters }) {
    const { name, status, owner } = filters;

    const stabilizedThis = inputData.map((el, index) => [el, index]);

    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });

    inputData = stabilizedThis.map((el) => el[0]);

    if (name) {
        inputData = inputData.filter(
            (item) => item?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.owner?.companyName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.owner?.firstName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.owner?.lastName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.owner?.username?.toLowerCase().indexOf(name.toLowerCase()) !== -1
        );
    }

    if (owner.id) {
        inputData = inputData.filter(
            (item) => item.owner?.id === owner.id
        );
    }

    if (status !== 'all') {
        if (status === 'active') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'active'
            );
        } else if (status === 'inactive') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'inactive'
            );
        } else if (status === 'ordered') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'ordered'
            );
        }
    }
    return inputData;
}
