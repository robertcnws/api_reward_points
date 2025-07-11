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



// ----------------------------------------------------------------------

export function PurchaseUseModalForm({ currentBuy, open }) {

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const { isMobile } = useContext(LoadingContext);

  const productName = useMemo(() => currentBuy?.storeProductSelection?.storeProduct?.name || '', [currentBuy]);

  const userFullName = useMemo(() => {
    const user = currentBuy?.storeProductSelection?.user;
    return user ? `${user.firstName} ${user.lastName}` : 'N/A';
  }, [currentBuy]);

  const assignedPoints = useMemo(() => currentBuy?.storeProductSelection?.storeProduct?.assignedPoints || 0,
    [currentBuy]
  );

  const quantity = useMemo(() => currentBuy?.storeProductSelection?.quantity || 0,
    [currentBuy]
  );

  const totalPoints = useMemo(() => assignedPoints * quantity,
    [assignedPoints, quantity]
  );

  const available = useMemo(() => {
    const used = currentBuy?.quantityUsed || 0;
    return quantity - used;
  }, [quantity, currentBuy]);

  const isUsed = useMemo(
    () => (currentBuy?.hasBeenUsed && currentBuy?.quantityUsed === quantity) || false,
    [currentBuy, quantity]
  );

  const isPartiallyUsed = useMemo(
    () => currentBuy?.hasBeenUsed && currentBuy?.quantityUsed > 0 && currentBuy?.quantityUsed < quantity,
    [currentBuy, quantity]
  );

  const [quantityUsed, setQuantityUsed] = useState(1);

  const [notes, setNotes] = useState('');

  const confirmUse = useBoolean();

  useEffect(() => {
    if (currentBuy) {
      setNotes(currentBuy.notes || '');
    }
  }, [currentBuy]);

  const handleUsePurchase = useCallback(
    async (id) => {
      try {
        await axios.post(`${CONFIG.apiUrl}/reward-points/manage-use/store-product-selection-buy/${id}/`, {
          userReporter: JSON.stringify(userLogged?.data),
          quantityUsed,
          notes,
        });
        toast.success('Delete success!');
      } catch (error) {
        console.error(error);
        toast.error(error.response.data.error);
      }
    },
    [userLogged?.data, quantityUsed, notes]
  );

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="lg"
        open={open.value}
        onClose={() => open.onFalse()}
        PaperProps={{ sx: { maxWidth: 620 } }}
      >
        <DialogTitle>
          Use purchase of {productName}
          {currentBuy?.hasRequestedRefund && (
            <Label color="secondary" sx={{ ml: 1, mt: -3, display: 'inline-flex', alignItems: 'center' }}>
              Refund Requested
            </Label>
          )}
          {isUsed && (
            <Label color="error" sx={{ ml: 1, mt: -3, display: 'inline-flex', alignItems: 'center' }}>
              Already Used
            </Label>
          )}
          {isPartiallyUsed && (
            <Label color="warning" sx={{ ml: 1, mt: -3, display: 'inline-flex', alignItems: 'center' }}>
              Partially Used
            </Label>
          )}
        </DialogTitle>

        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            Client: <b>{userFullName}</b>
            <Typography variant="subtitle2" sx={{ mt: 0.5, fontSize: 11 }}>
              <b>Created at:</b> {fDateTime(currentBuy?.createdTime) || 'N/A'}<br />
              <b>Modified at:</b> {fDateTime(currentBuy?.lastModifiedTime) || 'N/A'}<br />
            </Typography>
          </Alert>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1, mt: 1 }}>
              Quantity to use:
            </Typography>

            <Stack spacing={1}>
              <IncrementerButton
                name="quantityUsed"
                quantity={quantityUsed}
                disabledDecrease={quantityUsed <= 1}
                disabledIncrease={quantityUsed >= available}
                onIncrease={() => setQuantityUsed(quantityUsed + 1)}
                onDecrease={() => setQuantityUsed(quantityUsed - 1)}
              />

              <Typography variant="caption" component="div" sx={{ textAlign: 'right', color: 'error.main' }}>
                Available: <b>{available}</b>
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-start', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1, mt: 1 }}>
              Notes:
            </Typography>

            <TextField
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              multiline
              rows={3}
              placeholder="Optional notes for this usage"
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1 }}>
                    <Iconify icon="mdi:note-text-outline" width={20} height={20} color='text.disabled' />
                  </Box>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            disabled={quantityUsed <= 0 || quantityUsed > available}
            onClick={() => confirmUse.onTrue()}
          >
            Use this!
          </Button>
          <Button variant="outlined" onClick={() => open.onFalse()}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmUse.value}
        onClose={confirmUse.onFalse}
        title="Use Purchase Confirmation"
        content={
          <>
            Are you sure want to use this purchase <strong> {productName} </strong> with quantity <strong> {quantityUsed} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              handleUsePurchase(currentBuy.id);
              confirmUse.onFalse();
            }}
          >
            Use
          </Button>
        }
      />
    </>
  );
}
