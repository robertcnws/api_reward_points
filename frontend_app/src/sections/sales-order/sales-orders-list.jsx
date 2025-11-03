import { useContext, useCallback, useState } from 'react';

import { Box } from '@mui/material';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSetState } from 'src/hooks/use-set-state';
import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { fNumber, fCurrency } from 'src/utils/format-number';
import { LoadingContext } from 'src/auth/context/loading-context';

import { DashboardContent } from 'src/layouts/dashboard';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';
import { SalesOrderDetailsItems } from './sales-order-details-item';
import { SalesOrdersListFilters } from './sales-orders-list-filters';

// ----------------------------------------------------------------------

export function SalesOrdersList({
  title,
  subheader,
  tableData,
  headLabel,
  isDashboardView = false,
  loadedRewardPoints = null,
  ...other
}) {

  const { isMobile } = useContext(LoadingContext);

  const router = useRouter();

  const openModalIsDashboardView = useBoolean(false);

  const [selectedSalesOrder, setSelectedSalesOrder] = useState(null);

  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const table = useTable({
    defaultDense: true,
    defaultOrderBy: 'date',
    defaultOrder: 'desc'
  });

  const allSalespersons = tableData.reduce((acc, order) => {
    if (order.salespersonName && !acc.includes(order.salespersonName)) {
      acc.push(order.salespersonName);
    }
    return acc;
  }, []);

  const allStatuses = tableData.reduce((acc, order) => {
    if (order.status && !acc.includes(order.status)) {
      acc.push(order.status);
    }
    return acc;
  }, []);

  const filters = useSetState({
    status: null,
    salespersonName: null,
    salesorderNumber: ''
  });

  const filteredData = applyFilters(tableData, filters.state);

  const setTitle = useCallback(() => {
    let initialTitle = 'Sales Orders History';
    if (filters.state.status) {
      initialTitle += ` - Status: ${filters.state.status.toUpperCase()}`;
    }
    if (filters.state.salespersonName) {
      initialTitle += ` - Salesperson: ${filters.state.salespersonName.toUpperCase()}`;
    }
    if (filters.state.salesorderNumber) {
      initialTitle += ` - SO Number: ~${filters.state.salesorderNumber}`;
    }
    return `${initialTitle} (Qty: ${filteredData.length})`;
  }, [filters.state, filteredData.length]);

  const handleDetailsView = (id) => {
    router.push(paths.dashboard.salesOrder.details(id));
  };

  const handleOpenModalIsDashboardView = useCallback((id) => {
    const salesOrder = tableData.find((so) => so.id === id);
    setSelectedSalesOrder(salesOrder);
    const invoicesAll = loadedRewardPoints?.invoices ?? [];
    // console.log('invoicesAll', invoicesAll);
    const invoices = [...invoicesAll].filter((inv) => inv.salesorder?.id === id);
    setSelectedInvoices(invoices);
    openModalIsDashboardView.onTrue();
  }, [setSelectedSalesOrder, setSelectedInvoices, tableData, openModalIsDashboardView, loadedRewardPoints]);

  const handleView = (id) => {
    if (isDashboardView) {
      handleOpenModalIsDashboardView(id);
    } else {
      handleDetailsView(id);
    }
  };

  return (
    <>
      <DashboardContent>
        <Card {...other}>
          <Box sx={{
            display: 'flex',
            flexDirection: !isMobile ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            width: '100%'
          }}>
            <CardHeader
              title={setTitle()}
              subheader={subheader}
              sx={{
                mb: !isMobile ? 3 : 0,
                width: '100%'
              }}
            />
            <SalesOrdersListFilters
              filters={filters}
              allSalespersons={allSalespersons}
              allStatuses={allStatuses}
              isMobile={isMobile}
            />
          </Box>

          <Scrollbar sx={{ overflowY: 'auto' }}>
            <Table sx={{ position: 'relative' }} stickyHeader>
              <TableHeadCustom headLabel={headLabel} />
              {filteredData?.length > 0 ? (
                <TableBody>
                  {filteredData.slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  ).map((row, index) => (
                    <RowItem
                      key={`${row.id}-${index}`}
                      row={row}
                      isMobile={isMobile}
                      onView={() => handleView(row.id)}
                    />
                  ))}
                  <TableCustomPaginationZohoStyleRow
                    columnsLength={headLabel.length}
                    data={filteredData}
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
                </TableBody>
              ) : (
                <TableBody>
                  <TableNoData notFound={filteredData?.length === 0} />
                </TableBody>
              )}
            </Table>
          </Scrollbar>
        </Card>
      </DashboardContent>
      <ConfirmDialog
        open={openModalIsDashboardView.value}
        onClose={openModalIsDashboardView.onFalse}
        maxWidth='lg'
        content={
          <SalesOrderDetailsItems
            salesOrder={selectedSalesOrder}
            isMobile={isMobile}
            invoices={selectedInvoices}
            isDashboardView={isDashboardView}
          />
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function RowItem({ row, isMobile, onView, defaultBackLink }) {

  return (
    <TableRow sx={{
      cursor: 'pointer',
      '&:hover': { backgroundColor: 'action.hover' },
    }}>

      <TableCell align="left" onClick={onView}>{fDate(row?.date)}</TableCell>

      <TableCell width={!isMobile ? 300 : 'auto'} onClick={onView}>{row?.salesorderNumber}</TableCell>

      {/* <TableCell width={!isMobile ? 300 : 'auto'}>{row?.invoiceNumber}</TableCell> */}

      {!isMobile && (
        <TableCell align="center" onClick={onView}>{fNumber(row?.lineItems?.length)}</TableCell>
      )}

      <TableCell align="center" onClick={onView}>
        <Label color={
          row?.status === 'fulfilled' ?
            'success' : row?.status === 'partially_shipped' ?
              'info' : row?.status === 'confirmed' ?
                'warning' : row?.status === 'overdue' ?
                  'error' : 'default'
        } sx={{ cursor: 'pointer' }}>
          {row?.status}
        </Label>
      </TableCell>

      <TableCell align="right" onClick={onView}>
        <Label color={row?.total > 0 ? 'success' : 'error'}>
          {fCurrency(row?.total)}
        </Label>
      </TableCell>

      {!isMobile && (
        <>
          <TableCell align="right" onClick={onView}>
            <Label color={row?.taxTotal > 0 ? 'success' : 'error'}>
              {fCurrency(row?.taxTotal)}
            </Label>
          </TableCell>

          <TableCell align="center" onClick={onView}>
            {row?.salespersonName || 'N/A'}
          </TableCell>
        </>
      )}

    </TableRow>
  );
}

function applyFilters(list, filters) {
  const { status, salespersonName, salesorderNumber } = filters;
  if (status) {
    list = list.filter(item => item?.status === status);
  }
  if (salespersonName) {
    list = list.filter(item => item?.salespersonName === salespersonName);
  }
  if (salesorderNumber) {
    list = list.filter(item => item?.salesorderNumber.includes(salesorderNumber));
  }
  return list;
}
