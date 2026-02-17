import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import { useState } from "react";
import { Iconify } from "src/components/iconify";

export function DealerportalQuoteInfoProductsTableQuantityCell({ product, onManageProduct }) {

    const [qty, setQty] = useState(product?.quantity || 1);

    return (
        <TextField
            type="number"
            value={qty}
            variant="outlined"
            size="small"
            min={1}
            sx={{
                width: 110,
                '& .MuiOutlinedInput-root': {
                    height: 32,
                    pr: 0, // quita padding derecho
                },
                '& input': {
                    textAlign: 'center',
                    padding: '6px 6px',
                },
            }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <IconButton
                                size="small"
                                sx={{ p: 0.25 }}
                                onClick={
                                    async () => {
                                        await onManageProduct(product?.product?.id, 'update', qty + 1);
                                        setQty(qty + 1);
                                    }
                                }
                            >
                                <Iconify icon="mdi:chevron-up" width={16} />
                            </IconButton>
                            <IconButton
                                size="small"
                                sx={{ p: 0.25 }}
                                onClick={
                                    async () => {
                                        if (qty > 1) {
                                            await onManageProduct(product?.product?.id, 'update', qty - 1);
                                            setQty(qty - 1);
                                        }
                                    }
                                }
                            >
                                <Iconify icon="mdi:chevron-down" width={16} />
                            </IconButton>
                        </Box>
                    </InputAdornment>
                ),
            }}
            onFocus={(e) => e.target.select()}
            onChange={async (e) => {
                const value = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(value) && value > 0) {
                    await onManageProduct(product?.product?.id, 'update', value);
                    setQty(value);
                } else if (e.target.value === '' || value === 0) {
                    setQty(1);
                }
            }}
            onBlur={async () => {
                if (qty !== product?.quantity) {
                    await onManageProduct(product?.product?.id, 'update', qty);
                }
            }}
        />
    )
}