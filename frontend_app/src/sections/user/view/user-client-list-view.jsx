import React, {
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  useDeferredValue,
} from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { LinearProgress, SvgIcon, TableContainer, Typography } from '@mui/material';
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
import { isAdministrator, isClient } from 'src/utils/check-permissions';
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
import { PurchaseAddOrderModalForm } from 'src/sections/purchase/purchase-add-order-modal-form';
import { PurchaseAddCartModalForm } from 'src/sections/purchase/purchase-add-cart-modal-form';

import { UserTableToolbar } from '../user-table-toolbar';
import { UserClientTableRow } from '../user-client-table-row';
import { UserTableFiltersResult } from '../user-table-filters-result';

// ----------------------------------------------------------------------

const USEL_CLIENT_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
];

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USEL_CLIENT_OPTIONS];

const TABLE_HEAD = [
  { id: 'username', label: 'Username' },
  { id: 'company', label: 'Info' },
  { id: 'points', label: 'Reward Points' },
  { id: 'createdTime', label: 'Created At' },
  { id: 'sync', label: 'Sync (Zoho)' },
  { id: 'approved', label: 'Approved' },
  { id: '' },
];

const TABLE_HEAD_MOBILE = [{ id: 'info', label: 'Clients' }];

// ----------------------------------------------------------------------

