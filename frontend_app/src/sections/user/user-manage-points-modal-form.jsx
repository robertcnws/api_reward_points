import axios from 'axios';
import { z as zod } from 'zod';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { CONFIG } from 'src/config-global';
import { USER_STATUS_OPTIONS } from 'src/_mock';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useDataContext } from 'src/auth/context/data/data-context';
import { LoadingContext } from 'src/auth/context/loading-context';
import { Divider, Stack, TextField, Typography } from '@mui/material';
import { useBoolean } from 'src/hooks/use-boolean';
import { fNumber } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';
import { fDate, fDateTime } from 'src/utils/format-time';
import { StoreProductDetailsCarousel } from '../store-product/store-product-details-carousel';
import { IncrementerButton } from '../items/components/incrementer-button';
import { IncrementerText } from '../items/components/incrementer-text';



// ----------------------------------------------------------------------

export function UserManagePointsModalForm({
  currentUser,
  currentRewardPoints,
  open,
  onClose
}) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const userFullName = useMemo(
    () => `${currentUser?.firstName} ${currentUser?.lastName}`,
    [currentUser]
  );

  const totalAvailablePoints = useMemo(() => currentRewardPoints?.totalAvailablePoints || 0,
    [currentRewardPoints]
  );

  const currentAssignedPoints = useMemo(() => totalAvailablePoints || 0,
    [totalAvailablePoints]
  );

  const [newAssignedPoints, setNewAssignedPoints] = useState(0);
  const [newSpentPoints, setNewSpentPoints] = useState(0);

  const confirmUse = useBoolean();

  const handleManagePoints = useCallback(
    async () => {
      try {
        await axios.post(`${CONFIG.apiUrl}/reward-points/manage-points/${currentUser?.id}/`, {
          userReporter: JSON.stringify(userLogged?.data),
          newAssignedPoints,
          newSpentPoints,
        });
        toast.success('Update points success!');
      } catch (error) {
        console.error(error);
        toast.error(error.response.data.error);
      }
    },
    [newAssignedPoints, newSpentPoints, currentUser, userLogged]
  );

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="lg"
        open={open}
        onClose={() => {
          setNewAssignedPoints(0);
          setNewSpentPoints(0);
          onClose();
        }}
        PaperProps={{ sx: { maxWidth: 620 } }}
      >
        <DialogTitle>
          Manage points for <b>{userFullName}</b>
        </DialogTitle>

        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            Client: <b>{userFullName}</b><br />
            Current Points: {currentAssignedPoints > 0 ? (
              <Label color="success" sx={{ alignItems: 'center' }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {currentAssignedPoints || 0}
              </Label>
            ) : (
              <Label color="error">
                0
              </Label>
            )}
          </Alert>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1, mt: 1 }}>
              Assign new points:
            </Typography>

            <Stack spacing={1}>
              <IncrementerText
                name="newAssignedPoints"
                quantity={newAssignedPoints}
                max={1000000}
                min={0}
                disabledDecrease={newAssignedPoints < 1}
                disabledIncrease={newAssignedPoints >= 1000000}
                onIncrease={() => setNewAssignedPoints(prev => prev + 1)}
                onDecrease={() => setNewAssignedPoints(prev => Math.max(0, prev - 1))}
                onChange={setNewAssignedPoints}
              />

              <Typography
                variant="caption"
                component="div"
                sx={{
                  textAlign: 'right',
                  color: 1000000 - newAssignedPoints < 0 ? 'error.main' : 'text.secondary'
                }}>
                Available: <b>{1000000 - newAssignedPoints}</b>
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1, mt: 1 }}>
              Substract new points:
            </Typography>

            <Stack spacing={1}>
              <IncrementerText
                name="newSpentPoints"
                quantity={newSpentPoints}
                max={currentAssignedPoints + newAssignedPoints}
                min={0}
                disabledDecrease={newSpentPoints < 1}
                disabledIncrease={newSpentPoints >= (currentAssignedPoints + newAssignedPoints)}
                onIncrease={() => setNewSpentPoints(prev => prev + 1)}
                onDecrease={() => setNewSpentPoints(prev => Math.max(0, prev - 1))}
                onChange={setNewSpentPoints}
              />

              <Typography
                variant="caption"
                component="div"
                sx={{
                  textAlign: 'right',
                  color: (currentAssignedPoints + newAssignedPoints) - newSpentPoints < 0 ? 'error.main' : 'text.secondary'
                }}>
                Available: <b>{(currentAssignedPoints + newAssignedPoints) - newSpentPoints}</b>
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            disabled={
              (newAssignedPoints <= 0 && newSpentPoints <= 0) ||
              newAssignedPoints > 1000000 ||
              newAssignedPoints + currentAssignedPoints > 1000000 ||
              newSpentPoints > (currentAssignedPoints + newAssignedPoints)
            }
            onClick={() => confirmUse.onTrue()}
          >
            Manage Points
          </Button>
          <Button variant="outlined" onClick={() => {
            setNewAssignedPoints(0);
            setNewSpentPoints(0);
            onClose();
          }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmUse.value}
        onClose={confirmUse.onFalse}
        title="Manage Points Confirmation"
        content={
          <>
            Are you sure want to <strong>manage points</strong> for this user <strong>
              {userFullName}
            </strong> with new assigned points <strong>
              {newAssignedPoints}
            </strong> and new substracted points <strong>
              {newSpentPoints}
            </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={async () => {
              await handleManagePoints();
              confirmUse.onFalse();
              setNewAssignedPoints(0);
              setNewSpentPoints(0);
              toast.success('Points managed successfully!');
              onClose();
            }}
          >
            Update
          </Button>
        }
      />
    </>
  );
}
