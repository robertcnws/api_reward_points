import React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardHeader from '@mui/material/CardHeader';
import { Grid, Table, TableRow, TableBody, TableCell, TableHead, TableContainer, TextareaAutosize, Typography } from '@mui/material';

import { fDate, fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';



// ----------------------------------------------------------------------

export function SalesOrderDetailsItems({ salesOrder, isMobile, invoices, isDashboardView }) {

  const renderTotal = (
    <Stack spacing={1} alignItems="flex-start" sx={{ p: 3, textAlign: 'left', typography: 'body2' }}>
      <Grid container spacing={2}>
        {salesOrder && salesOrder?.customerName && (
          <Grid container item xs={12}>
            <Grid item xs={3}>
              <Box sx={{ color: 'text.secondary' }}>Customer: </Box>
            </Grid>
            <Grid item xs={9}>
              <Box sx={{ typography: 'subtitle2' }}>
                <Label color="default">{salesOrder.customerName || '-'} </Label>
              </Box>
            </Grid>
          </Grid>
        )}
        {salesOrder && salesOrder?.salespersonName && (
          <Grid container item xs={12}>
            <Grid item xs={3}>
              <Box sx={{ color: 'text.secondary' }}>Sales Person: </Box>
            </Grid>
            <Grid item xs={9}>
              <Box sx={{ typography: 'subtitle2' }}>
                <Label color="default">{salesOrder.salespersonName || '-'} </Label>
              </Box>
            </Grid>
          </Grid>
        )}
        {salesOrder && salesOrder?.total && (
          <Grid container item xs={12}>
            <Grid item xs={3}>
              <Box sx={{ color: 'text.secondary' }}>Total Amount: </Box>
            </Grid>
            <Grid item xs={9}>
              <Box sx={{ typography: 'subtitle2' }}>
                <Label color="default"> $ {parseFloat(salesOrder.total).toFixed(2) || '0.00'} </Label>
              </Box>
            </Grid>
          </Grid>
        )}
        {salesOrder && salesOrder?.lineItems && (
          <Grid container item xs={12}>
            <Grid item xs={3}>
              <Box sx={{ color: 'text.secondary' }}>Items: </Box>
            </Grid>
            <Grid item xs={9}>
              <TableContainer sx={{ maxHeight: '330px' }}>
                <Table stickyHeader>
                  <TableHead>
                    {!isMobile ? (
                      <TableRow sx={{ p: 0 }}>
                        <TableCell>Item</TableCell>
                        <TableCell>Qty</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow sx={{ p: 0 }}>
                        <TableCell>INFO</TableCell>
                      </TableRow>
                    )}
                  </TableHead>
                  <TableBody>
                    {salesOrder?.lineItems.map((asset, index) => (
                      !isMobile ? (
                        <TableRow key={`${asset.lineItemId}-${index}-${asset.itemId}`}>
                          <TableCell>
                            {asset.description || asset.name || asset.groupName}
                          </TableCell>
                          <TableCell>
                            {asset.quantity}
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={`${asset.lineItemId}-${index}-${asset.itemId}`}>
                          <TableCell>
                            <TextareaAutosize
                              aria-label="minimum height"
                              minRows={3}
                              placeholder="Minimum 3 rows"
                              value={
                                `Item: ${asset.description || asset.name || asset.groupName}
                                    Qty: ${asset.quantity}`
                              }
                              style={{ width: '100%', fontSize: '0.75rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
        {invoices && invoices?.length > 0 && (
          <Grid container item xs={12}>
            <Grid item xs={3}>
              <Box sx={{ color: 'text.secondary' }}>Invoices: </Box>
            </Grid>
            <Grid item xs={9}>
              <TableContainer sx={{ maxHeight: '330px' }}>
                <Table stickyHeader>
                  <TableHead>
                    {!isMobile ? (
                      <TableRow sx={{ p: 0 }}>
                        <TableCell align="left">Date</TableCell>
                        <TableCell align="center">Invoice Number</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="right">Total Payment</TableCell>
                        <TableCell align="right">Tax Payment</TableCell>
                        <TableCell align="right">Balance</TableCell>

                      </TableRow>
                    ) : (
                      <TableRow sx={{ p: 0 }}>
                        <TableCell>INFO</TableCell>
                      </TableRow>
                    )}
                  </TableHead>
                  <TableBody>
                    {invoices?.map((asset, index) => (
                      !isMobile ? (
                        <TableRow key={`${asset.invoiceId}-${index}-${asset.invoiceNumber}`}>
                          <TableCell align="left">{fDate(asset?.date)}</TableCell>

                          <TableCell width={!isMobile ? 300 : 'auto'} align="center">{asset?.invoiceNumber}</TableCell>

                          <TableCell align="center">
                            <Label color={
                              asset?.status === 'paid' ?
                                'success' : asset?.status === 'partially_paid' ?
                                  'info' : asset?.status === 'sent' ?
                                    'warning' : asset?.status === 'overdue' ?
                                      'error' : 'default'
                            }>
                              {asset?.status}
                            </Label>
                          </TableCell>

                          <TableCell align="right">
                            <Label color={asset?.paymentMade > 0 ? 'success' : 'error'}>
                              {fCurrency(asset?.paymentMade)}
                            </Label>
                          </TableCell>

                          <TableCell align="right">
                            <Label color={asset?.taxTotal > 0 ? 'success' : 'error'}>
                              {fCurrency(asset?.taxTotal)}
                            </Label>
                          </TableCell>

                          <TableCell align="right">
                            <Label color={asset?.balance > 0 ? 'success' : 'error'}>
                              {fCurrency(asset?.balance)}
                            </Label>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={`${asset.lineItemId}-${index}-${asset.itemId}`}>
                          <TableCell>
                            <TextareaAutosize
                              aria-label="minimum height"
                              minRows={5}
                              placeholder="Minimum 5 rows"
                              value={
                                `Date: ${fDate(asset?.date) || 'N/A'}
                                Invoice: ${asset.invoiceNumber || 'N/A'}
                                Total Payment: ${fCurrency(asset.paymentMade) || 'N/A'}
                                Balance: ${fCurrency(asset.balance) || 'N/A'}
                                Status: ${asset.status || 'N/A'}`
                              }
                              style={{ width: '100%', fontSize: '0.75rem' }}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Stack>
  );

  return (
    <Card>
      <CardHeader
        title={
          isDashboardView ?
            (
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                <Stack spacing={1} direction='row' alignItems="center">
                  <Typography variant="h5"> Sales Order </Typography>
                  <Label variant="soft" color="default">{salesOrder?.salesorderNumber}</Label>
                  <Label
                    variant="soft"
                    color={
                      (salesOrder?.status === 'confirmed' && 'warning') ||
                      (salesOrder?.status === 'partially_shipped' && 'info') ||
                      (salesOrder?.status === 'overdue' && 'error') ||
                      (salesOrder?.status === 'fulfilled' && 'success') ||
                      'default'
                    }
                  >
                    {salesOrder?.status}
                  </Label>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                  Last Modified: {fDateTime(salesOrder?.lastModifiedTime)}
                </Typography>
              </Stack>
            ) :
            'Sales Order Details'
        }
      />
      {renderTotal}
    </Card>
  );
}
