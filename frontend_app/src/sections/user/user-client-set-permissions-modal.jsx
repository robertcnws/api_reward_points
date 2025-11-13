import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { Label } from 'src/components/label';
import { useDataContext } from 'src/auth/context/data/data-context';
import { axiosInstanceBackend, endpoints } from 'src/utils/axios';
import { useRewardClientById } from 'src/_mock/__reward-clients';
import { fieldsClients } from 'src/auth/context/data/field-descriptors/field-descriptors-clients';
import { LoadingButton } from '@mui/lab';

const normId = (v) => (v == null ? '' : String(v));

export function UserClientSetPermissionsModal({ open, client, onAfterSave }) {
  const { loadedCustomerportalPermissions, loadingCustomerportalPermissions } = useDataContext();

  const { data: clientById } = useRewardClientById(open.value ? client?.id : null, fieldsClients);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const currentPermissions = useMemo(
    () =>
      Array.isArray(clientById?.customerportalPermissions)
        ? clientById.customerportalPermissions.map((p) => normId(p.id))
        : [],
    [clientById]
  );

  const currentPermissionsKey = useMemo(
    () => (currentPermissions.length ? currentPermissions.join(',') : ''),
    [currentPermissions]
  );

  const [selectedIds, setSelectedIds] = useState([]);

  const initializedForClient = useRef(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open.value || !client?.id || !currentPermissionsKey) return;
    if (initializedForClient.current !== client.id) {
      initializedForClient.current = client.id;
      setSelectedIds(currentPermissions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open.value, client?.id, currentPermissionsKey]);

  const mergedPermissions = useMemo(() => {
    const sel = new Set(selectedIds.map(normId));
    const list = Array.isArray(loadedCustomerportalPermissions) ? loadedCustomerportalPermissions : [];
    return list.map((permission) => {
      const pid = normId(permission.id);
      return { ...permission, id: pid, assigned: sel.has(pid) };
    });
  }, [loadedCustomerportalPermissions, selectedIds]);

  const handleToggle = (id) => {
    const sId = normId(id);
    setSelectedIds((prev) => (prev.includes(sId) ? prev.filter((x) => x !== sId) : [...prev, sId]));
  };

  const handleSave = useCallback(async () => {
    try {
      setLoading(true);
      const payload = { permissions: selectedIds, userReporter: userLogged?.data };
      await axiosInstanceBackend.post(endpoints.user.setPermissions(client.id), payload);
      if (typeof onAfterSave === 'function') {
        await onAfterSave([...selectedIds]);
      }
    } catch (error) {
      console.error('Failed to save permissions:', error);
    } finally {
      setLoading(false);
      initializedForClient.current = null;
      open.onFalse();
    }
  }, [selectedIds, client?.id, userLogged?.data, open, onAfterSave]);

  const handleClose = () => {
    initializedForClient.current = null;
    setSelectedIds([]);
    open.onFalse();
  };

  return (
    <Dialog open={open.value} onClose={!loading ? handleClose : undefined} PaperProps={{ sx: { width: 700 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', mr: 2 }}>
          Set Permissions for {client?.firstName} {client?.lastName}
          <Typography variant="body2" sx={{ mt: 0, color: 'text.secondary' }}>
            Current Permissions: {mergedPermissions.filter((p) => p.assigned).length}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loadingCustomerportalPermissions ? (
          <Typography variant="body2" sx={{ py: 0, textAlign: 'center' }}>
            Loading...
          </Typography>
        ) : mergedPermissions.length > 0 ? (
          <Box sx={{ maxHeight: 420, overflowY: 'auto', pr: 1 }}>
            <List disablePadding>
              {mergedPermissions.map((permission) => {
                const checked = permission.assigned;
                return (
                  <ListItem
                    key={permission.id}
                    divider
                    secondaryAction={
                      <Label color={checked ? 'success' : 'default'}>
                        {checked ? 'Assigned' : 'Not assigned'}
                      </Label>
                    }
                    sx={{
                      '& .MuiListItemSecondaryAction-root': { right: 8 },
                      cursor: 'pointer',
                    }}
                    onClick={() => handleToggle(permission.id)}
                  >
                    <Checkbox
                      edge="start"
                      checked={checked}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggle(permission.id)}
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ 'aria-label': permission.name }}
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      primary={permission.name}
                      secondary={
                        permission.description ? (
                          <span dangerouslySetInnerHTML={{ __html: permission.description }} />
                        ) : (
                          'No description'
                        )
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ py: 3, textAlign: 'center' }}>
            No permissions found.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={loading}
          sx={{ bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}
        >
          Save
        </LoadingButton>
        <Button variant="outlined" onClick={!loading ? handleClose : undefined}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
