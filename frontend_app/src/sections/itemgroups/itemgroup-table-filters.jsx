import { useCallback, useState } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ItemgroupTableFilters({
    filters,
    options,
    onResetPage = null,
}) {

    const handleFilterName = useCallback(
        (event) => {
            onResetPage?.();
            filters.setState({ name: event.target.value });
        },
        [filters, onResetPage]
    );

    const handleChangeConfigurations = useCallback(
        (series) => {
            // const optionSeries = options.series.filter((s) => series.includes(s.value));
            onResetPage?.();
            const uniqueConfigurations = reconfigureOptionsConfigurations(series, options.state.series);
            options.setState({ configurations: uniqueConfigurations });
        }, [onResetPage, options]
    );

    return (
        <Stack
            spacing={0} // el spacing aquí ya no hace falta, usamos rowGap/columnGap
            sx={{
                p: 2.5,
                pr: { xs: 2.5, md: 1 },
                width: 1,

                display: 'grid',
                rowGap: 2,
                columnGap: 2,

                gridTemplateColumns: {
                    xs: '1fr',                     // móviles: 1 por fila
                    md: 'repeat(3, minmax(0, 1fr))', // laptops pequeñas: 3 por fila
                    xl: 'repeat(6, minmax(0, 1fr))', // pantallas grandes: todos en una fila
                },
            }}
        >
            {/* Buscador */}
            <Box sx={{ width: 1 }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                        flexGrow: 1,
                        flexBasis: { xs: '100%', md: '33.33%', xl: 'auto' },
                        minWidth: { md: 250 },
                    }}
                >
                    <TextField
                        fullWidth
                        value={filters.state.name}
                        onChange={handleFilterName}
                        placeholder="SKU, NAME ..."
                        InputProps={{
                            sx: {
                                height: 40,                 // 👈 iguala la altura exacta al Autocomplete
                                pl: 0.5,                    // ajusta padding left para que no se vea alto
                                pr: 0.5,
                                '& .MuiInputAdornment-root': {
                                    height: '100%',           // 👈 mantiene íconos centrados
                                    maxHeight: 40,
                                },
                                '& input': {
                                    py: 0.75,                 // 👈 corrige el padding interno del input
                                }
                            },
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                            endAdornment:
                                filters.state.name && (
                                    <InputAdornment position="end">
                                        <Iconify
                                            icon="eva:close-circle-fill"
                                            sx={{ color: 'text.disabled', cursor: 'pointer' }}
                                            onClick={() => {
                                                onResetPage?.();
                                                filters.setState({ name: '' });
                                            }}
                                        />
                                    </InputAdornment>
                                ),
                        }}
                    />
                </Stack>
            </Box>

            {/* Type */}
            <MultiFilterAutocomplete
                label="Type"
                options={options.state.types}
                values={filters.state.type}
                onChange={(newValues) => {
                    onResetPage?.();
                    filters.setState({ type: newValues });
                }}
            />

            {/* Color */}
            <MultiFilterAutocomplete
                label="Color"
                options={options.state.colors}
                values={filters.state.color}
                onChange={(newValues) => {
                    onResetPage?.();
                    filters.setState({ color: newValues });
                }}
            />

            {/* Class */}
            <MultiFilterAutocomplete
                label="Class"
                options={options.state.classes}
                values={filters.state.class}
                onChange={(newValues) => {
                    onResetPage?.();
                    filters.setState({ class: newValues });
                }}
            />

            {/* Series */}
            <MultiFilterAutocomplete
                label="Series"
                options={options.state.series}
                values={filters.state.series}
                onChange={(newValues) => {
                    onResetPage?.();
                    filters.setState({ series: newValues });
                    filters.setState({ configuration: [] });
                    handleChangeConfigurations(newValues);
                }}
            />

            {/* Configuration */}
            {options.state.configurations.length > 0 && (
                <MultiFilterAutocomplete
                    label="Configuration"
                    options={options.state.configurations || []}
                    values={filters.state.configuration || []}
                    onChange={(newValues) => {
                        onResetPage?.();
                        filters.setState({ configuration: newValues });
                    }}
                />
            )}
        </Stack>

    );
}

// ----------------------------------------------------------------------
// Componente genérico para ANY filtro múltiple
// options: [{ value, label }]
// values: ['windows', 'doors', ...] (array de value)
// ----------------------------------------------------------------------

function MultiFilterAutocomplete({
    label,
    options,
    values,
    onChange,
    color = 'primary',
    mdWidth = 250, // lo uso como minWidth, no width fija
}) {
    const selectedOptions = options.filter((opt) => values.includes(opt.value));

    return (
        <Box
            sx={{
                flexGrow: 1,
                flexBasis: { xs: '100%', md: '33.33%', xl: 'auto' },
                minWidth: { xs: '100%', md: mdWidth },
            }}
        >
            <Autocomplete
                multiple
                size="small"
                options={options}
                disableCloseOnSelect
                getOptionLabel={(option) => option.label}
                value={selectedOptions}
                onChange={(event, newValue) => {
                    const newValues = newValue.map((opt) => opt.value);
                    onChange(newValues);
                }}
                renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                        <Chip
                            {...getTagProps({ index })}
                            key={option.value}
                            label={option.label}
                            size="small"
                            color={color}
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        placeholder={`Select ${label.toLowerCase()}...`}
                    />
                )}
            />
        </Box>
    );
}


export function reconfigureOptionsConfigurations(series, seriesOptions) {
    const allConfigurations = seriesOptions.map((s) => {
        if (series.includes(s.value)) {
            return s.configurations || [];
        }
        return [];
    }).flat();
    const uniqueConfigurations = Array.from(
        new Set(allConfigurations.map(
            (config) => config.value))).map((value) =>
                allConfigurations.find((config) => config.value === value));
    return uniqueConfigurations;
}
