import dayjs from 'dayjs';
import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { LinearProgress, TableContainer, Typography } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { endpoints, wsEndpoints, axiosInstanceBackend } from 'src/utils/axios';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
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

import { UserTableToolbar } from '../user-table-toolbar';
import { UserClientTableRow } from '../user-client-table-row';
import { UserTableFiltersResult } from '../user-table-filters-result';

// ----------------------------------------------------------------------

const USEL_CLIENT_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
]

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USEL_CLIENT_OPTIONS];

const TABLE_HEAD = [
  { id: 'username', label: 'Username' },
  { id: 'company', label: 'Info' },
  { id: 'points', label: 'Reward Points' },
  { id: 'sync', label: 'Sync (Zoho)' },
  { id: 'approved', label: 'Approved' },
  { id: '' },
];

const TABLE_HEAD_MOBILE = [
  { id: 'info', label: 'Clients' },
];

// ----------------------------------------------------------------------

export function UserClientListView() {

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const table = useTable({ defaultDense: true });

  const router = useRouter();

  const confirm = useBoolean();

  const {
    loadedAllUsers,
    loadingAllUsers,
    // refetchUsers,
    loadedUserRoles,
    loadedRewardPoints,
    loadingRewardPoints,
    refetchRewardPoints,
  } = useDataContext();

  const [tableData, setTableData] = useState([]);

  const filters = useSetState({ name: '', status: 'all' });

  // console.log('loadedRewardPoints', loadedRewardPoints);

  useEffect(() => {
    if (refetchRewardPoints) {
      refetchRewardPoints();
    }
    const actuallyRewardPoints = loadedRewardPoints.filter((reward) => loadedAllUsers.some((user) => String(user?.id) === String(reward?.user?.id)));
    setTableData(actuallyRewardPoints
      .map(
        (reward) => ({
          ...reward?.user,
          rewardPointsId: reward?.id,
          totalAvailablePoints: reward?.totalAvailablePoints,
          isSyncWithZoho: reward?.isSyncWithZoho,
        })
      ) || []);
  }, [refetchRewardPoints, loadedRewardPoints, loadedAllUsers]);


  useEffect(() => {
    const socket = new WebSocket(wsEndpoints.rewardPoints.rewardPoints.all);
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated' || message.type === 'deleted') {
        refetchRewardPoints?.().catch((error) => {
          console.error('Error refetching users:', error);
        });
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [refetchRewardPoints]);


  // useEffect(() => {
  //   const socket = new WebSocket(wsEndpoints.rewardPoints.rewardPoints.all);
  //   socket.onerror = (errorEvent) => {
  //     console.dir(errorEvent);
  //     console.error('WebSocket error (toString):', errorEvent.toString());
  //   };
  //   socket.onmessage = (event) => {
  //     const message = JSON.parse(event.data);
  //     if (message.type === 'created' || message.type === 'updated') {
  //       setRewardPointsData((prevData) => {
  //         const existingItemIndex = prevData.findIndex(item => String(item.id) === String(message.item.id));
  //         if (existingItemIndex !== -1) {
  //           const updatedData = [...prevData];
  //           updatedData[existingItemIndex] = message.item;
  //           return updatedData;
  //         }
  //         return [message.item, ...prevData];
  //       });
  //     }
  //     else if (message.type === 'deleted') {
  //       setRewardPointsData((prevData) => prevData.filter(item => String(item.id) !== String(message.item.id)));
  //     }
  //   };
  //   return () => {
  //     if (socket && socket.readyState === WebSocket.OPEN) {
  //       socket.close();
  //     }
  //   };
  // }, []);


  const dataFiltered = useMemo(() => applyFilter({
    inputData: tableData.filter(
      (u) => u.userRole.name === 'client' && u.isVerified
    ).sort((a, b) => {
      if (a.createdTime && b.createdTime) return dayjs(b.createdTime).diff(dayjs(a.createdTime));
      if (!a.createdTime && b.createdTime) return 1;
      if (a.createdTime && !b.createdTime) return -1;
      return 0;
    }),
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  }), [tableData, table.order, table.orderBy, filters.state]);

  const dataInPage = useMemo(() => rowInPage(dataFiltered, table.page, table.rowsPerPage), [dataFiltered, table.page, table.rowsPerPage]);

  const canReset = useMemo(() => (
    !!filters.state.name ||
    filters.state.status !== 'all'
  ), [filters.state]);

  const notFound = useMemo(() => (!dataFiltered.length && canReset) || !dataFiltered.length, [dataFiltered.length, canReset]);

  const handleDeleteRow = useCallback(
    async (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      const response = await axiosInstanceBackend.delete(endpoints.user.delete.user(id), {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          userReporter: userLogged?.data,
        },
      });

      if (response.data.message) {
        setTableData(deleteRow);
        table.onUpdatePageDeleteRow(dataInPage.length);
        toast.success(response.data.message);
      }
      else {
        toast.error(response.data.error);
      }
    },
    [dataInPage.length, table, tableData, userLogged]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const rows = tableData.filter((row) => !table.selected.includes(row.id));

      const payload = {
        userIds: table.selected.filter((id) => id !== userLogged?.data.id),
        userReporter: userLogged?.data,
      }

      const response = await axiosInstanceBackend.delete(endpoints.user.delete.users, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: payload,
      });

      if (response.data.message) {
        toast.success(response.data.message);
        setTableData(rows);
        table.onUpdatePageDeleteRows({
          totalRowsInPage: dataInPage.length,
          totalRowsFiltered: dataFiltered.length,
        });
        refetchRewardPoints?.();
      }
      else {
        toast.error(response.data.error);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response.data.error);
    }

  }, [dataFiltered.length, dataInPage.length, table, tableData, userLogged, refetchRewardPoints]);

  const handleChangeApprovalRow = useCallback(
    async (id) => {

      try {

        const response = await axiosInstanceBackend.post(endpoints.user.changeApproval.user(id), {
          userReporter: userLogged?.data,
        });

        if (response.data.message) {
          refetchRewardPoints?.();
          toast.success(response.data.message);
        }
        else {
          toast.error(response.data.error);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response.data.error);
      }
    },
    [userLogged, refetchRewardPoints]
  );

  const handleChangeVerifyRow = useCallback(
    async (id) => {

      const response = await axiosInstanceBackend.post(endpoints.user.changeVerify.user(id), {
        userReporter: userLogged?.data,
      });

      if (response.data.message) {
        refetchRewardPoints?.();
        toast.success(response.data.message);
      }
      else {
        toast.error(response.data.error);
      }
    },
    [userLogged, refetchRewardPoints]
  );

  const handleChangeActiveRow = useCallback(
    async (id) => {

      const response = await axiosInstanceBackend.post(endpoints.user.changeActive.user(id), {
        userReporter: userLogged?.data,
      });

      if (response.data.message) {
        refetchRewardPoints?.();
        toast.success(response.data.message);
      }
      else {
        toast.error(response.data.error);
      }
    },
    [userLogged, refetchRewardPoints]
  );

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  const handleProfileRow = useCallback(
    (id) => {
      router.push(paths.dashboard.purchase.client(id));
    },
    [router]
  );

  const handleRefetchPointsRow = useCallback(
    async (id) => {
      try {
        const response = await axiosInstanceBackend.get(endpoints.user.refetchPoints.user(id));
        if (response.data.message) {
          refetchRewardPoints?.();
          toast.success(response.data.message);
        }
        else {
          toast.error(response.data.error);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response.data.error);
      }
    },
    [refetchRewardPoints]
  );

  if (loadingAllUsers || loadingRewardPoints) {
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
            Loading clients data...
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
            { name: 'Client', href: paths.dashboard.client.list },
            { name: 'Client List' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) =>
                `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
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
                      (tab.value === 'active' && 'info') ||
                      (tab.value === 'pending' && 'error') ||
                      'default'
                    }
                  >
                    {['active', 'inactive'].includes(tab.value)
                      ? tableData.filter((user) => tab.value === 'active' ? (user.isApproved && user.isVerified) : !user.isActive).length
                        : ['pending'].includes(tab.value)
                          ? tableData.filter((user) => !user.isApproved && user.isVerified).length
                          : tableData.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ roles: loadedUserRoles }}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.filter((id) => id !== userLogged?.data.id).length}
              rowCount={dataFiltered.filter((row) => row.id !== userLogged?.data.id).length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.filter((row) => row.id !== userLogged?.data.id).map((row) => row.id)
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

            <TableContainer sx={{
              px: { md: 1 },
              minWidth: !isMobile ? 960 : 380,
              maxHeight: filters.state.status === 'all' ? 'calc(100vh - 380px)' : 'calc(100vh - 480px)',
              overflowY: 'auto',
            }} >
              <Table size={table.dense ? 'small' : 'medium'} stickyHeader>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
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
                    .map((row) => (
                      <UserClientTableRow
                        key={row.id}
                        row={row}
                        refetchRewardPoints={refetchRewardPoints}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                        onApprovalRow={() => handleChangeApprovalRow(row.id)}
                        onVerifyRow={() => handleChangeVerifyRow(row.id)}
                        onActiveRow={() => handleChangeActiveRow(row.id)}
                        onProfileRow={() => handleProfileRow(row.id)}
                        onRefetchRow={() => handleRefetchPointsRow(row.id)}
                      />
                    ))}

                  {dataFiltered?.length > 0 && (
                    <TableCustomPaginationZohoStyleRow
                      columnsLength={isMobile ? TABLE_HEAD_MOBILE.length : TABLE_HEAD.length}
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
          </Box>

          {/* <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          /> */}
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.filter((id) => id !== userLogged?.data.id).length} </strong> items?
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
  const { name, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (user) => user?.username?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        user?.firstName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        user?.lastName?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        user?.email?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        user?.phoneNumber?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        user?.companyName?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    if (status === 'active') {
      inputData = inputData.filter((user) => user?.isApproved && user?.isVerified);
    }
    else if (status === 'pending') {
      inputData = inputData.filter((user) => !user?.isApproved && user?.isVerified);
    }
  }

  return inputData;
}
