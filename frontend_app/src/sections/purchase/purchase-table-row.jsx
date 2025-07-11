import React, { useContext, useMemo } from 'react';

import { Stack, Typography } from '@mui/material';
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
import { PurchaseDetailsModal } from './purchase-details-modal';
import { PurchaseUseModalForm } from './purchase-use-modal-form';


// ----------------------------------------------------------------------

export function PurchaseTableRow({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
  onViewRow,
  onReturnList,
  onCancelRefundRow,
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => userLogged?.data?.user_role?.name, [userLogged]);

  const { isMobile } = useContext(LoadingContext);

  const confirm = useBoolean();

  const confirmRefund = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();

  const openDetails = useBoolean();

  const openUse = useBoolean();

  const assignedPoints = useMemo(() => row?.storeProductSelection?.storeProduct?.assignedPoints || 0, [row]);

  const quantity = useMemo(() => row?.storeProductSelection?.quantity || 0, [row]);

  const total = useMemo(() => assignedPoints * quantity, [assignedPoints, quantity]);

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1} sx={{ cursor: 'pointer' }}>

        {(!isClient(roleName) && !row?.hasBeenUsed) && (

          <TableCell padding="checkbox">
            <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
          </TableCell>
        )}

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
            <TableCell sx={{ whiteSpace: 'nowrap' }}>
              <StoreProductFolderItemCarousel
                images={row?.storeProductSelection?.storeProduct?.attachments ?? []}
              />
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={openDetails.onTrue}>
              {row?.orderNumber || 'N/A'}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={openDetails.onTrue}>
              <Typography
                variant="body2"
                noWrap
                sx={{
                  fontWeight: 'bold',
                  fontStyle: 'normal',
                  fontSize: 15,
                  cursor: 'pointer',
                  color: 'text.primary',
                  '&:hover': { color: 'primary.main' }
                }}>
                {row?.confirmationNumber || 'N/A'}
              </Typography>
            </TableCell>

            <TableCell onClick={openDetails.onTrue}>
              {row?.storeProductSelection?.storeProduct?.name}
            </TableCell>

            {!isClient(roleName) && (
              <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={openDetails.onTrue}>
                {row?.storeProductSelection?.user?.firstName} {row?.storeProductSelection?.user?.lastName}
              </TableCell>
            )}

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={openDetails.onTrue}>
              <Label color="success" sx={{ alignItems: 'center', fontSize: 14 }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {fNumber(assignedPoints) || 0}
              </Label>
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={openDetails.onTrue}>
              x{quantity}
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={openDetails.onTrue}>
              <Label color="info" sx={{ alignItems: 'center', fontSize: 14 }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {fNumber(total) || 0}
              </Label>
            </TableCell>

            <TableCell onClick={openDetails.onTrue}>
              <Label
                variant="soft"
                color={
                  (row?.hasBeenUsed && row?.quantityUsed === quantity && 'error') ||
                  (row?.hasBeenUsed && row?.quantityUsed !== 0 && row?.quantityUsed < quantity && 'warning') ||
                  (!row?.hasBeenUsed && 'info') ||
                  'default'
                }
                sx={{ cursor: 'pointer' }}
              >
                {
                  (row?.hasBeenUsed && row?.quantityUsed === quantity) ? 'Used!!' :
                    (row?.hasBeenUsed && row?.quantityUsed !== 0 && row?.quantityUsed < quantity) ? 'Partially Used!' :
                      'Not Used'
                }
              </Label>
            </TableCell>

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={openDetails.onTrue}>
              <b>{row?.quantityUsed ? `x${row?.quantityUsed}` : 0}</b>
            </TableCell>

            {isClient(roleName) && (
              <TableCell
                sx={{ whiteSpace: 'nowrap' }}
                onClick={openDetails.onTrue}
              >
                <Label
                  variant="soft"
                  color={
                    (row.hasRequestedRefund && 'secondary') ||
                    (!row.hasRequestedRefund && 'success') ||
                    'default'
                  }
                  sx={{ cursor: 'pointer' }}
                >
                  {row?.hasRequestedRefund ? 'YES!' : 'NO'}
                </Label>
              </TableCell>
            )}

            <TableCell sx={{ whiteSpace: 'nowrap' }} onClick={openDetails.onTrue}>
              {fDateTime(row?.createdTime)}
            </TableCell>

          </>
        ) : (
          <TableCell >
            Name: <Label
              variant="soft"
              color='default'
              sx={{ cursor: 'pointer' }}
              onClick={openDetails.onTrue}
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
              openDetails.onTrue();
              popover.onClose();
            }}
          >
            <Iconify
              icon="hugeicons:view"
            />
            View Purchase Details
          </MenuItem>
          {!row?.hasBeenUsed && (
            <MenuItem
              onClick={() => {
                confirmRefund.onTrue();
                popover.onClose();
              }}
            >
              <Iconify
                icon={
                  row.hasRequestedRefund ? "si:cancel-presentation-fill" : "heroicons-solid:receipt-refund"
                }
              />
              {row.hasRequestedRefund ? 'Cancel Refund Request' : 'Request Refund'}
            </MenuItem>
          )}
          {(roleName !== 'client' && !row.hasRequestedRefund) && [
            <MenuItem
              key='use-purchase'
              onClick={() => {
                openUse.onTrue();
                popover.onClose();
              }}
            >
              <Iconify icon="bxs:purchase-tag" />
              Use Purchase
            </MenuItem>
          ]}
          {(roleName !== 'client' && !row.hasBeenUsed) && [
            <MenuItem
              key='edit-purchase'
              onClick={() => {
                confirm.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Delete Purchase
            </MenuItem>
          ]}


        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete purchase: (${row.storeProductSelection?.storeProduct?.name})?`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={
              async () => {
                await onDeleteRow(row?.id);
                confirm.onFalse();
              }}>
            Delete
          </Button>
        } />

      <ConfirmDialog
        open={confirmRefund.value}
        onClose={confirmRefund.onFalse}
        title={row.hasRequestedRefund ? "Cancel Refund Request" : "Request Refund"}
        content={`Are you sure want to ${row.hasRequestedRefund ? "cancel" : "request"} refund for purchase: (${row.storeProductSelection?.storeProduct?.name})?`}
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              onCancelRefundRow(row?.id);
              confirmRefund.onFalse();
            }}
          >
            {row.hasRequestedRefund ? "Cancel Refund" : "Request Refund"}
          </Button>
        }
      />

      <PurchaseDetailsModal
        currentBuy={row}
        open={openDetails}
        openUse={openUse}
      />

      <PurchaseUseModalForm
        currentBuy={row}
        open={openUse}
      />

    </>
  );
}
