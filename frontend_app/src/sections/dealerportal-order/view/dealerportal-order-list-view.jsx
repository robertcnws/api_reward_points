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

import { DealerportalOrderTableRow } from '../dealerportal-order-table-row';
import { DealerportalOrderTableToolbar } from '../dealerportal-order-table-toolbar';
import { DealerportalOrderTableFiltersResult } from '../dealerportal-order-table-filters-result';
import { DealerportalOrderAutocompleteOwners } from '../component/dealerportal-order-autocomplete-owners';
import { DealerportalOrderModalFilterOwner } from '../dealerportal-order-modal-filter-owner';


// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All Orders' }].concat([
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'paid', label: 'Paid' },
    { value: 'ready to pickup', label: 'Ready to Pickup' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
]);

const headersCSV = [
    { label: 'Name', key: 'name' },
    { label: 'Description', key: 'description' },
]

const getValidTabValue = (options, currentValue) => options.some(
    (tab) => tab.value === currentValue
) ? currentValue : false;

// ----------------------------------------------------------------------

export function DealerportalOrderListView() {

    const { isMobile } = useContext(LoadingContext);

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const roleName = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);

    const {
        loadedOrders,
        loadingOrders,
        errorOrders,
        refetchOrders,
        loadedUsers,
    } = useDataContext();

    const [updating, setUpdating] = useState(false);

    const [titleLinearProgress, setTitleLinearProgress] = useState('Loading orders data...');

    const TABLE_HEAD = [
        { id: 'date', label: 'Date' },
        ...isMobile ? [] : [
            { id: 'status', label: 'Status' },
        ],
        { id: 'quoteName', label: 'Quote Name' },
        { id: 'number', label: isMobile ? '#' : 'Order #' },
        ...isMobile ? [] : [
            { id: 'quoteNumber', label: 'Quote #' },
            { id: 'orderedBy', label: 'Ordered By' },
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
        status: localStorage.getItem('dealerportalOrderStatus') || 'all'
    });

    const collapse = useBoolean(
        filters.state.status === 'pending' ||
        filters.state.status === 'accepted' ||
        filters.state.status === 'paid' ||
        filters.state.status === 'ready to pickup' ||
        filters.state.status === 'cancelled' ||
        filters.state.status === 'completed'
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

    useEffect(() => {
        if (loadedOrders) {
            setTableData(loadedOrders);
        }
    }, [loadedOrders]);

    useEffect(() => {
        const socket = new WebSocket(wsEndpoints.dealerportal.orders.all);
        socket.onerror = (errorEvent) => {
            console.dir(errorEvent);
            console.error('WebSocket error (toString):', errorEvent.toString());
        };
        socket.onmessage = (event) => {
            // console.log('WebSocket message event:', event);
            const message = JSON.parse(event.data);
            // console.log('WebSocket message received:', message);
            if (message.type === 'created' || message.type === 'updated' || message.type === 'deleted') {
                refetchOrders?.().then(() => {
                    console.log('Orders refetched successfully after WebSocket message.');
                }).catch((error) => {
                    console.error('Error refetching orders after WebSocket message:', error);
                });
            }
        };
        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, [refetchOrders]);


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
                await axiosInstanceBackend.delete(endpoints.dealerportal.order.delete(id), {
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

    const handleDeleteRows = useCallback(async () => {
        try {
            await axiosInstanceBackend.delete(endpoints.dealerportal.order.deleteAll, {
                data: {
                    orderIds: table.selected,
                    userReporter: userLogged?.data,
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            const updatedRows = tableData.filter((row) => !table.selected.includes(row.id));
            setTableData(updatedRows);
            table.onUpdatePageDeleteRows({
                totalRowsInPage: dataInPage.length,
                totalRowsFiltered: dataFiltered.length,
            });
            toast.success('Delete success!');
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.error);
        }
    }, [dataFiltered.length, dataInPage.length, table, tableData, userLogged?.data]);

    const handleReturnList = useCallback(
        () => {
            router.push(paths.dashboard.order.list);
        },
        [router]
    );

    const handleFilterStatus = useCallback(
        (event, newValue) => {
            table.onResetPage();
            localStorage.setItem('dealerportalOrderStatus', newValue);
            filters.setState({ status: newValue });
            if (newValue === 'pending' ||
                newValue === 'accepted' ||
                newValue === 'paid' ||
                newValue === 'ready to pickup' ||
                newValue === 'cancelled' ||
                newValue === 'completed') {
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
            localStorage.setItem('dealerportalOrderStatus', filters.state.status);
            router.push(paths.dashboard.order.details(id));
        },
        [router, filters]
    );

    const openOwnerFilter = useBoolean();

    const openAddNewOrder = useBoolean();

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

            <DealerportalOrderModalFilterOwner
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


    if (errorOrders) {
        return (
            <DashboardContent>
                <Box display="flex" alignItems="center" mb={5}>
                    <Alert severity="error" sx={{ borderRadius: 0 }}>
                        <Typography>Error fetching orders: {errorOrders.message}</Typography>
                    </Alert>
                </Box>
            </DashboardContent>
        );
    }

    if (loadingOrders) {
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
                        { name: 'Order', href: paths.dashboard.order.root },
                        { name: 'List' },
                    ]}
                    action={
                        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 3 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 3 }}>
                                {!isClient(roleName) && renderFilterOwner}
                            </Box>
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
                                                (tab.value === 'pending' && 'info') ||
                                                (tab.value === 'accepted' && 'success') ||
                                                (tab.value === 'paid' && 'secondary') ||
                                                (tab.value === 'ready to pickup' && 'error') ||
                                                (tab.value === 'cancelled' && 'warning') ||
                                                (tab.value === 'completed' && 'primary') ||
                                                'default'
                                            }
                                        >
                                            {
                                                tab.value === 'pending' ?
                                                    tableData.filter((it) => it.status?.toLowerCase() === 'pending').length :
                                                    tab.value === 'accepted' ?
                                                        tableData.filter((it) => it.status?.toLowerCase() === 'accepted').length :
                                                        tab.value === 'paid' ?
                                                            tableData.filter((it) => it.status?.toLowerCase() === 'paid').length :
                                                            tab.value === 'ready to pickup' ?
                                                                tableData.filter((it) => it.status?.toLowerCase() === 'ready to pickup').length :
                                                                tab.value === 'cancelled' ?
                                                                    tableData.filter((it) => it.status?.toLowerCase() === 'cancelled').length :
                                                                    tab.value === 'completed' ?
                                                                        tableData.filter((it) => it.status?.toLowerCase() === 'completed').length :
                                                                        tableData.length
                                            }
                                        </Label>
                                    }
                                />
                            ))}
                        </Tabs>
                    </Box>

                    <DealerportalOrderTableToolbar
                        filters={filters}
                        onResetPage={table.onResetPage}
                        options={{ values: STATUS_OPTIONS.map((option) => option.label) }}
                        dataFiltered={dataFiltered}
                        headersCSV={headersCSV}
                        setUpdating={setUpdating}
                        setTitleLinearProgress={setTitleLinearProgress}
                        title={filters.state.status === 'all' ? 'All Orders' :
                            filters.state.status === 'pending' ? 'Pending Orders' :
                                filters.state.status === 'accepted' ? 'Accepted Orders' :
                                    filters.state.status === 'paid' ? 'Paid Orders' :
                                        filters.state.status === 'ready to pickup' ? 'Orders Ready to Pickup' :
                                            filters.state.status === 'cancelled' ? 'Cancelled Orders' :
                                                filters.state.status === 'completed' ? 'Completed Orders' :
                                                    filters.state.status
                        }
                    />

                    {canReset && (
                        <DealerportalOrderTableFiltersResult
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
                            onSelectAllRows={(checked) =>
                                table.onSelectAllRows(
                                    checked,
                                    dataFiltered.map((row) => row.id)
                                )
                            }
                            action={
                                <Tooltip title="Delete">
                                    <IconButton color="primary" onClick={confirm.onTrue}>
                                        <Iconify icon="solar:trash-bin-trash-bold" />
                                    </IconButton>
                                </Tooltip>
                            }
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
                                            onSelectAllRows={(checked) =>
                                                table.onSelectAllRows(
                                                    checked,
                                                    dataFiltered.map((row) => row.id)
                                                )
                                            }
                                        />

                                        <TableBody>
                                            {dataFiltered
                                                .slice(
                                                    table.page * table.rowsPerPage,
                                                    table.page * table.rowsPerPage + table.rowsPerPage
                                                )
                                                .map((row, index) => (
                                                    <DealerportalOrderTableRow
                                                        key={row.id}
                                                        row={row}
                                                        index={index}
                                                        selected={table.selected.includes(row.id)}
                                                        onSelectRow={() => table.onSelectRow(row.id)}
                                                        onDeleteRow={() => handleDeleteRow(row.id)}
                                                        onReturnList={() => handleReturnList()}
                                                        onViewRow={() => handleViewRow(row.id)}
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

            <ConfirmDialog
                open={confirm.value}
                onClose={confirm.onFalse}
                title="Delete"
                content={
                    <>
                        Are you sure want to delete <strong> {table.selected.length} </strong> orders?
                    </>
                }
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            handleDeleteRows();
                            confirm.onFalse();
                        }}
                    >
                        Delete
                    </Button>
                }
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
            (item) => item?.quote?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.quote?.owner?.companyName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.quote?.owner?.firstName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.quote?.owner?.lastName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.quote?.owner?.username?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.owner?.companyName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.owner?.firstName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.owner?.lastName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
                item?.owner?.username?.toLowerCase().indexOf(name.toLowerCase()) !== -1
        );
    }

    if (owner.id) {
        inputData = inputData.filter(
            (item) => item?.owner?.id === owner.id || item?.quote?.owner?.id === owner.id
        );
    }

    if (status !== 'all') {
        if (status === 'pending') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'pending'
            );
        } else if (status === 'accepted') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'accepted'
            );
        } else if (status === 'paid') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'paid'
            );
        } else if (status === 'ready to pickup') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'ready to pickup'
            );
        } else if (status === 'cancelled') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'cancelled'
            );
        } else if (status === 'completed') {
            inputData = inputData.filter(
                (item) => item.status?.toLowerCase() === 'completed'
            );
        }
    }
    return inputData;
}
