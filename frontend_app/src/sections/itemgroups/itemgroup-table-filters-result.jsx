import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function ItemgroupTableFiltersResult({
  filters,
  options = {},
  onResetPage,
  totalResults,
  sx
}) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveLists = useCallback(
    (filterName, inputValue) => {
      const newValue = filters.state[filterName].filter((item) => item !== inputValue);

      onResetPage();
      filters.setState({ [filterName]: newValue });
    },
    [filters, onResetPage]
  );

  const handleShowName = useCallback(
    (filterName, value) => {
      const list = options?.[filterName];
      if (!list) return value;
      const optionElem = list.find((item) => item.value === value);
      return optionElem?.label || value;
    },
    [options]
  );

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>

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
              onDelete={() => handleRemoveLists('type', item)}
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
              onDelete={() => handleRemoveLists('color', item)}
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
              onDelete={() => handleRemoveLists('series', item)}
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
              onDelete={() => handleRemoveLists('class', item)}
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
              onDelete={() => handleRemoveLists('configuration', item)}
              sx={{ textTransform: 'uppercase', color: 'text.disabled' }}
            />
          ))}
        </FiltersBlock>
      )}

    </FiltersResult>
  );
}
