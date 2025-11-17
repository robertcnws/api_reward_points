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
            const allConfigurations = options.state.series.map((s) => {
                if (series.includes(s.value)) {
                    return s.configurations || [];
                }
                return [];
            }).flat();
            const uniqueConfigurations = Array.from(
                new Set(allConfigurations.map(
                    (config) => config.value))).map((value) =>
                        allConfigurations.find((config) => config.value === value));
            options.setState({ configurations: uniqueConfigurations });
        }, [onResetPage, options]
    );

    return (
        <>
            <Stack
                spacing={2}
                alignItems={{ xs: 'flex-end', md: 'center' }}
                direction={{ xs: 'column', md: 'row' }}
                sx={{ p: 2.5, pr: { xs: 2.5, md: 1 }, width: 1 }}
            >
                {/* Buscador de texto */}
                <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
                    <TextField
                        fullWidth
                        value={filters.state.name}
                        onChange={handleFilterName}
                        placeholder="SKU, NAME ..."
                        InputProps={{
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
                        // Actualizar configuraciones disponibles según la serie seleccionada
                        filters.setState({ configuration: [] }); // Reset configurations filter
                        handleChangeConfigurations(newValues);
                    }}
                />

                {/* Configuration */}
                {
                    (options.state.series &&
                        options.state.series.length > 0 &&
                        options.state.configurations &&
                        options.state.configurations.length > 0) && (
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
        </>
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
    mdWidth = 250,
}) {
    // Opciones seleccionadas (objetos) a partir de los values del estado
    const selectedOptions = options.filter((opt) => values.includes(opt.value));

    return (
        <Box sx={{ flexShrink: 0, width: { xs: 1, md: mdWidth } }}>
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
