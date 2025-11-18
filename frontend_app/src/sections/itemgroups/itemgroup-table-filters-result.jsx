import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';
import { reconfigureOptionsConfigurations } from './itemgroup-table-filters';

// ----------------------------------------------------------------------

export function ItemgroupTableFiltersResult({
  filters,
  options,
  onResetPage = null,
  totalResults,
  sx
}) {
  
  const handleRemoveKeyword = useCallback(() => {
    onResetPage?.();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveCommonLists = useCallback(
    (filterName, inputValue, dependentFilterName = null, dependentOptionName = null) => {
      onResetPage?.();

      const prevValues = filters.state?.[filterName] || [];
      const newValue = prevValues.filter((item) => item !== inputValue);

      filters.setState({
        [filterName]: options?.state?.[filterName] ? newValue : [],
        ...(dependentFilterName ? { [dependentFilterName]: [] } : {}),
      });

      if (dependentFilterName && dependentOptionName) {
        const uniqueConfigurations = reconfigureOptionsConfigurations(
          newValue,
          options.state?.[filterName] || []
        );

        options.setState({
          [dependentOptionName]: uniqueConfigurations,
        });
      }
    },
    [filters, options, onResetPage]
  );


  // const handleRemoveDependentLists = useCallback(
  //   (filterName, inputValue) => {
  //     const newValue = filters.state[filterName].filter((item) => item !== inputValue);

  //     onResetPage();
  //     filters.setState({ [filterName]: options?.[filterName] ? newValue : [] });

  //     console.log('handleRemoveDependentLists', filterName, inputValue, newValue);

  //     // If series is changed, update configurations accordingly
  //     if (filterName === 'series' && options?.state?.series) {
  //       const allConfigurations = options.state.series.map((s) => {
  //         if (newValue.includes(s.value)) {
  //           return s.configurations || [];
  //         }
  //         return [];
  //       }).flat();
  //       console.log('allConfigurations', allConfigurations);
  //       const uniqueConfigurations = Array.from(
  //         new Set(allConfigurations.map(
  //           (config) => config.value))).map((value) =>
  //               allConfigurations.find((config) => config.value === value));
  //       filters.setState({ configuration: filters.state.configuration.filter((config) =>
  //         uniqueConfigurations.some((uc) => uc.value === config)) });
  //     }
  //   },
  //   [filters, onResetPage, options]
  // );

  const handleShowName = useCallback(
    (filterName, value) => {
      const listAll = options?.state?.[filterName];
      if (!listAll) return value;
      const optionElem = listAll.find((item) => item.value === value);
      return optionElem?.label || value;
    },
    [options]
  );

  const handleReset = useCallback(() => {
    onResetPage?.();
    filters.onResetState();
    options?.onResetState();
  }, [filters, onResetPage, options]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={{ ...sx }}>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      {filters.state?.type?.length > 0 && (
        <FiltersBlock label="Type:" isShow={!!filters.state.type.length}>
          {filters.state.type.map((item) => (
            <Chip
              {...chipProps}
              key={item}
              label={handleShowName('types', item)}
              onDelete={() => handleRemoveCommonLists('type', item)}
              sx={{ textTransform: 'uppercase', color: 'text.disabled' }}
            />
          ))}
        </FiltersBlock>
      )}

      {filters.state?.color?.length > 0 && (
        <FiltersBlock label="Color:" isShow={!!filters.state.color.length}>
          {filters.state.color.map((item) => (
            <Chip
              {...chipProps}
              key={item}
              label={handleShowName('colors', item)}
              onDelete={() => handleRemoveCommonLists('color', item)}
              sx={{ textTransform: 'uppercase', color: 'text.disabled' }}
            />
          ))}
        </FiltersBlock>
      )}

      {filters.state?.class?.length > 0 && (
        <FiltersBlock label="Class:" isShow={!!filters.state.class.length}>
          {filters.state.class.map((item) => (
            <Chip
              {...chipProps}
              key={item}
              label={handleShowName('classes', item)}
              onDelete={() => handleRemoveCommonLists('class', item)}
              sx={{ textTransform: 'uppercase', color: 'text.disabled' }}
            />
          ))}
        </FiltersBlock>
      )}

      {filters.state?.series?.length > 0 && (
        <FiltersBlock label="Series:" isShow={!!filters.state.series.length}>
          {filters.state.series.map((item) => (
            <Chip
              {...chipProps}
              key={item}
              label={handleShowName('series', item)}
              onDelete={() => handleRemoveCommonLists('series', item, 'configuration', 'configurations')}
              sx={{ textTransform: 'uppercase', color: 'text.disabled' }}
            />
          ))}
        </FiltersBlock>
      )}

      {filters.state?.configuration?.length > 0 && (
        <FiltersBlock label="Configuration:" isShow={!!filters.state.configuration.length}>
          {filters.state.configuration.map((item) => (
            <Chip
              {...chipProps}
              key={item}
              label={handleShowName('configurations', item)}
              onDelete={() => handleRemoveCommonLists('configuration', item)}
              sx={{ textTransform: 'uppercase', color: 'text.disabled' }}
            />
          ))}
        </FiltersBlock>
      )}

    </FiltersResult>
  );
}
