import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function DealerportalOrderTableFiltersResult({ filters, onResetPage, totalResults, hasNotAll=true, sx }) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleResetOwner = useCallback(() => {
    onResetPage();
    filters.setState({ owner: { id: '', name: '' } });
    localStorage.removeItem('dealerportalOrderFilterOwner');
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
    filters.setState({ 
      status: 'all',
      owner: { id: '', name: '' }, 
    });

  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={
            filters.state.status === 'active' ? 'Active' : 
            filters.state.status === 'inactive' ? 'Inactive' : 
            filters.state.status === 'ordered' ? 'Ordered' : 
            filters.state.status
          }
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label="Owner:" isShow={!!filters.state.owner.name}>
        <Chip {...chipProps} label={filters.state.owner.name} onDelete={handleResetOwner} />
      </FiltersBlock>

    </FiltersResult>
  );
}
