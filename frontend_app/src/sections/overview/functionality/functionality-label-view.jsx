import { useMemo } from 'react';

import { Box } from '@mui/system';
import { IconButton, Typography, Button } from '@mui/material';

import { Iconify } from 'src/components/iconify';
import { stripHtmlUsingDOM } from 'src/utils/helper';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { useRouter } from 'src/routes/hooks';
import { Label } from 'src/components/label';
import { fDurationFromNow } from 'src/utils/format-time';
// import { stripHtmlUsingDOM } from 'src/utils/helper'; // solo si tu descripción viene en HTML

export function FunctionalityLabelView({
    functionality,
    onClose,
}) {

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const router = useRouter();

    const plainDescription = useMemo(
        () => (functionality?.description ? stripHtmlUsingDOM(functionality.description) : ''),
        [functionality]
    );

    const htmlDescription = functionality?.description || '';

    const shortDescription = useMemo(() => {
        if (!plainDescription) return 'No description available.';
        if (plainDescription.length <= 200) return plainDescription;
        return `${plainDescription.slice(0, 200)}...`;
    }, [plainDescription]);

    const hasMoreText = plainDescription && plainDescription.length > 200;
    const openDescription = useBoolean();

    const hasPermissionToSeeLink = useMemo(() => {
        if (!functionality?.rolesAllowed || functionality.rolesAllowed.length === 0) {
            return true; 
        }
        const userRoleId = userLogged?.data?.user_role._id;
        return functionality.rolesAllowed.map((f) => f.id).includes(userRoleId);
    }, [functionality, userLogged]);

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    bgcolor: 'info.lighter',
                    p: 1.5,
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.info.light}`,
                    width: '100%',
                }}
            >
                {/* Header: título + botón cerrar */}
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center' }}>
                        <Typography
                            variant="subtitle2"
                            color="info.darker"
                            sx={{ fontWeight: 700 }}
                        >
                            {functionality?.name || ''} 
                        </Typography>
                        <Label color='info'>
                            {fDurationFromNow(functionality?.lastModifiedTime)} ago
                        </Label>
                    </Box>

                    <IconButton
                        size="small"
                        onClick={() => onClose?.(functionality)}
                    >
                        <Iconify icon="vaadin:close" width={14} height={14} />
                    </IconButton>
                </Box>

                {/* Descripción (100 chars + View more) */}
                <Typography
                    variant="body2"
                    color="info.darker"
                    sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                >
                    {shortDescription}{' '}
                    {hasMoreText && (
                        <Typography
                            component="span"
                            variant="body2"
                            sx={{
                                ml: 0.5,
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontWeight: 600,
                            }}
                            onClick={() => openDescription.onTrue()}
                        >
                            View more
                        </Typography>
                    )}
                </Typography>

                {/* Botón de link (sólo si tiene link) */}
                {(functionality?.link && hasPermissionToSeeLink) && (
                    <Box sx={{ mt: 0.5 }}>
                        <Button
                            size="small"
                            variant="contained"
                            color="info"
                            endIcon={<Iconify icon="solar:external-link-linear" width={16} height={16} />}
                            onClick={() =>
                                router.push(functionality.link)
                            }
                        >
                            Go to feature
                        </Button>
                    </Box>
                )}
            </Box>
            <ConfirmDialog
                sx={{ '& .MuiDialog-paper': { maxWidth: 600, maxHeight: 400 } }}
                open={openDescription.value}
                onClose={openDescription.onFalse}
                title={functionality?.name || 'Full Description'}
                content={
                    htmlDescription ? (
                        <Box sx={{ mt: 1 }} dangerouslySetInnerHTML={{ __html: htmlDescription }} />
                    ) : 'No description'
                }
            />
        </>
    );
}