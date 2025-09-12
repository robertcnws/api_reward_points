import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { Stack, TextField, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints, axiosInstanceBackend } from 'src/utils/axios';
import { fieldsRewardStoreProductSelectionBuys } from 'src/auth/context/data/field-descriptors/field-descriptors-reward-store-product-selection';
import { useRewardStoreProductSelectionBuyById } from 'src/_mock/__reward-store-product-selection-buys';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { LoadingContext } from 'src/auth/context/loading-context';

import { generateRedeemedReport } from 'src/utils/generate-redeemed-report-pdf';

import { PurchaseDetailsModalTemplate } from './purchase-details-modal-template';


// ----------------------------------------------------------------------

export function PurchaseUseModalForm({ currentBuy, open, openDetails }) {

  const [actualBuy, setActualBuy] = useState(currentBuy);

  useEffect(() => {
    setActualBuy(currentBuy);
  }, [currentBuy]);

  const { refetch: refetchUpdatedBuy } = useRewardStoreProductSelectionBuyById(
    actualBuy?.id,
    fieldsRewardStoreProductSelectionBuys
  );

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => userLogged?.data?.user_role?.name || '', [userLogged]);

  const { isMobile } = useContext(LoadingContext);

  const productName = useMemo(() => actualBuy?.storeProductSelection?.storeProduct?.name || '', [actualBuy]);

  const userFullName = useMemo(() => {
    const user = actualBuy?.storeProductSelection?.user;
    return user ? `${user.firstName} ${user.lastName}` : 'N/A';
  }, [actualBuy]);

  const assignedPoints = useMemo(() => actualBuy?.storeProductSelection?.storeProduct?.assignedPoints || 0,
    [actualBuy]
  );

  const quantity = useMemo(() => actualBuy?.storeProductSelection?.quantity || 0,
    [actualBuy]
  );

  const totalPoints = useMemo(() => assignedPoints * quantity,
    [assignedPoints, quantity]
  );

  const available = useMemo(() => {
    const used = actualBuy?.quantityUsed || 0;
    return quantity - used;
  }, [quantity, actualBuy]);

  const isUsed = useMemo(
    () => (actualBuy?.hasBeenUsed && actualBuy?.quantityUsed === quantity) || false,
    [actualBuy, quantity]
  );

  const isPartiallyUsed = useMemo(
    () => actualBuy?.hasBeenUsed && actualBuy?.quantityUsed > 0 && actualBuy?.quantityUsed < quantity,
    [actualBuy, quantity]
  );

  const [quantityUsed, setQuantityUsed] = useState(1);

  const [notes, setNotes] = useState(actualBuy?.notes || '');

  const confirmUse = useBoolean();

  const confirmSuccess = useBoolean();

  useEffect(() => {
    if (open.value) {
      setNotes(actualBuy?.notes ?? '');
    }
  }, [open.value, actualBuy?.notes]);

  const handleUsePurchase = useCallback(
    async (id) => {
      try {
        await axiosInstanceBackend.post(endpoints.rewardPoints.manageUse.storeProductSelectionBuy.item(id), {
          userReporter: JSON.stringify(userLogged?.data),
          quantityUsed,
          notes,
        });
        const res = await refetchUpdatedBuy?.();
        const fresh = res?.data ?? null;
        if (fresh) {
          setActualBuy(fresh?.rewardStoreProductSelectionBuyById);
          return fresh;
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response.data.error);
        return null;
      }
      return null;
    },
    [userLogged?.data, quantityUsed, notes, refetchUpdatedBuy]
  );

  const handleNavigateClient = () => {
    const userId = actualBuy?.storeProductSelection?.user?.id;
    if (userId) {
      const userPath = paths.dashboard.purchase.client(userId);
      router.openNew(userPath);
    } else {
      toast.error('User not found');
    }
  };

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="lg"
        open={open.value}
        onClose={() => open.onFalse()}
        PaperProps={{ sx: { maxWidth: 820 } }}
      >
        <DialogTitle>
          Using Redeemed Order
          {actualBuy?.hasRequestedRefund && (
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
          <PurchaseDetailsModalTemplate
            currentBuy={actualBuy}
            isMobile={isMobile}
            assignedPoints={assignedPoints}
            quantity={quantity}
            totalPoints={totalPoints}
            roleName={roleName}
            handleNavigateClient={handleNavigateClient}
          />
          {/* <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-start', mb: 2 }}>
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
          </Stack> */}
          {!isUsed && (
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-start', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1, mt: 1 }}>
                NOTES:
              </Typography>

              <TextField
                name="notes"
                value={notes || ''}
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
                disabled={isUsed}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          {!isUsed && (
            <Button
              variant="contained"
              disabled={quantityUsed <= 0 || quantityUsed > available}
              onClick={() => confirmUse.onTrue()}
            >
              Checkout!
            </Button>
          )}
          {isUsed && (
            <Button
              variant="contained"
              onClick={() => generateRedeemedReport({ actualBuy })}
            >
              See Report
            </Button>
          )}
          <Button variant="outlined" onClick={() => {
            open?.onFalse();
            openDetails?.onTrue();
          }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmUse.value}
        onClose={confirmUse.onFalse}
        title="Confirmation"
        content={
          <>
            Are you sure want to use this order <strong> {productName} </strong> with quantity <strong> {quantityUsed} </strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={async () => {
              const fresh = await handleUsePurchase(actualBuy?.id);
              if (fresh) {
                generateRedeemedReport({ currentBuy: fresh?.rewardStoreProductSelectionBuyById });
              } else {
                generateRedeemedReport({ currentBuy: actualBuy });
              }
              confirmUse?.onFalse();
              open?.onFalse();
              openDetails?.onFalse();
              confirmSuccess?.onTrue();
            }}
          >
            Confirm
          </Button>
        }
      />
      <ConfirmDialog
        open={confirmSuccess.value}
        onClose={confirmSuccess.onFalse}
        title="Success"
        content={
          <>
            You have successfully used the order <strong> {productName} </strong> with quantity <strong> {quantityUsed} </strong>.
          </>
        }
      />
    </>
  );
}
