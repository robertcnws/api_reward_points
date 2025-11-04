import React, { useState, useEffect, useContext, useMemo } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { Typography, ListItemText } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { fDateTime } from 'src/utils/format-time';
import { endpoints, axiosInstanceBackend } from 'src/utils/axios';
import { isAdministrator } from 'src/utils/check-permissions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { LoadingContext } from 'src/auth/context/loading-context';

import { UserQuickEditForm } from './user-quick-edit-form';
import { UserQuickChangePasswordForm } from './user-quick-change-password';
import { UserManagePointsModalForm } from './user-manage-points-modal-form';


// --- cache simple en módulo para URLs de avatar por keyAvatar
const avatarUrlCache = new Map();

function RowComponent({
  row,
  refetchRewardPoints, // se mantiene por compatibilidad, pero ya no creamos WS por fila
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
  onApprovalRow,
  onVerifyRow,
  onActiveRow,
  onProfileRow,
  onRefetchRow,
}) {
  const { isMobile } = useContext(LoadingContext);

  const confirm = useBoolean();
  const popover = usePopover();
  const quickEdit = useBoolean();
  const quickChangePassword = useBoolean();
  const confirmApproval = useBoolean();
  const confirmVerify = useBoolean();
  const confirmActive = useBoolean();
  const confirmManagePoints = useBoolean();

  // userLogged solo si lo necesitas realmente en esta fila
  const userLogged = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userLogged'));
    } catch {
      return null;
    }
  }, []);



  // ---------- Avatar: cache + abort ----------
  const [currentUrl, setCurrentUrl] = useState(row?.avatarUrl || null);

  useEffect(() => {
    const key = row?.keyAvatar;
    if (!key) {
      setCurrentUrl(row?.avatarUrl || null);
      return undefined;
    }

    // usa caché si existe
    if (avatarUrlCache.has(key)) {
      setCurrentUrl(avatarUrlCache.get(key));
      return undefined;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const resp = await axiosInstanceBackend.get(
          endpoints.rewardPoints.getFileUrl(key),
          { signal: controller.signal }
        );
        const url = resp?.data?.url || null;
        if (url) {
          avatarUrlCache.set(key, url);
          setCurrentUrl(url);
        } else {
          setCurrentUrl(row?.avatarUrl || null);
        }
      } catch (err) {
        // si fue abortado, ignora
        setCurrentUrl(row?.avatarUrl || null);
      }
    })();

    return () => controller.abort();
  }, [row?.keyAvatar, row?.avatarUrl]);

  return (
    <>
      {!isMobile ? (
        <TableRow
          hover
          selected={selected && isAdministrator(userLogged?.data?.user_role?.name)}
          aria-checked={selected && isAdministrator(userLogged?.data?.user_role?.name)}
          tabIndex={-1}
        >
          {isAdministrator(userLogged?.data?.user_role?.name) && (
            <TableCell padding="checkbox">
              {userLogged?.data?.id !== row.id && (
                <Checkbox id={row.id} checked={selected} onChange={onSelectRow} />
              )}
            </TableCell>
          )}

          <TableCell sx={{ cursor: 'pointer' }}>
            <Stack spacing={2} direction="row" alignItems="center">
              <Avatar alt={row.username} src={currentUrl || undefined} />
              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                <Link color="inherit" onClick={quickEdit.onTrue} sx={{ cursor: 'pointer' }}>
                  {row.username}
                </Link>
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  Email: {row.email}
                </Box>
              </Stack>
            </Stack>
          </TableCell>

          <TableCell sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={quickEdit.onTrue}>
            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              {row.companyName}
              <Box component="span" sx={{ color: 'text.disabled' }}>
                Full Name: {row.firstName} {row.lastName}
              </Box>
            </Stack>
          </TableCell>

          <TableCell
            sx={{ whiteSpace: 'nowrap', cursor: 'pointer', justifyContent: 'center' }}
            onClick={quickEdit.onTrue}
            align="center"
          >
            {row.totalAvailablePoints > 0 ? (
              <Label color="success" sx={{ alignItems: 'center' }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {row.totalAvailablePoints || 0}
              </Label>
            ) : (
              <Label color="error">0</Label>
            )}
          </TableCell>

          <TableCell
            sx={{ whiteSpace: 'nowrap', cursor: 'pointer', justifyContent: 'center' }}
            onClick={quickEdit.onTrue}
            align="center"
          >
            <Label color={row.isSyncWithZoho ? 'success' : 'error'} sx={{ alignItems: 'center' }}>
              {row?.isSyncWithZoho ? (
                <Iconify icon="fontisto:checkbox-active" sx={{ mr: 0.5 }} />
              ) : (
                <Iconify icon="material-symbols:tab-close-inactive" sx={{ mr: 0.5 }} />
              )}
            </Label>
          </TableCell>

          <TableCell
            sx={{ whiteSpace: 'nowrap', cursor: 'pointer', justifyContent: 'center' }}
            onClick={quickEdit.onTrue}
            align="center"
          >
            <Label color={row.isApproved ? 'success' : 'error'} sx={{ alignItems: 'center' }}>
              {row?.isApproved ? (
                <Iconify icon="fontisto:checkbox-active" sx={{ mr: 0.5 }} />
              ) : (
                <Iconify icon="material-symbols:tab-close-inactive" sx={{ mr: 0.5 }} />
              )}
            </Label>
          </TableCell>

          <TableCell>
            <Stack direction="row" alignItems="center">
              <Box
                rowGap={0}
                columnGap={0}
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(3, 1fr)',
                  sm: 'repeat(3, 1fr)',
                }}
              >
                <Tooltip title={row.isApproved ? 'Unapprove' : 'Approve'} placement="top" arrow>
                  <IconButton
                    color={confirmApproval.value ? 'inherit' : 'default'}
                    onClick={confirmApproval.onTrue}
                  >
                    <Iconify
                      icon={row.isApproved ? 'line-md:close-circle-twotone' : 'mdi:approve'}
                    />
                  </IconButton>
                </Tooltip>
                {isAdministrator(userLogged?.data?.user_role?.name) && (
                  <React.Fragment key='options-admin'>
                    <Tooltip title="Change Password" placement="top" arrow>
                      <IconButton
                        color={quickChangePassword.value ? 'inherit' : 'default'}
                        onClick={quickChangePassword.onTrue}
                      >
                        <Iconify icon="mdi:password-reset" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Quick Edit" placement="top" arrow>
                      <IconButton
                        color={quickEdit.value ? 'inherit' : 'default'}
                        onClick={quickEdit.onTrue}
                      >
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                    </Tooltip>
                  </React.Fragment>
                )}
              </Box>

              <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
            </Stack>
          </TableCell>
        </TableRow>
      ) : (
        <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
          <TableCell padding="checkbox">
            <Checkbox id={row.id} checked={selected} onChange={onSelectRow} />
          </TableCell>

          <TableCell sx={{ cursor: 'pointer' }}>
            <Stack spacing={0} direction="column" alignItems="left">
              <Stack spacing={2} direction="row" alignItems="left">
                <Avatar alt={row.username} src={currentUrl || undefined} />
                <Stack sx={{ typography: 'body2', flex: '0 0 auto', alignItems: 'flex-start' }}>
                  <Link color="inherit" onClick={quickEdit.onTrue} sx={{ cursor: 'pointer' }}>
                    {row.username}
                  </Link>
                  <Box component="span" sx={{ color: 'text.disabled' }}>
                    Email: {row.email}
                  </Box>
                </Stack>
              </Stack>

              <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center">
                <Stack spacing={0} direction="column" alignItems="left">
                  <Typography variant="body2">
                    Company: <b>{row.companyName}</b>
                  </Typography>
                  <Typography variant="body2">
                    Name: <b>{row.firstName} {row.lastName}</b>
                  </Typography>
                  <Typography variant="body2">
                    Phone: <b>{row.phoneNumber}</b>
                  </Typography>
                  <Typography variant="body2">
                    Reward Points:{' '}
                    {row.totalAvailablePoints > 0 ? (
                      <Label color="success">
                        <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                        {row.totalAvailablePoints || 0}
                      </Label>
                    ) : (
                      <Label color="error">0</Label>
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                    <Typography variant="body2">
                      Approved:{' '}
                      <Label color={row.isApproved ? 'success' : 'error'} sx={{ alignItems: 'center' }}>
                        {row?.isApproved ? (
                          <Iconify icon="fontisto:checkbox-active" sx={{ mr: 0.5 }} />
                        ) : (
                          <Iconify icon="material-symbols:tab-close-inactive" sx={{ mr: 0.5 }} />
                        )}
                      </Label>
                    </Typography>
                  </Box>
                  <Typography variant="body2">Created: <b>{fDateTime(row.createdTime)}</b></Typography>
                  <Typography variant="body2">Updated: <b>{fDateTime(row.lastModifiedTime)}</b></Typography>
                </Stack>
                <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              </Stack>
            </Stack>
          </TableCell>
        </TableRow>
      )}

      {/* Modales */}
      <UserQuickEditForm
        currentUser={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
        onProfileRow={() => onProfileRow(row.id)}
      />

      <UserQuickChangePasswordForm
        currentUser={row}
        open={quickChangePassword.value}
        onClose={quickChangePassword.onFalse}
      />

      <UserManagePointsModalForm
        currentUser={row}
        open={confirmManagePoints.value}
        onClose={confirmManagePoints.onFalse}
      />

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={() => onProfileRow(row.id)}>
            <Iconify icon="carbon:user-profile" sx={{ fontWeight: 'bold' }} />
            View rewards profile
          </MenuItem>

          <MenuItem
            onClick={() => {
              confirmApproval.onTrue();
              popover.onClose();
            }}
          >
            <Iconify icon={row.isApproved ? 'line-md:close-circle-twotone' : 'mdi:approve'} />
            {row.isApproved ? 'Unapprove' : 'Approve'}
          </MenuItem>

          {isAdministrator(userLogged?.data?.user_role?.name) && (
            <React.Fragment key='admin-actions-user-client'>
              <MenuItem
                onClick={async () => {
                  popover.onClose();
                  await onRefetchRow(); // el padre ya recibe row.id al crear el handler
                }}
                sx={{ fontWeight: 'bold' }}
              >
                <Iconify icon="codicon:repo-fetch" sx={{ fontWeight: 'bold' }} />
                Refetch reward points
              </MenuItem>

              <MenuItem
                onClick={() => {
                  confirmManagePoints.onTrue();
                  popover.onClose();
                }}
                sx={{ fontWeight: 'bold' }}
              >
                <Iconify icon="streamline-ultimate:reward-stars-2-bold" sx={{ fontWeight: 'bold' }} />
                Manage reward points
              </MenuItem>

              <MenuItem
                onClick={() => {
                  quickEdit.onTrue();
                  popover.onClose();
                }}
              >
                <Iconify icon="solar:pen-bold" />
                Edit
              </MenuItem>

              <MenuItem
                onClick={() => {
                  quickChangePassword.onTrue();
                  popover.onClose();
                }}
              >
                <Iconify icon="mdi:password-reset" />
                Change password
              </MenuItem>

              {userLogged?.data?.username !== row.username && (
                <MenuItem
                  onClick={() => {
                    confirm.onTrue();
                    popover.onClose();
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                  Delete
                </MenuItem>
              )}
            </React.Fragment>
          )}
        </MenuList>
      </CustomPopover >

      <ConfirmDialog
        maxWidth="md"
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete User"
        content={
          <ListItemText
            primary={`Do you want to delete this user (${row.firstName} ${row.lastName}, username: ${row.username}) ?`}
            secondary="Once you delete this user, you can't recover it."
          />
        }
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        maxWidth="md"
        open={confirmApproval.value}
        onClose={confirmApproval.onFalse}
        title={row.isApproved ? 'Unapprove User' : 'Approve User'}
        content={
          <ListItemText
            primary={`Do you want to ${row.isApproved ? 'unapprove' : 'approve'} this user (${row.firstName} ${row.lastName}, username: ${row.username}) ?`}
            secondary={`Company: ${row.companyName}, Email: ${row.email}`}
          />
        }
        action={
          <Button
            variant="contained"
            color={row.isApproved ? 'warning' : 'primary'}
            onClick={async () => {
              await onApprovalRow(row.id);
              confirmApproval.onFalse();
            }}
          >
            {row.isApproved ? 'Unapprove' : 'Approve'}
          </Button>
        }
      />

      <ConfirmDialog
        maxWidth="md"
        open={confirmVerify.value}
        onClose={confirmVerify.onFalse}
        title={row.isVerified ? 'Unverify User' : 'Verify User'}
        content={
          <ListItemText
            primary={`Do you want to ${row.isVerified ? 'unverify' : 'verify'} this user (${row.firstName} ${row.lastName}, username: ${row.username}) ?`}
            secondary={`Company: ${row.companyName}, Email: ${row.email}`}
          />
        }
        action={
          <Button
            variant="contained"
            color={row.isVerified ? 'warning' : 'primary'}
            onClick={async () => {
              await onVerifyRow(row.id);
              confirmVerify.onFalse();
            }}
          >
            {row.isVerified ? 'Unverify' : 'Verify'}
          </Button>
        }
      />

      <ConfirmDialog
        maxWidth="md"
        open={confirmActive.value}
        onClose={confirmActive.onFalse}
        title={row.isActive ? 'Set User Inactive' : 'Set User Active'}
        content={
          <ListItemText
            primary={`Do you want to ${row.isActive ? 'set inactive' : 'set active'} this user (${row.firstName} ${row.lastName}, username: ${row.username}) ?`}
            secondary={`Company: ${row.companyName}, Email: ${row.email}`}
          />
        }
        action={
          <Button
            variant="contained"
            color={row.isActive ? 'warning' : 'primary'}
            onClick={async () => {
              await onActiveRow(row.id);
              confirmActive.onFalse();
            }}
          >
            {row.isActive ? 'Set Inactive' : 'Set Active'}
          </Button>
        }
      />
    </>
  );
}

const areEqualRowProps = (prevProps, nextProps) => {
  const a = prevProps.row || {};
  const b = nextProps.row || {};

  if (prevProps.selected !== nextProps.selected) return false;
  if (a.id !== b.id) return false;
  if (a.totalAvailablePoints !== b.totalAvailablePoints) return false;
  if (a.isApproved !== b.isApproved) return false;
  if (a.isVerified !== b.isVerified) return false;
  if (a.isActive !== b.isActive) return false;
  if (a.isSyncWithZoho !== b.isSyncWithZoho) return false;
  if (a.avatarUrl !== b.avatarUrl) return false;
  if (a.keyAvatar !== b.keyAvatar) return false;

  return true;
};

export const UserClientTableRow = React.memo(RowComponent, areEqualRowProps);
