import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { LinearProgress } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

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

import { FunctionalityTableRow } from '../functionality-table-row';
import { FunctionalityTableToolbar } from '../functionality-table-toolbar';
import { FunctionalityTableFiltersResult } from '../functionality-table-filters-result';

// ----------------------------------------------------------------------

const headersCSV = [
  { label: 'Name', key: 'name' },
  { label: 'Description', key: 'description' },
]

const getValidTabValue = (options, currentValue) => options.some(
  (tab) => tab.value === currentValue
) ? currentValue : false;

// ----------------------------------------------------------------------

export function FunctionalityListView() {

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const {
    loadedFunctionalities,
    loadingFunctionalities,
    errorFunctionalities,
    refetchFunctionalities
  } = useDataContext();

  const [updating, setUpdating] = useState(false);

  const [titleLinearProgress, setTitleLinearProgress] = useState('Loading functionalities data...');

  const TABLE_HEAD = [
    { id: 'name', label: 'Name' },
    { id: 'description', label: 'Description' },
    { id: 'rolesAllowed', label: 'Roles Allowed' },
    { id: 'lastModifiedTime', label: 'Last Modified Time' },
    { id: '' },
  ];

  const TABLE_HEAD_MOBILE = [
    { id: 'info', label: 'INFO' },
    { id: '' },
  ];

  const table = useTable({ defaultDense: true, defaultOrderBy: 'lastModifiedTime', defaultOrder: 'desc' });

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState([]);

  const filters = useSetState({ name: '' });

  useEffect(() => {
    localStorage.removeItem('currentFunctionalityId');
  }, []);


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
    if (refetchFunctionalities) {
      refetchFunctionalities();
    }
    setTableData(loadedFunctionalities || []);
  }, [refetchFunctionalities, loadedFunctionalities]);

  useEffect(() => {
    if (loadedFunctionalities) {
      setTableData(loadedFunctionalities);
    }
  }, [loadedFunctionalities]);

  useEffect(() => {
    const socket = new WebSocket(wsEndpoints.functionalities.all);
    //   console.log('WebSocket connected');
    // };
    socket.onerror = (errorEvent) => {
      console.dir(errorEvent);
      console.error('WebSocket error (toString):', errorEvent.toString());
    };
    // socket.onclose = (e) => {
    //   console.log('WebSocket closed', e);
    // };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'created' || message.type === 'updated') {
        setTableData((prevData) => {
          const existingItemIndex = prevData.findIndex(item => String(item.id) === String(message.item.id));
          if (existingItemIndex !== -1) {
            const updatedData = [...prevData];
            updatedData[existingItemIndex] = message.item;
            return updatedData;
          }
          return [message.item, ...prevData];
        });
      }
      else if (message.type === 'deleted') {
        setTableData((prevData) => prevData.filter(item => String(item.id) !== String(message.item.id)));
      }
    };
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);


  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!filters.state.name;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await axiosInstanceBackend.delete(endpoints.functionality.delete.functionality(id), {
          data: {
            userReporter: userLogged?.data,
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
      await axiosInstanceBackend.delete(endpoints.functionality.delete.functionalities, {
        data: {
          functionalityIds: table.selected,
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

  const handleEditRow = useCallback(
    (id) => {
      localStorage.setItem('currentFunctionalityId', id);
      router.push(paths.dashboard.functionality.edit(id));
    },
    [router]
  );

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.functionality.list);
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.functionality.details(id));
    },
    [router]
  );

  if (errorFunctionalities) {
    return (
      <DashboardContent>
        <Box display="flex" alignItems="center" mb={5}>
          <Alert severity="error" sx={{ borderRadius: 0 }}>
            <Typography>Error fetching functionalities: {errorFunctionalities.message}</Typography>
          </Alert>
        </Box>
      </DashboardContent>
    );
  }

  if (loadingFunctionalities) {
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
            { name: 'Functionality', href: paths.dashboard.functionality.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.functionality.new}
              // color="inherit"
              // variant="outlined"
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              sx={{
                bgcolor: 'primary.dark',
                '&:hover': {
                  bgcolor: 'primary.main',
                },
              }}
            >
              New Functionality
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>

          <FunctionalityTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
          />

          {canReset && (
            <FunctionalityTableFiltersResult
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
                          <FunctionalityTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onDeleteRow={() => handleDeleteRow(row.id)}
                            onEditRow={() => handleEditRow(row.id)}
                          />
                        ))}

                      {dataFiltered.length > 0 && (
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
            Are you sure want to delete <strong> {table.selected.length} </strong> functionalities?
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
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (item) => item.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item.description.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }
  
  return inputData;
}
