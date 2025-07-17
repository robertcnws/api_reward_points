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

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useDataContext } from 'src/auth/context/data/data-context';
import { LoadingContext } from 'src/auth/context/loading-context';
import { Divider, Stack, TextField, Typography } from '@mui/material';
import { useBoolean } from 'src/hooks/use-boolean';
import { fNumber } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';
import { fDate, fDateTime } from 'src/utils/format-time';
import { StoreProductDetailsCarousel } from '../store-product/store-product-details-carousel';

// ----------------------------------------------------------------------

export function PurchaseDetailsModal({ currentBuy, open, openUse }) {

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

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open.value}
      onClose={() => open.onFalse()}
      PaperProps={{ sx: { maxWidth: 820 } }}
    >
      <DialogTitle>
        Purchase of {currentBuy?.storeProductSelection?.storeProduct?.name}
        {currentBuy?.hasRequestedRefund && (
          <Label color="secondary" sx={{ ml: 1, mt: -3, display: 'inline-flex', alignItems: 'center' }}>
            Refund Requested
          </Label>
        )}
        {!currentBuy?.storeProductSelection?.storeProduct?.isActive && (
          <Label color="warning" sx={{ ml: 1, mt: -3, display: 'inline-flex', alignItems: 'center' }}>
            Inactive
          </Label>
        )}
      </DialogTitle>

      <DialogContent>
        <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
          Client: <b>{currentBuy?.storeProductSelection?.user?.firstName} {currentBuy?.storeProductSelection?.user?.lastName}</b>
          <Typography variant="subtitle2" sx={{ mt: 0.5, fontSize: 11 }}>
            <b>Created at:</b> {fDateTime(currentBuy?.createdTime) || 'N/A'}<br />
          </Typography>
        </Alert>

        <Box sx={{
          display: 'flex',
          flexDirection: !isMobile ? 'row' : 'column',
          alignItems: 'center',
          mb: 2,
          gap: 2,
          width: '100%',
        }}>

          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: '100%',
            p: 0,

          }}>
            <StoreProductDetailsCarousel
              images={currentBuy?.storeProductSelection?.storeProduct?.attachments}
              predefinedSize={
                currentBuy?.storeProductSelection?.storeProduct?.attachments?.length > 2 ? 130 :
                  currentBuy?.storeProductSelection?.storeProduct?.attachments?.length > 1 ? 200 : null
              }
            />
          </Box>

          <Box
            rowGap={1}
            columnGap={1}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(1, 1fr)'
            }}
            ml={{ xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }}
            mr={{ xs: 0, sm: 0, md: 0, lg: 0, xl: 0 }}
            width={{ xs: '100%', sm: '100%', md: '100%', lg: '100%', xl: '100%' }}
          >

            <Box
              display="flex"
              flexDirection='row'
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
            >
              <Label color="default" sx={{ width: '100%' }}>
                <b>CONFIRMATION #:</b>
              </Label>
              <Typography variant="subtitle2" sx={{ width: '100%', fontFamily: 'monospace', fontSize: 17 }}>
                {currentBuy?.confirmationNumber || 'N/A'}
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection='row'
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
            >
              <Label color="default" sx={{ width: '100%' }}>
                <b>Order #:</b>
              </Label>
              <Typography variant="subtitle2" sx={{ width: '100%' }}>
                {`No. ${currentBuy?.orderNumber || 'N/A'}`}
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection='row'
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
            >
              <Label color="default" sx={{ width: '100%' }}>
                <b>Product:</b>
              </Label>
              <Typography variant="subtitle2" sx={{ width: '100%' }}>
                {currentBuy?.storeProductSelection?.storeProduct?.name}
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection='row'
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
            >
              <Label color="default" sx={{ width: '100%' }}>
                <b>Used Quantity:</b>
              </Label>
              <Typography variant="subtitle2" sx={{ width: '100%' }}>
                {currentBuy?.quantityUsed > 0 ? `x${currentBuy?.quantityUsed}` : '0'}
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection='row'
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
            >
              <Label color="default" sx={{ width: '48.5%' }}>
                <b>Status:</b>
              </Label>
              <Label
                variant="soft"
                color={
                  (currentBuy?.hasBeenUsed && currentBuy?.quantityUsed === quantity && 'error') ||
                  (currentBuy?.hasBeenUsed && currentBuy?.quantityUsed !== 0 && currentBuy?.quantityUsed < quantity && 'warning') ||
                  (!currentBuy?.hasBeenUsed && 'info') ||
                  'default'
                }
                sx={{ width: 'auto' }}
              >
                {
                  (currentBuy?.hasBeenUsed && currentBuy?.quantityUsed === quantity) ? 'Used' :
                    (currentBuy?.hasBeenUsed && currentBuy?.quantityUsed !== 0 && currentBuy?.quantityUsed < quantity) ? 'Partially Used' :
                      'Not Used'
                }
              </Label>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box
              display="flex"
              flexDirection='row'
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
            >
              <Label color="default" sx={{ width: '50%' }}>
                <b>Assigned Points:</b>
              </Label>
              <Label color="success" sx={{
                display: 'inline-flex',
                px: 1,
                width: 'auto',
                justifyContent: 'flex-start',
              }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {fNumber(assignedPoints) || 0}
              </Label>
            </Box>
            <Box
              display="flex"
              flexDirection='row'
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
            >
              <Label color="default" sx={{ width: '54%' }}>
                <b>Total Quantity:</b>
              </Label>
              <Typography
                variant="subtitle2"
                sx={{
                  display: 'inline-flex',
                  px: 1,
                  width: '50%'
                }}>
                x{quantity || 0}
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection='row'
              justifyContent="flex-start"
              alignItems="flex-start"
              sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
            >
              <Label color="default" sx={{ width: '50%' }}>
                <b>TOTAL Points:</b>
              </Label>
              <Label color="info" sx={{ width: 'auto' }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {fNumber(totalPoints) || 0}
              </Label>
            </Box>
          </Box>
        </Box>
        {isClient(roleName) && currentBuy?.notes && currentBuy?.notes !== '' && (
          <Box
            display="flex"
            flexDirection='row'
            justifyContent="flex-start"
            alignItems="flex-start"
            sx={{ width: '100%', gap: !isMobile ? 3 : 1 }}
          >
            <Label color="default" sx={{ width: '50%' }}>
              <b>Notes:</b>
            </Label>
            <TextField
              value={currentBuy?.notes || ''}
              variant="outlined"
              size="small"
              fullWidth
              multiline
              rows={3}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1 }}>
                    <Iconify icon="mdi:note-text-outline" width={20} height={20} color='text.disabled' />
                  </Box>
                ),
                inputProps: {
                  sx: {
                    fontSize: 12,
                    color: 'text.secondary',
                  },
                },
              }}
              sx={{ flexGrow: 1, width: '50%' }}
              disabled
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {(!isClient(roleName) &&
          !currentBuy.hasRequestedRefund &&
          currentBuy.storeProductSelection?.storeProduct?.isActive) && (
            <Button variant="contained" onClick={() => {
              openUse.onTrue();
              open.onFalse();
            }}>
              Use Purchase
            </Button>
          )}
        <Button variant="outlined" onClick={() => open.onFalse()}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