export function UserClientListView() {
  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userLogged'));
    } catch {
      return null;
    }
  }, []);

  const table = useTable({ defaultDense: true, defaultOrderBy: 'createdTime', defaultOrder: 'desc' });
  const router = useRouter();
  const confirm = useBoolean();

  const {
    loadedClients,
    refetchClients,
    loadingClients,
    loadedUserRoles,
  } = useDataContext();

  const [tableData, setTableData] = useState([]);
  const filters = useSetState({ name: '', status: 'all' });

  // --- ref estable a refetch (evita dependencias inestables)
  const refetchRef = useRef(refetchClients);
  useEffect(() => {
    refetchRef.current = refetchClients;
  }, [refetchClients]);

  // --- URL del WS en ref para no depender del objeto wsEndpoints en el effect
  const wsUrlRef = useRef(wsEndpoints.rewardPoints.rewardPoints.all);

  const wsUrlUsersRef = useRef(wsEndpoints.users.all);

  // --- WebSocket: 1 sola conexión + debounce sin early return ni catch vacío
  const socketRef = useRef(null);
  const refetchTimerRef = useRef(null);

  useEffect(() => {
    let didOpen = false;
    if (!socketRef.current) {
      const socket = new WebSocket(wsUrlRef.current);
      socketRef.current = socket;
      didOpen = true;

      socket.onerror = () => {
        // opcional: usar tu logger si tienes uno; evitando console si tu ESLint lo prohíbe
      };

      socket.onmessage = () => {
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
        refetchTimerRef.current = setTimeout(() => {
          if (typeof refetchRef.current === 'function') {
            refetchRef.current().catch(() => {
              // manejar error si deseas
            });
          }
        }, 500);
      };
    }

    // cleanup SI y solo si abrimos socket dentro de este effect
    return () => {
      if (didOpen) {
        const s = socketRef.current;
        if (s && (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING)) {
          // cerrar sin try/catch vacío
          s.close();
        }
        socketRef.current = null;
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      }
    };
  }, []); // sin dependencias: una vez por ciclo de vida


  // --- WebSocket: 2 sola conexión + debounce sin early return ni catch vacío

  useEffect(() => {
    let didOpen = false;
    if (!socketRef.current) {
      const socket = new WebSocket(wsUrlUsersRef.current);
      socketRef.current = socket;
      didOpen = true;

      socket.onerror = () => {
        // opcional: usar tu logger si tienes uno; evitando console si tu ESLint lo prohíbe
      };

      socket.onmessage = () => {
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
        refetchTimerRef.current = setTimeout(() => {
          if (typeof refetchRef.current === 'function') {
            refetchRef.current().catch(() => {
              // manejar error si deseas
            });
          }
        }, 500);
      };
    }

    // cleanup SI y solo si abrimos socket dentro de este effect
    return () => {
      if (didOpen) {
        const s = socketRef.current;
        if (s && (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING)) {
          // cerrar sin try/catch vacío
          s.close();
        }
        socketRef.current = null;
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const rewards = Array.isArray(loadedClients) ? loadedClients : [];

    setTableData((prev) => {
      if (prev.length !== rewards.length) return rewards;

      const nextById = new Map(rewards.map((u) => [String(u.id), u]));

      for (let i = 0; i < prev.length; i += 1) {
        const p = prev[i];
        const n = nextById.get(String(p.id));
        if (!n) return rewards;

        if (
          p.totalAvailablePoints !== n.totalAvailablePoints ||
          p.isApproved !== n.isApproved ||
          p.isVerified !== n.isVerified ||
          p.isActive !== n.isActive ||
          p.isSyncWithZoho !== n.isSyncWithZoho ||
          p.avatarUrl !== n.avatarUrl ||
          p.keyAvatar !== n.keyAvatar
        ) {
          return rewards;
        }
      }
      return prev;
    });
  }, [loadedClients]);

  // --- Deferred search
  const filterStatus = filters.state.status;
  const filterNameDeferred = useDeferredValue(filters.state.name);

  const dataFiltered = useMemo(() => {
    const baseInput = Array.isArray(tableData) ? tableData : [];
    let base = baseInput.filter(
      (u) => u && u.userRole && u.userRole.name === 'client' && u.isVerified
    );

    const q = (filterNameDeferred || '').toLowerCase();
    if (q) {
      base = base.filter((user) => {
        const fields = [
          user?.username,
          user?.firstName,
          user?.lastName,
          user?.email,
          user?.phoneNumber,
          user?.companyName,
        ];
        for (let i = 0; i < fields.length; i += 1) {
          const v = (fields[i] || '').toString().toLowerCase();
          if (v.includes(q)) return true;
        }
        return false;
      });
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        base = base.filter((u) => u.isApproved && u.isVerified);
      } else if (filterStatus === 'pending') {
        base = base.filter((u) => !u.isApproved && u.isVerified);
      }
    }

    return [...base].sort(getComparator(table.order, table.orderBy));
  }, [tableData, table.order, table.orderBy, filterStatus, filterNameDeferred]);

  // y ajusta canReset para que no dependa del objeto completo:
  const canReset = useMemo(
    () => Boolean(filterNameDeferred) || filterStatus !== 'all',
    [filterNameDeferred, filterStatus]
  );

  const dataInPage = useMemo(
    () => rowInPage(dataFiltered, table.page, table.rowsPerPage),
    [dataFiltered, table.page, table.rowsPerPage]
  );

  const notFound = useMemo(() => (!dataFiltered.length && canReset) || !dataFiltered.length, [
    dataFiltered.length,
    canReset,
  ]);

  // --- Handlers estables
  const handleDeleteRow = useCallback(
    async (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      const response = await axiosInstanceBackend.delete(endpoints.user.delete.user(id), {
        headers: { 'Content-Type': 'application/json' },
        data: { userReporter: userLogged?.data },
      });

      if (response.data && response.data.message) {
        setTableData(deleteRow);
        table.onUpdatePageDeleteRow(dataInPage.length);
        toast.success(response.data.message);
      } else {
        toast.error(response?.data?.error || 'Error deleting user');
      }
    },
    [dataInPage.length, table, tableData, userLogged]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const rows = tableData.filter((row) => !table.selected.includes(row.id));

      const payload = {
        userIds: table.selected.filter((id) => id !== userLogged?.data?.id),
        userReporter: userLogged?.data,
      };

      const response = await axiosInstanceBackend.delete(endpoints.user.delete.users, {
        headers: { 'Content-Type': 'application/json' },
        data: payload,
      });

      if (response.data && response.data.message) {
        toast.success(response.data.message);
        setTableData(rows);
        table.onUpdatePageDeleteRows({
          totalRowsInPage: dataInPage.length,
          totalRowsFiltered: dataFiltered.length,
        });
        if (typeof refetchRef.current === 'function') refetchRef.current();
      } else {
        toast.error(response?.data?.error || 'Error deleting users');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Error deleting users');
    }
  }, [dataFiltered.length, dataInPage.length, table, tableData, userLogged]);

  const postSimple = useCallback(
    async (urlBuilder, id, fallbackMsg, modalBoolean) => {
      try {
        const response = await axiosInstanceBackend.post(urlBuilder(id), {
          userReporter: userLogged?.data,
        });
        if (modalBoolean) modalBoolean.onFalse();
        if (response.data && response.data.message) {
          if (typeof refetchRef.current === 'function') refetchRef.current();
          toast.success(response.data.message);
        } else {
          toast.error(response?.data?.error || fallbackMsg || 'Error');
        }
      } catch (error) {
        toast.error(error?.response?.data?.error || fallbackMsg || 'Error');
      }
    },
    [userLogged]
  );

  const handleChangeApprovalRow = useCallback(
    async (id, modalBoolean) => {
      await postSimple(endpoints.user.changeApproval.user, id, 'Error changing approval', modalBoolean);
      // setTableData((prev) => prev.map((u) => (u.id === id ? { ...u, isApproved: !u.isApproved } : u)));
      if (typeof refetchRef.current === 'function') refetchRef.current();
    },
    [postSimple]
  );

  const handleChangeVerifyRow = useCallback(
    (id) => postSimple(endpoints.user.changeVerify.user, id, 'Error changing verify'),
    [postSimple]
  );

  const handleChangeActiveRow = useCallback(
    (id) => postSimple(endpoints.user.changeActive.user, id, 'Error changing active'),
    [postSimple]
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

  const handleRefetchPointsRow = useCallback(async (id) => {
    try {
      const response = await axiosInstanceBackend.get(endpoints.user.refetchPoints.user(id));
      if (response.data && response.data.message) {
        if (typeof refetchRef.current === 'function') refetchRef.current();
        toast.success(response.data.message);
      } else {
        toast.error(response?.data?.error || 'Error refetching points');
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Error refetching points');
    }
  }, []);

  const handleSelectRow = useCallback(
    (id) => () => {
      table.onSelectRow(id);
    },
    [table]
  );

  const openAddOrder = useBoolean();

  const openAddCart = useBoolean();

  const renderAddOrder = (
    <Button
      variant="contained"
      startIcon={<Iconify icon="mingcute:add-line" />}
      sx={{
        bgcolor: 'primary.dark',
        '&:hover': {
          bgcolor: 'primary.main',
        },
        height: 40,
        mt: 1
      }}
      onClick={openAddOrder.onTrue}
    >
      New order
    </Button>
  );

  const renderAddCart = (
    <Button
      variant="contained"
      startIcon={<Iconify icon="mingcute:add-line" />}
      sx={{
        bgcolor: 'primary.dark',
        '&:hover': {
          bgcolor: 'primary.main',
        },
        height: 40,
        mt: 1
      }}
      onClick={openAddCart.onTrue}
    >
      <SvgIcon sx={{ width: 20, height: 20 }}>
        <Iconify icon="solar:cart-check-bold-duotone" width={20} height={20} />
      </SvgIcon>
      Add cart
    </Button>
  );

  if (loadingClients) {
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
            margin: 'auto',
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            Loading clients data...
          </Typography>
          <LinearProgress
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiLinearProgress-bar': { backgroundColor: 'black' },
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
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <CustomBreadcrumbs
            links={[
              { name: 'Dashboard', href: paths.dashboard.general.analytics },
              { name: 'Client', href: paths.dashboard.client.list },
              { name: 'Client List' },
            ]}
            sx={{ mb: { xs: 3, md: 5 } }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 3 }}>
            {!isClient(userLogged?.data?.user_role?.name) && renderAddCart}
            {!isClient(userLogged?.data?.user_role?.name) && renderAddOrder}
          </Box>
        </Box>

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
                    {tab.value === 'active'
                      ? tableData.filter((user) => user.isApproved && user.isVerified).length
                      : tab.value === 'pending'
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

          {canReset ? (
            <UserTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          ) : null}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.filter((id) => id !== userLogged?.data?.id).length}
              rowCount={dataFiltered.filter((row) => row.id !== userLogged?.data?.id).length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered
                    .filter((row) => row.id !== userLogged?.data?.id)
                    .map((row) => row.id)
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

            <TableContainer
              sx={{
                px: { md: 1 },
                minWidth: !isMobile ? 960 : 380,
                maxHeight:
                  filters.state.status === 'all'
                    ? 'calc(100vh - 380px)'
                    : 'calc(100vh - 480px)',
                overflowY: 'auto',
              }}
            >
              <Table size={table.dense ? 'small' : 'medium'} stickyHeader>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={!isMobile ? TABLE_HEAD : TABLE_HEAD_MOBILE}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={
                    isAdministrator(userLogged?.data?.user_role?.name) ?
                      (checked) =>
                        table.onSelectAllRows(
                          checked,
                          dataFiltered.map((row) => row.id)
                        ) : undefined
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
                        refetchClients={refetchClients}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={handleSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                        onApprovalRow={(modalBoolean) => handleChangeApprovalRow(row.id, modalBoolean)}
                        onVerifyRow={() => handleChangeVerifyRow(row.id)}
                        onActiveRow={() => handleChangeActiveRow(row.id)}
                        onProfileRow={() => handleProfileRow(row.id)}
                        onRefetchRow={() => handleRefetchPointsRow(row.id)}
                      />
                    ))}

                  {dataFiltered.length > 0 ? (
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
                  ) : null}

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Card>
      </DashboardContent>

      <PurchaseAddOrderModalForm
        openAddOrder={openAddOrder}
      />

      <PurchaseAddCartModalForm
        openAddCart={openAddCart}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete{' '}
            <strong>
              {table.selected.filter((id) => id !== userLogged?.data?.id).length}
            </strong>{' '}
            items?
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
