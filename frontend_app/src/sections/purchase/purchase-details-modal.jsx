import axios from 'axios';
import { z as zod } from 'zod';
import { useContext, useMemo } from 'react';
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
import { isClient } from 'src/utils/check-permissions';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';
import { LoadingContext } from 'src/auth/context/loading-context';
import { Card, Divider, IconButton, Stack, TextField, Typography } from '@mui/material';
import { useBoolean } from 'src/hooks/use-boolean';
import { fNumber } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';
import { fDate, fDateTime } from 'src/utils/format-time';
import { StoreProductDetailsCarousel } from '../store-product/store-product-details-carousel';
import { PurchaseDetailsModalTemplate } from './purchase-details-modal-template';



// ----------------------------------------------------------------------

export function PurchaseDetailsModal({ currentBuy, open, openUse }) {

  const router = useRouter();

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const roleName = useMemo(() => userLogged?.data?.user_role?.name || '', [userLogged]);

  const { isMobile } = useContext(LoadingContext);

  const assignedPoints = useMemo(() => currentBuy?.storeProductSelection?.storeProduct?.assignedPoints || 0,
    [currentBuy]
  );

  const quantity = useMemo(() => currentBuy?.storeProductSelection?.quantity || 0,
    [currentBuy]
  );

  const totalPoints = useMemo(() => assignedPoints * quantity,
    [assignedPoints, quantity]
  );

  const handleNavigateClient = () => {
    const userId = currentBuy?.storeProductSelection?.user?.id;
    if (userId) {
      const userPath = paths.dashboard.purchase.client(userId);
      router.openNew(userPath);
    } else {
      toast.error('User not found');
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open.value}
      onClose={() => open.onFalse()}
      PaperProps={{ sx: { maxWidth: 820 } }}
    >
      <DialogTitle>
        {/* Redeemed Order of {currentBuy?.storeProductSelection?.storeProduct?.name} */}
        Redeemed Order Checkout
        {currentBuy?.hasRequestedRefund && (
          <Label color="secondary" sx={{ ml: 1, mt: -3, display: 'inline-flex', alignItems: 'center' }}>
            Refund Requested
          </Label>
        )}
        {currentBuy?.hasBeenUsed && (
          <Label color="error" sx={{ ml: 1, mt: -3, display: 'inline-flex', alignItems: 'center' }}>
            Already Used!
          </Label>
        )}
        {!currentBuy?.storeProductSelection?.storeProduct?.isActive && (
          <Label color="warning" sx={{ ml: 1, mt: -3, display: 'inline-flex', alignItems: 'center' }}>
            Inactive
          </Label>
        )}
      </DialogTitle>

      <DialogContent>
        <PurchaseDetailsModalTemplate 
          currentBuy={currentBuy} 
          isMobile={isMobile}
          assignedPoints={assignedPoints}
          quantity={quantity}
          totalPoints={totalPoints}
          roleName={roleName}
          handleNavigateClient={handleNavigateClient}
        />
      </DialogContent>

      <DialogActions>
        {(!isClient(roleName) &&
          !currentBuy?.hasBeenUsed
          && !currentBuy?.hasRequestedRefund
          // && currentBuy?.storeProductSelection?.storeProduct?.isActive
        ) && (
            <Button variant="contained" onClick={() => {
              openUse.onTrue();
              open.onFalse();
            }}>
              Proceed
            </Button>
          )}
        <Button variant="outlined" onClick={() => open.onFalse()}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
