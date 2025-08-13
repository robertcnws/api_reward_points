import { useContext, useCallback } from 'react';

import { Box } from '@mui/material';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import CardHeader from '@mui/material/CardHeader';

import { useSetState } from 'src/hooks/use-set-state';

import { fDate } from 'src/utils/format-time';
import { fNumber, fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { useTable, TableNoData, TableHeadCustom } from 'src/components/table';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';

import { LoadingContext } from 'src/auth/context/loading-context';

import { SalesOrdersListFilters } from '../sales-order/sales-orders-list-filters';

// ----------------------------------------------------------------------

export function InvoicesList({ title, subheader, tableData, headLabel, ...other }) {

  const { isMobile } = useContext(LoadingContext);

  const table = useTable({
    defaultDense: true,
    defaultOrderBy: 'date',
    defaultOrder: 'desc'
  });

  const allStatuses = tableData.reduce((acc, order) => {
    if (order.status && !acc.includes(order.status)) {
      acc.push(order.status);
    }
    return acc;
  }, []);

  const filters = useSetState({
    status: null,
    salesorderNumber: ''
  });

  const filteredData = applyFilters(tableData, filters.state);

  const setTitle = useCallback(() => {
    let initialTitle = 'Invoices History';
    if (filters.state.status) {
      initialTitle += ` - Status: ${filters.state.status.toUpperCase()}`;
    }
    if (filters.state.salesorderNumber) {
      initialTitle += ` - SO Number: ~${filters.state.salesorderNumber}`;
    }
    return `${initialTitle} (Qty: ${filteredData.length})`;
  }, [filters.state, filteredData.length]);

  return (
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
            allSalespersons={[]}
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
                  <RowItem key={`${row.id}-${index}`} row={row} isMobile={isMobile} />
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
  );
}

// ----------------------------------------------------------------------

function RowItem({ row, isMobile }) {

  return (
    <TableRow>

      <TableCell align="left">{fDate(row?.date)}</TableCell>

      <TableCell width={!isMobile ? 300 : 'auto'}>{row?.salesorder?.salesorderNumber}</TableCell>

      {/* <TableCell width={!isMobile ? 300 : 'auto'}>{row?.invoiceNumber}</TableCell> */}

      <TableCell align="center">{fNumber(row?.lineItems?.length)}</TableCell>

      <TableCell align="center">
        <Label color={
          row?.status === 'paid' ?
            'success' : row?.status === 'partially_paid' ?
              'info' : row?.status === 'sent' ?
                'warning' : row?.status === 'overdue' ?
                  'error' : 'default'
        }>
          {row?.status}
        </Label>
      </TableCell>

      <TableCell align="right">
        <Label color={row?.paymentMade > 0 ? 'success' : 'error'}>
          {fCurrency(row?.paymentMade)}
        </Label>
      </TableCell>

      <TableCell align="right">
        <Label color={row?.taxTotal > 0 ? 'success' : 'error'}>
          {fCurrency(row?.taxTotal)}
        </Label>
      </TableCell>

      <TableCell align="right">
        <Label color={row?.balance > 0 ? 'success' : 'error'}>
          {fCurrency(row?.balance)}
        </Label>
      </TableCell>


      {/* <TableCell>
        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar alt={row.name} src={row.avatarUrl} />
          {row.name}
        </Box>
      </TableCell> */}

      {/* <TableCell align="center">
        <FlagIcon code={row.countryCode} />
      </TableCell> */}

      {/* <TableCell align="right">
        <Label
          variant="soft"
          color={
            (row.rank === 'Top 1' && 'primary') ||
            (row.rank === 'Top 2' && 'secondary') ||
            (row.rank === 'Top 3' && 'info') ||
            (row.rank === 'Top 4' && 'warning') ||
            'error'
          }
        >
          {row.rank}
        </Label>
      </TableCell> */}
    </TableRow>
  );
}

function applyFilters(list, filters) {
  const { status, salesorderNumber } = filters;
  if (status) {
    list = list.filter(item => item?.status === status);
  }
  if (salesorderNumber) {
    list = list.filter(item => item?.salesorder?.salesorderNumber.includes(filters.salesorderNumber));
  }
  return list;
}
