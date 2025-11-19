
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { fNumber } from 'src/utils/format-number';
import { useContext } from 'react';
import { LoadingContext } from 'src/auth/context/loading-context';
import { Label } from 'src/components/label';

import { Iconify } from 'src/components/iconify';
import { Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { ItemgroupGroupItemDetails } from './itemgroup-group-item-details';



// ----------------------------------------------------------------------

export function ItemgroupTableRow({
  row,
}) {

  const rowDetails = useBoolean();
  const { isMobile } = useContext(LoadingContext);

  return (
    <>
      <TableRow hover sx={{
        bgcolor: row?.actualAvailableStock > 0 ? 'inherit' : 'error.lighter',
      }}>

        <TableCell sx={{ cursor: 'pointer' }} onClick={rowDetails.onTrue}>
          <Stack spacing={2} direction="row" alignItems="center">
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link color="inherit" onClick={rowDetails.onTrue} sx={{ cursor: 'pointer' }}>
                {row?.sku}
              </Link>
              {isMobile && (
                <Box component="span" sx={{ color: 'text.secondary' }}>
                  {row?.name}
                </Box>
              )}
              <Box component="span" sx={{ color: 'text.disabled' }}>
                Group: {row?.groupName}
              </Box>
            </Stack>
          </Stack>
        </TableCell>

        {!isMobile && (

          <TableCell sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={rowDetails.onTrue}>{row.name}</TableCell>

        )}

        <TableCell sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={rowDetails.onTrue}>
          {/* {row?.actualAvailableStock > 0 ?
            fNumber(row?.actualAvailableStock) :
            <Label variant="soft" color="error">
              Out of Stock
            </Label>
          } */}
          {fNumber(row?.actualAvailableStock)}
        </TableCell>

        <TableCell align="right">
          <Stack direction="row" alignItems="right" sx={{ justifyContent: 'flex-end' }}>

            <Tooltip title="View Details" placement="top" arrow>
              <IconButton onClick={rowDetails.onTrue}>
                <Iconify icon="zondicons:view-show" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
      <Dialog
        open={rowDetails.value}
        onClose={rowDetails.onFalse}
        fullWidth
        maxWidth="md"
      >
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <ItemgroupGroupItemDetails selectedItem={row} isFromTable />
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack
            justifyContent="center"
            alignItems="center"
            sx={{ width: '100%', p: 2 }}
          >
            <Button variant="outlined" onClick={rowDetails.onFalse}>
              Close
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}
