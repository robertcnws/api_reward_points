import React, { useContext, useMemo } from 'react';

import { Box, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { fieldsDealerportalOrders } from 'src/auth/context/data/field-descriptors/field-descriptors-dealerportal-orders';
import { useDealerportalOrderById } from 'src/_mock/__dealerportal-orders';

import { LoadingContext } from 'src/auth/context/loading-context';
import { fDate, fDateTime } from 'src/utils/format-time';
import { fCurrency, fNumber } from 'src/utils/format-number';


// ----------------------------------------------------------------------

export function DealerportalOrderTableRow({
  row,
  index,
  selected,
  onSelectRow,
  onDeleteRow,
  onViewRow,
  onReturnList,
  isMobile,
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const confirm = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  const {
    refetch: refetchOrder
  } = useDealerportalOrderById(row?.id, fieldsDealerportalOrders);

  const openEditOrder = useBoolean();



  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1} sx={{ cursor: 'pointer' }}>

        <TableCell padding="checkbox">
          <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
          {!isMobile ? fDateTime(row?.createdAt) : fDate(row?.createdAt)}
        </TableCell>

        {!isMobile && (

          <TableCell onClick={() => onViewRow()}>
            <Label
              variant="soft"
              color={
                (row?.status?.toLowerCase() === 'pending' && 'info') ||
                (row?.status?.toLowerCase() === 'accepted' && 'success') ||
                (row?.status?.toLowerCase() === 'paid' && 'secondary') ||
                (row?.status?.toLowerCase() === 'ready to pickup' && 'error') ||
                (row?.status?.toLowerCase() === 'cancelled' && 'warning') ||
                (row?.status?.toLowerCase() === 'completed' && 'primary') ||
                'default'
              }
              sx={{ cursor: 'pointer' }}
            >
              {row?.status?.toUpperCase()}
            </Label>
          </TableCell>

        )}

        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexDirection: 'column' }}>
            {row?.quote?.name || 'N/A'}
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'row' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Status:
                </Typography>
                <Label
                  variant="soft"
                  color={
                    (row?.status?.toLowerCase() === 'pending' && 'info') ||
                    (row?.status?.toLowerCase() === 'accepted' && 'success') ||
                    (row?.status?.toLowerCase() === 'paid' && 'secondary') ||
                    (row?.status?.toLowerCase() === 'ready to pickup' && 'error') ||
                    (row?.status?.toLowerCase() === 'cancelled' && 'warning') ||
                    (row?.status?.toLowerCase() === 'completed' && 'primary') ||
                    'default'
                  }
                  sx={{ cursor: 'pointer' }}
                >
                  {row?.status?.toUpperCase()}
                </Label>
              </Box>
            )}
          </Box>
        </TableCell>


        <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
          {row?.number}
        </TableCell>

        {!isMobile && (
          <>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {row?.quote?.number || 'N/A'}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {`${row?.createdBy?.firstName} ${row?.createdBy?.lastName}` || 'N/A'}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {fCurrency(row?.quote?.totalSell || 0)}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {fCurrency(row?.quote?.totalCost || 0)}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onViewRow()}>
              {fDateTime(row?.updatedAt)}
            </TableCell>
          </>
        )}

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Stack direction="row" alignItems="center">
            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>


      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              onViewRow();
              popover.onClose();
            }}
          >
            <Iconify icon="lets-icons:view" />
            View Order
          </MenuItem>
          {row?.status?.toLowerCase() !== 'accepted' && (
            <MenuItem
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete Order
            </MenuItem>
          )}
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete order: (${row?.quote?.name})?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />

    </>
  );
}
