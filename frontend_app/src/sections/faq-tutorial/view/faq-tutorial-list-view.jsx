import { useMemo, useState, useEffect, useContext, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { LinearProgress } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { endpoints, wsEndpoints, axiosInstanceBackend } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TableCustomPaginationZohoStyleRow } from 'src/components/table/table-pagination-custom-zoho-style-row';
import {
  useTable,
  rowInPage,
  TableNoData,
  getComparator,
  TableHeadCustom,
  TableSelectedAction,
} from 'src/components/table';

import { LoadingContext } from 'src/auth/context/loading-context';
import { VTutorials } from 'src/layouts/components/vtutorials';
import { FAQS } from 'src/layouts/components/faqs';
import { FAQView } from 'src/layouts/components/faq-view';
import { MiniVideoView } from 'src/layouts/components/mini-video-view';

import { FAQTableToolbar } from '../faq-table-toolbar';
import { FAQTableFiltersResult } from '../faq-table-filters-result';


// ----------------------------------------------------------------------

export function FAQTutorialListView() {

  const { isMobile } = useContext(LoadingContext);

  const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

  const router = useRouter();

  const filters = useSetState({ name: '' });


  const dataFiltered = applyFilter({
    inputData: FAQS,
    filters: filters.state,
  });

  const canReset = !!filters.state.name;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  if (!FAQS || FAQS.length === 0) {
    return (
      <DashboardContent>
        <Box
          sx={{
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            margin: 'auto'
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            No FAQ & Tutorial found
          </Typography>
          <LinearProgress
            key="error"
            sx={{
              mb: 2,
              width: '100%',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'black',
              },
              backgroundColor: '#e0e0e0',
            }}
          />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        justifyContent="flex-start"
        alignItems={isMobile ? 'stretch' : 'flex-start'}
        alignContent="flex-start"
        sx={{ width: '100%' }}
        gap={2}
      >
        <Box
          display="flex"
          flexDirection="column"
          sx={{
            width: { xs: '100%', md: '50%' },
            alignSelf: 'flex-start',
          }}
        >
          <CustomBreadcrumbs
            // heading="List"
            links={[
              { name: 'Dashboard', href: paths.dashboard.general.analytics },
              { name: 'FAQ & Tutorial', href: paths.dashboard.general.faqsTutorial },
            ]}
            sx={{ mb: { xs: 1, md: 1 } }}
          />
          <Card>

            <FAQTableToolbar
              filters={filters}
            />

            {canReset && (
              <FAQTableFiltersResult
                filters={filters}
                totalResults={dataFiltered.length}
                sx={{ p: 2.5, pt: 0 }}
              />
            )}

            <Box sx={{ position: 'relative' }}>
              <Scrollbar sx={{ maxHeight: 620 }}>
                {dataFiltered?.map((faq, index) => (
                  <FAQView faq={faq} keyIndex={index} key={faq.id ?? `faq-${index}`} />
                ))}
              </Scrollbar>
            </Box>
          </Card>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          sx={{
            width: { xs: '100%', md: '50%' },
            alignSelf: 'flex-start',                          
          }}
        >
          {VTutorials?.map((vtutorial, index) => (
            <Box key={index} sx={{ py: 1 }} display="flex" flexDirection="row" alignItems="flex-start">
              <MiniVideoView url={vtutorial.url} title={vtutorial.title} width={150} />
              <Box display="flex" flexDirection="column" sx={{ ml: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0 }}>
                  {vtutorial.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0 }}>
                  <a href={vtutorial.url} target="_blank" rel="noopener noreferrer">
                    Watch on <Iconify icon="logos:youtube" width={60} sx={{ mt: -7, mb: -3 }} />
                  </a>
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </DashboardContent>
  );
}

function applyFilter({ inputData, filters }) {
  const { name } = filters;

  if (name) {
    inputData = inputData.filter(
      (item) => item?.questionEn?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.answerEn?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.questionEsp?.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        item?.answerEsp?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  return inputData;
}
