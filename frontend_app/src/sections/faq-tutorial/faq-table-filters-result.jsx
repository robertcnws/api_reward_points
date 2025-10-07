import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function FAQTableFiltersResult({ filters, totalResults, sx }) {
  
  const handleRemoveKeyword = useCallback(() => {
    filters.setState({ name: '' });
  }, [filters]);

  const handleReset = useCallback(() => {
    filters.onResetState();
  }, [filters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
