import { useMemo } from "react";
import { Autocomplete, Box, Chip, ListItem, TextField, Typography } from "@mui/material";
import { isClient } from "src/utils/check-permissions";

export function DealerportalQuoteAutocompleteOwners({
  loadedUsers,
  selectedOwner,
  setSelectedOwner,
  filterFunc,
  filters = null,
  localStorageKey = null,
  hasLabel = false,
}) {
  const options = useMemo(() => {
    const list = Array.isArray(loadedUsers) ? loadedUsers : [];
    return list.filter((u) => filterFunc?.(u?.userRole?.name));
  }, [loadedUsers, filterFunc]);

  return (
    <Box sx={{ mt: 1, mb: 2, gap: 2, display: 'flex', flexDirection: 'column' }}>
      <Autocomplete
        disablePortal={false}
        slotProps={{
          popper: { container: typeof document !== 'undefined' ? document.body : undefined },
        }}
        options={options}
        value={selectedOwner}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}   // ✅ CLAVE
        onChange={(_, value) => {
          if (value) {
            const clientName = `${value.firstName} ${value.lastName}`;
            setSelectedOwner(value);
            if (filters) filters.setState({ owner: { id: value.id, name: clientName } });
            if (localStorageKey) localStorage.setItem(localStorageKey, JSON.stringify({ id: value.id, name: clientName }));
          } else {
            setSelectedOwner(null);
            if (filters) filters.setState({ owner: { id: '', name: '' } });
            if (localStorageKey) localStorage.removeItem(localStorageKey);
          }
        }}
        getOptionLabel={(o) => `${o.firstName} ${o.lastName} (${o.username})`}
        renderOption={(props, option) => {
          const { key, ...liProps } = props;
          return (
            <ListItem key={key} {...liProps} component="li">
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                <Box sx={{ fontWeight: 500 }}>
                  {option.firstName} {option.lastName}
                </Box>
                <Box sx={{ color: 'text.disabled', fontSize: 13 }}>
                  {option.username}
                </Box>
              </Box>
            </ListItem>
          );
        }}
        renderInput={(params) => {
          const { InputProps, ...rest } = params;
          return (
            <TextField
              {...rest}
              label={hasLabel ? 'Quote Owner' : ''}
              InputProps={{
                ...InputProps,
                sx: { '& input': { display: selectedOwner ? 'none' : 'block' } },
                startAdornment: selectedOwner ? (
                  <Chip
                    sx={{ mr: 1, maxWidth: '100%' }}
                    variant="outlined"
                    onDelete={() => {
                      if (filters) filters.setState({ owner: { id: '', name: '' } });
                      if (localStorageKey) localStorage.removeItem(localStorageKey);
                      setSelectedOwner(null);
                    }}
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'row', textAlign: 'left', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {selectedOwner?.firstName} {selectedOwner?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                          Username: {selectedOwner?.username} • Company: {selectedOwner?.companyName || 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                ) : null,
              }}
              error={hasLabel && !selectedOwner}
              helperText={hasLabel && !selectedOwner ? 'Owner is required' : ''}
            />
          );
        }}
        sx={{ width: '100%' }}

      />
    </Box>
  );
}
