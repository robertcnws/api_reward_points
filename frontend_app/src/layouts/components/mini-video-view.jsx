import { useState } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Typography } from '@mui/material';

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/');
    const i = parts.indexOf('embed');
    if (i >= 0 && parts[i+1]) return parts[i+1];
  } catch (e) {
    console.error('getYouTubeId error', e);
  }
  return null;
}

function getYouTubeThumb(url) {
  const id = getYouTubeId(url);
  // hqdefault.jpg = 480p aprox; mqdefault.jpg = 320p
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function getYouTubeEmbed(url) {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : url;
}

export function MiniVideoView({ url, title, width = 150 }) {
  const [play, setPlay] = useState(false);
  const thumb = getYouTubeThumb(url);
  const embed = `${getYouTubeEmbed(url)}?rel=0&modestbranding=1&playsinline=1&autoplay=1`;

  return (
    <Box
      sx={{
        width,
        aspectRatio: '16 / 9',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        cursor: 'pointer',
      }}
      onClick={() => setPlay(true)}
    >
      {play ? (
        <iframe
          src={embed}
          title={title}
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <>
          <img
            src={thumb || ''}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
          {/* Botón de play sobrepuesto */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(0,0,0,0.25)',
              transition: 'background-color .2s',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.35)' },
            }}
          >
            <Box
              sx={{
                width: 36, height: 36,
                borderRadius: '999px',
                bgcolor: 'common.white',
                display: 'grid', placeItems: 'center',
                boxShadow: 2,
              }}
            >
              <PlayArrowIcon fontSize="small" />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
