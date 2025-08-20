import { Box, Avatar, IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import { varAlpha } from 'src/theme/styles';
import { useEffect, useState } from 'react';
import { axiosInstanceBackend, endpoints } from 'src/utils/axios';

function AvatarWithUpdate({ name, avatarUrl, keyAvatar, onSelectFile = null }) {
    const theme = useTheme();

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (file) onSelectFile?.(file);
        // Resetea para permitir re-seleccionar el mismo archivo
        e.target.value = '';
    };

    const [currentUrl, setCurrentUrl] = useState(avatarUrl);

    useEffect(() => {
        async function fetchData() {
            if (keyAvatar) {
                try {
                    const response = await axiosInstanceBackend.get(endpoints.rewardPoints.getFileUrl(keyAvatar));
                    if (!response.data || !response.data.url) {
                        console.error('Error fetching URL', response.statusText);
                    }
                    const values = await response.data;

                    setCurrentUrl(values.url);
                } catch (error) {
                    console.error('Error al obtener la URL:', error);
                }
            }
            else {
                setCurrentUrl(avatarUrl);
            }
        }
        fetchData();
    }, [keyAvatar, avatarUrl]);

    return (
        <Box
            sx={{
                position: 'relative',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',

                // Oculto por defecto; aparece al hacer hover sobre el contenedor
                '.uploadBtn': {
                    opacity: 0,
                    transform: 'translateY(-6px)',
                    transition: 'opacity 180ms ease, transform 180ms ease',
                    pointerEvents: 'none',
                    mt: 1, // separacion "debajo" del avatar
                },
                '&:hover .uploadBtn': {
                    opacity: 1,
                    transform: 'translateY(0)',
                    pointerEvents: 'auto',
                },
            }}
        >
            {!currentUrl?.includes('http') ? (
                <Avatar
                    alt={name}
                    src={currentUrl}
                    slotProps={{
                        img: {
                            loading: 'lazy',
                            decoding: 'async',
                            crossOrigin: 'anonymous',
                            referrerPolicy: 'no-referrer',
                            onError: (e) => { },
                        },
                    }}
                    sx={{
                        mx: 'auto',
                        width: { xs: 64, md: 128 },
                        height: { xs: 64, md: 128 },
                        border: `solid 2px ${theme.vars.palette.common.white}`,
                        transition: 'box-shadow 180ms ease, border-color 180ms ease',
                        '&:hover': {
                            border: `solid 2px ${theme.vars.palette.primary.light}`,
                            boxShadow: `0 0 0 4px ${theme.vars.palette.primary.lighter}`,
                        },
                    }}
                >
                    {name?.charAt(0).toUpperCase()}
                </Avatar>
            ) : (
                <Box
                    component='img'
                    src={currentUrl}
                    alt={name}
                    sx={{
                        mx: 'auto',
                        width: { xs: 64, md: 128 },
                        height: { xs: 64, md: 128 },
                        border: `solid 2px ${theme.vars.palette.common.white}`,
                        '&:hover': {
                            border: `solid 2px ${theme.vars.palette.primary.light}`,
                            boxShadow: `0 0 0 4px ${theme.vars.palette.primary.lighter}`,
                        },
                        borderRadius: 10,
                    }}
                />
            )}

            {onSelectFile && (
                <Tooltip title="Update photo">
                    <IconButton
                        className="uploadBtn"
                        size="small"
                        component="label" // opens the file picker
                        sx={{
                            bgcolor: 'background.paper',
                            border: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
                            '&:hover': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                            },
                        }}
                    >
                        <PhotoCameraRoundedIcon fontSize="small" />
                        <input hidden accept="image/*" type="file" onChange={handleFile} />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
}

export default AvatarWithUpdate;
