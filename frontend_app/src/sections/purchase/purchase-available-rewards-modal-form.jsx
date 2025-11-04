import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { useDataContext } from 'src/auth/context/data/data-context';
import { fNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export function PurchaseAvailableRewardsModalForm({
  open,
  client,
  totalAvailablePoints,
}) {
  const { loadedStoreProducts, loadingStoreProducts } = useDataContext();

  // Helpers de UI
  const renderPoints = (assignedPoints) => {
    if (assignedPoints > 0) {
      return (
        <Label color="success" sx={{ alignItems: 'center' }}>
          <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
          {assignedPoints}
        </Label>
      );
    }
    return <Label color="default">0</Label>;
  };

  const renderStatus = (product) => {
    const needMore = product?.assignedPoints > totalAvailablePoints;
    if (needMore) {
      return (
        <Label color="error">
          Need {fNumber(product.assignedPoints - totalAvailablePoints)} more
        </Label>
      );
    }
    if (!product?.isActive) {
      return <Label color="warning">Inactive</Label>;
    }
    return <Label color="info">Available</Label>;
  };

  return (
    <Dialog
      // fullWidth
      open={open.value}
      onClose={open.onFalse}
      PaperProps={{ sx: { width: 600 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', flexDirection: 'column', mr: 2 }}>
          Available Rewards for {client?.firstName} {client?.lastName}
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', mb: 0.75 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mr: 1 }}>
              Available Points:
            </Typography>
            {totalAvailablePoints > 0 ? (
              <Label color="success" sx={{ alignItems: 'center' }}>
                <Iconify icon="streamline-cyber-color:bookmark-favorite-star" sx={{ mr: 0.5 }} />
                {totalAvailablePoints}
              </Label>
            ) : (
              <Label color="error">0</Label>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>

        {/* Lista de rewards */}
        {totalAvailablePoints > 0 ? (
          <Box sx={{ mt: 1.25 }}>
            {loadingStoreProducts ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', px: 0.5 }}>
                Loading rewards...
              </Typography>
            ) : (
              <List
                dense
                sx={{
                  width: '100%',
                  bgcolor: 'transparent',
                  '& .MuiListItem-root': { py: 1.25 },
                }}
              >
                {(loadedStoreProducts || []).map((product, idx) => {
                  const pointsEl = renderPoints(product?.assignedPoints || 0);
                  const statusEl = renderStatus(product);

                  return (
                    <Box component="li" key={product?.id || idx} sx={{ listStyle: 'none' }}>
                      <ListItem
                        disableGutters
                        secondaryAction={
                          // Zona derecha: dos columnas fijas → simetría entre filas
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{
                              minWidth: { xs: 220, sm: 280 },
                              justifyContent: 'flex-end',
                            }}
                          >
                            <Box
                              sx={{
                                minWidth: { xs: 84, sm: 96 },
                                textAlign: 'center',
                              }}
                            >
                              {pointsEl}
                            </Box>
                            <Box
                              sx={{
                                minWidth: { xs: 120, sm: 160 },
                                textAlign: 'right',
                              }}
                            >
                              {statusEl}
                            </Box>
                          </Stack>
                        }
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, pr: { xs: 14, sm: 18 } }}
                              color={
                                !product?.isActive ? 
                                'text.disabled' : product?.assignedPoints > totalAvailablePoints ? 
                                'text.disabled' : 'text.primary'
                              }
                            >
                              {product?.name}
                            </Typography>
                          }
                        />
                      </ListItem>

                      {/* Separador entre filas */}
                      <Divider sx={{ my: 0.25 }} />
                    </Box>
                  );
                })}
              </List>
            )}
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={open.onFalse}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
