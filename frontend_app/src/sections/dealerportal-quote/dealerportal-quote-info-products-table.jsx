import { Box, Button, IconButton, InputAdornment, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBoolean } from "src/hooks/use-boolean";
import { Iconify } from "src/components/iconify";
import { fCurrency } from "src/utils/format-number";
import { ConfirmDialog } from "src/components/custom-dialog";
import { DealerportalQuoteInfoProductsTableQuantityCell } from "./dealerportal-quote-info-products-table-quantity-cell";
import { DealerportalQuoteInfoProductsTableProductCell } from "./dealerportal-quote-info-products-table-product-cell";



export function DealerportalQuoteInfoProductsTable({
    quote,
    refetch,
    onManageProduct,
    onManageAllProducts,
    isOrdered,
    isMobile,
}) {

    useEffect(() => {
        if (!quote?.getProducts || !Array.isArray(quote?.getProducts)) {
            refetch();
        }
    }, [quote?.getProducts, refetch]);

    const currentProducts = useMemo(() => {
        if (!quote?.getProducts || !Array.isArray(quote?.getProducts)) {
            return [];
        }
        return quote?.getProducts;
    }, [quote?.getProducts]);

    const confirmRemove = useBoolean();

    const confirmRemoveAll = useBoolean();

    const [selectedProduct, setSelectedProduct] = useState(null);

    const handleRemoveProduct = useCallback(
        (product) => {
            setSelectedProduct(product);
            confirmRemove.onTrue();
        }, [confirmRemove, setSelectedProduct]);


    const tableNotMobile = (
        <Table stickyHeader size="small">
            <TableHead>
                <TableRow>
                    <TableCell
                        sx={{
                            width: "5%",
                            backgroundColor: "background.paper",
                            fontWeight: 700,
                        }}
                    >
                        #
                    </TableCell>
                    <TableCell
                        sx={{
                            width: "35%",
                            backgroundColor: "background.paper",
                            fontWeight: 700,
                        }}
                    >
                        Product
                        <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                            {quote?.getProducts?.length || 0} products
                        </Typography>
                    </TableCell>

                    <TableCell
                        align='right'
                        sx={{
                            width: "15%",
                            backgroundColor: "background.paper",
                            fontWeight: 700,
                        }}
                    >
                        Price
                    </TableCell>

                    <TableCell
                        align='center'
                        sx={{
                            width: "20%",
                            backgroundColor: "background.paper",
                            fontWeight: 700,
                        }}
                    >
                        Quantity
                    </TableCell>

                    <TableCell
                        align='right'
                        sx={{
                            width: "15%",
                            backgroundColor: "background.paper",
                            fontWeight: 700,
                        }}
                    >
                        Total Price
                    </TableCell>

                    {!isOrdered && (
                        <TableCell
                            align='right'
                            sx={{
                                width: "10%",
                                backgroundColor: "background.paper",
                                fontWeight: 700,
                            }}
                        >
                            <Box sx={{
                                display: "flex",
                                alignItems: "center",      // ✅ clave
                                justifyContent: "flex-end", // ✅ respeta el align right
                                gap: 0,
                            }}>
                                <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                    Actions
                                </Typography>
                                {quote?.getProducts?.length > 0 && (
                                    <Tooltip title="Remove all products" placement="top" arrow>
                                        <IconButton
                                            color="warning"
                                            onClick={confirmRemoveAll.onTrue}
                                            sx={{ ml: 0, justifyContent: "flex-end" }}
                                        >
                                            <Iconify icon="ic:twotone-delete-sweep" width={25} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </TableCell>
                    )}
                </TableRow>
            </TableHead>

            <TableBody>
                {currentProducts.map((product, index) => {
                    const price = product?.product?.rate || 0;
                    const qty = product?.quantity || 0;

                    return (
                        <TableRow
                            key={index}
                            hover
                            sx={{
                                cursor: "pointer",
                            }}
                        >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                                <DealerportalQuoteInfoProductsTableProductCell
                                    product={product}
                                    isOrdered={isOrdered}
                                />
                            </TableCell>
                            <TableCell align='right'>{fCurrency(price)}</TableCell>
                            <TableCell align='center'>
                                {!isOrdered ? (
                                    <DealerportalQuoteInfoProductsTableQuantityCell
                                        product={product}
                                        onManageProduct={onManageProduct}
                                    />
                                ) : (
                                    qty
                                )}
                            </TableCell>
                            <TableCell align='right'>{fCurrency(price * qty)}</TableCell>
                            {!isOrdered && (
                                <TableCell align='right'>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveProduct(product)}
                                    >
                                        <Iconify icon="weui:delete-on-filled" />
                                    </IconButton>
                                </TableCell>
                            )}
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    )

    const tableMobile = (
        <Box sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", gap: 0, flexDirection: "column", alignItems: "flex-start" }}>
                    <Typography variant="h6">Products</Typography>
                    <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                        {quote?.getProducts?.length || 0} products
                    </Typography>
                </Box>
                {(quote?.getProducts?.length > 0 && !isOrdered) && (
                    <Tooltip title="Remove all products" placement="top" arrow>
                        <IconButton
                            color="warning"
                            onClick={confirmRemoveAll.onTrue}
                        >
                            <Iconify icon="ic:twotone-delete-sweep" width={25} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                {currentProducts.map((row, index) => {
                    const price = row?.product?.rate ?? 0;
                    const qty = row?.quantity ?? 0;
                    const total = price * qty;

                    return (
                        <Box
                            key={row?.id || row?.product?.id || index}
                            sx={{
                                mb: 1,
                                p: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                gap: 1,
                            }}
                        >
                            {/* Product */}
                            <DealerportalQuoteInfoProductsTableProductCell
                                product={row}
                                isOrdered={isOrdered}
                            />

                            {/* Rate */}
                            <Box sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mt: 1,
                                mb: 1
                            }}>
                                <Typography variant="body2" align="right">
                                    Price: {fCurrency(price)}
                                </Typography>

                                {/* Quantity */}
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                    <Typography variant="body2">Qty:</Typography>

                                    {!isOrdered ? (
                                        <DealerportalQuoteInfoProductsTableQuantityCell
                                            product={row}
                                            onManageProduct={onManageProduct}
                                        />
                                    ) : (
                                        <Typography variant="body2">{qty}</Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Total */}
                            <Typography variant="body2" align="right">
                                Total: {fCurrency(total)}
                            </Typography>

                            {/* Delete */}
                            {!isOrdered && (
                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                    <IconButton color="error" onClick={() => handleRemoveProduct(row)}>
                                        <Iconify icon="weui:delete-on-filled" />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );


    return (
        <>
            <Box sx={{ mt: isMobile ? 1 : -5, width: 1 }}>
                {isMobile ? tableMobile : (
                    <TableContainer
                        component={Paper}
                        sx={{
                            maxHeight: 450,      // 🔥 tamaño fijo
                            overflow: "auto",
                        }}
                    >
                        {tableNotMobile}
                    </TableContainer>
                )}
            </Box>
            <ConfirmDialog
                open={confirmRemove.value}
                title="Remove Product"
                content={`Are you sure you want to remove this product (${selectedProduct?.product?.name}) from the quote?`}
                onClose={confirmRemove.onFalse}
                action={
                    <Button
                        variant="contained"
                        color="error"
                        onClick={
                            async () => {
                                confirmRemove.onFalse();
                                await onManageProduct(selectedProduct?.product?.id, "remove");
                            }}
                    >
                        Delete
                    </Button>
                }
            />
            <ConfirmDialog
                open={confirmRemoveAll.value}
                title="Remove All Products"
                content="Are you sure you want to remove all products from this quote?"
                onClose={confirmRemoveAll.onFalse}
                action={
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={
                            async () => {
                                confirmRemoveAll.onFalse();
                                await onManageAllProducts("remove");
                            }}
                    >
                        Delete
                    </Button>
                }
            />
        </>
    );
}