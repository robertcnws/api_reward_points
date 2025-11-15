import { Box, Button, TextField, Autocomplete } from "@mui/material";

import { Iconify } from "src/components/iconify";

export function SalesOrdersListFilters({ filters, allSalespersons, allStatuses, isMobile }) {

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: !isMobile ? 'row' : 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            p: 1,
            width: '100%',
            gap: 1
        }}>
            {Object.prototype.hasOwnProperty.call(filters.state, 'salesorderNumber') && (
                <TextField
                    sx={{ width: !isMobile ? 220 : '100%' }}
                    type='number'
                    label="Filter by SO Number"
                    onChange={(event) => {
                        filters.setState({ salesorderNumber: event.target.value });
                    }}
                    value={filters.state.salesorderNumber || ''}
                    InputProps={{
                        endAdornment: (
                            <Iconify
                                icon="ic:round-clear"
                                sx={{ cursor: 'pointer', color: 'text.disabled' }}
                                onClick={() => filters.setState({ salesorderNumber: '' })}
                            />
                        )
                    }}
                />
            )}

            {Object.prototype.hasOwnProperty.call(filters.state, 'status') && (
                <Autocomplete
                    sx={{ width: !isMobile ? 220 : '100%' }}
                    options={allStatuses || []}
                    value={filters.state.status}
                    onChange={(e, newValue) => filters.setState({ status: newValue })}
                    isOptionEqualToValue={(option, value) => option === value}
                    getOptionLabel={(option) => option ?? ''} // por si acaso
                    renderInput={(params) => (
                        <TextField {...params} label="Filter by Status" variant="outlined" />
                    )}
                />
            )}

            {Object.prototype.hasOwnProperty.call(filters.state, 'salespersonName') && (
                <Autocomplete
                    sx={{ width: !isMobile ? 300 : '100%' }}
                    options={allSalespersons || []}
                    value={filters.state.salespersonName}
                    onChange={(e, newValue) => filters.setState({ salespersonName: newValue })}
                    isOptionEqualToValue={(option, value) => option === value}
                    getOptionLabel={(option) => option ?? ''}
                    renderInput={(params) => (
                        <TextField {...params} label="Filter by Salesperson" variant="outlined" />
                    )}
                />
            )}

            <Button
                variant="outlined"
                color='error'
                sx={{ height: 40 }}
                onClick={() => {
                    Object.keys(filters.state).forEach(key => {
                        filters.setState({ [key]: null });
                    });
                }}
            >
                <Iconify icon="ic:round-clear" />
                Clear
            </Button>
        </Box>
    )
}