import React, { useContext, useMemo } from 'react';

import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { fDateTime } from 'src/utils/format-time';
import { isClient } from 'src/utils/check-permissions';
import { fNumber } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';
import { StoreProductFolderItemCarousel } from '../store-product/store-product-folder-item-carousel';


// ----------------------------------------------------------------------

export function PurchaseTableRow({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
  onViewRow,
  onReturnList
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);

  const { isMobile } = useContext(LoadingContext);

  const confirm = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  const assignedPoints = useMemo(() => row?.storeProductSelection?.storeProduct?.assignedPoints || 0, [row]);

  const quantity = useMemo(() => row?.storeProductSelection?.quantity || 0, [row]);

  const total = useMemo(() => assignedPoints * quantity, [assignedPoints, quantity]);

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1} sx={{ cursor: 'pointer' }}>

        <TableCell padding="checkbox">
          <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
        </TableCell>

        {/* { id: 'file', label: 'Product' },
    { id: 'name', label: 'Name' },
    { id: 'assignedPoints', label: 'Points' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'total', label: 'Total' },
    { id: 'status', label: 'Status' },
    { id: 'createdTime', label: 'Created At' },
    { id: 'actions', label: 'Actions', align: 'right' }, */}

        {!isMobile ? (
          <>
            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              <StoreProductFolderItemCarousel
                images={row?.storeProductSelection?.storeProduct?.attachments ?? []}
              />
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              {row?.storeProductSelection?.storeProduct?.name}
            </TableCell>

            {!isClient(roleName) && (
              <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
                {row?.storeProductSelection?.user?.firstName} {row?.storeProductSelection?.user?.lastName}
              </TableCell>
            )}

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              <Label color="success" sx={{ alignItems: 'center', fontSize: 14 }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {fNumber(assignedPoints) || 0}
              </Label>
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              {quantity}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              <Label color="info" sx={{ alignItems: 'center', fontSize: 14 }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {fNumber(total) || 0}
              </Label>
            </TableCell>

            <TableCell onClick={() => onEditRow()}>
              <Label
                variant="soft"
                color={
                  (row.hasBeenUsed && 'warning') ||
                  (!row.hasBeenUsed && 'info') ||
                  'default'
                }
                sx={{ cursor: 'pointer' }}
              >
                {row?.hasBeenUsed ? 'Used' : 'Not Used'}
              </Label>
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={() => onEditRow()}>
              {fDateTime(row?.createdTime)}
            </TableCell>

          </>
        ) : (
          <TableCell >
            Name: <Label
              variant="soft"
              color='default'
              sx={{ cursor: 'pointer' }}
              onClick={() => onEditRow()}
            >
              <u>{row.name}</u>
            </Label><br />
            <Label
              variant="soft"
              color={
                (row.isActive && 'success') ||
                (!row.isActive && 'warning') ||
                'default'
              }
              sx={{ cursor: 'pointer' }}
              onClick={() => onEditRow()}
            >
              {row.isActive ? 'Active' : 'Inactive'}
            </Label><br />
            Description: <Label
              sx={{ cursor: 'pointer' }}
              variant="soft"
              color='default'
              onClick={() => onEditRow()}
            >
              {row.description ? row.description : 'No description'}
            </Label>
          </TableCell>
        )}
        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          {!row?.hasBeenUsed && (
            <Stack direction="row" alignItems="center">
              <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
            </Stack>
          )}
        </TableCell>
      </TableRow>


      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {roleName !== 'client' ? (
            <MenuItem
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete Purchase
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
            >
              <Iconify icon="heroicons-solid:receipt-refund" />
              Request Refund
            </MenuItem>
          )}

        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete purchase: (${row.storeProductSelection?.storeProduct?.name})?`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
