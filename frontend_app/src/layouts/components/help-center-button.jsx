
import IconButton from '@mui/material/IconButton';
import { Box, Drawer, Stack, Tooltip, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings/context';
import { Scrollbar } from 'src/components/scrollbar';
import { ExpandMoreOutlined } from '@mui/icons-material';

import { useDataContext } from 'src/auth/context/data/data-context';
import { useBoolean } from 'src/hooks/use-boolean';
import { useMemo } from 'react';
import { FAQS } from './faqs';
import { VTutorials } from './vtutorials';
import { MiniVideoView } from './mini-video-view';
import { FAQView } from './faq-view';


// ----------------------------------------------------------------------

export function HelpCenterButton({ width, sx, ...other }) {

  const router = useRouter();

  const openDrawer = useBoolean();

  const getYouTubeThumbnail = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  };

  const getEmbedUrl = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <Box width='100%'>
      <Tooltip title="Help Center Info" arrow placement="bottom">
        <IconButton
          aria-label="settings"
          onClick={() => openDrawer.onTrue()}
          sx={{
            p: 0,
            width: 120,
            height: width,
            color: 'primary.dark',
            fontWeight: 'bold',
            ...sx
          }}
          {...other}
        >
          <Box display="flex" alignItems="center" flexDirection="row" justifyContent="flex-start" sx={{ width: '100%' }}>
            <Iconify icon='icon-park-twotone:help' sx={{ width, height: width }} />
            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold', display: { xs: 'none', sm: 'block' } }}>
              Help Center
            </Typography>
          </Box>
        </IconButton>
      </Tooltip>
      <Drawer
        open={openDrawer.value}
        onClose={openDrawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 520 } }}
      >
        <IconButton
          onClick={openDrawer.onFalse}
          sx={{
            justifyContent: 'flex-end',
            alignItems: 'right',
            '&:hover': { bgcolor: 'transparent' },
          }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0 }}>
              FAQs
            </Typography>
          </Box>
          <Box sx={{ px: 2, py: 1 }}>
            {FAQS.slice(0, 5).map((faq, index) => (
              <FAQView faq={faq} keyIndex={index} />
            ))}
            <Box sx={{ py: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0 }}>
                For more FAQs, please visit our <a href={paths.dashboard.general.faqsTutorial} rel='noopener noreferrer'>FAQ page</a>.
              </Typography>
            </Box>
            <Box sx={{ p: 1, mt: 5, borderBottom: '1px solid', borderColor: 'divider' }} />
            <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0 }}>
                Video Tutorials
              </Typography>
            </Box>
            {VTutorials.slice(0, 3).map((vtutorial, index) => (
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
            <Box sx={{ py: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0 }}>
                For more video tutorials, please visit our <a href={paths.dashboard.general.faqsTutorial} rel='noopener noreferrer'>Tutorials page</a>.
              </Typography>
            </Box>
          </Box>

        </Scrollbar>
      </Drawer>
    </Box>
  );
}
