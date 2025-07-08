import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import CardHeader from '@mui/material/CardHeader';

import { fCurrency, fNumber } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { FlagIcon } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { fDate } from 'src/utils/format-time';
import { TableFooter } from '@mui/material';

// ----------------------------------------------------------------------

export function EcommerceInvoicesListItems({ title, subheader, tableData, headLabel, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Scrollbar sx={{ minHeight: 422, maxHeight: 422, overflowY: 'auto' }}>
        <Table sx={{ minWidth: 422, position: 'relative' }} stickyHeader>
          <TableHeadCustom headLabel={headLabel} />

          <TableBody>
            {tableData.map((row, index) => (
              <RowItem key={`${row.id}-${index}`} row={row} />
            ))}
          </TableBody>
          
        </Table>
      </Scrollbar>
    </Card>
  );
}

// ----------------------------------------------------------------------

function RowItem({ row }) {

  return (
    <TableRow>

      <TableCell align="left">{fDate(row?.date)}</TableCell>

      <TableCell width={300}>{row?.invoiceNumber}</TableCell>

      <TableCell align="center">{fNumber(row?.lineItems?.length)}</TableCell>

      <TableCell align="right">
        <Label color="success">
          {fCurrency(row?.paymentMade)}
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
