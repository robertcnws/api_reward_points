
import { Alert, Box, IconButton, Tooltip, Typography } from '@mui/material';
// import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { fNumber } from 'src/utils/format-number';
import { useEffect, useMemo, useState } from 'react';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CONFIG } from 'src/config-global';


export const ItemgroupGroupItemDetails = ({ selectedItem, isFromTable = false }) => {

    const [copySuccess, setCopySuccess] = useState(false);

    const [aspectRatio, setAspectRatio] = useState(0);

    const [imageUrl, setImageUrl] = useState('');

    const staticUrl = useMemo(() => CONFIG.dealerportal.staticUrl, []);

    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                setImageUrl(`${staticUrl}/styles/img/products/${selectedItem?.dealerportalImage}`);
                const img = new Image();
                img.src = `${staticUrl}/styles/img/products/${selectedItem?.dealerportalImage}`;
                img.onload = () => {
                    setAspectRatio(Math.round(img.width / img.height));
                };
                img.onerror = () => {
                    console.error('Error loading image');
                    setAspectRatio(0);
                };
            } catch (error) {
                console.error('Error fetching image URL:', error);
            }
        };
        fetchImageUrl();
    }, [selectedItem, aspectRatio, staticUrl]);


    const handleCopySKU = () => {
        navigator.clipboard.writeText(selectedItem?.sku).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const getImageStyle = () => {
        const baseStyle = {
            width: '80%',
            height: '80%',
            objectFit: 'cover',
            borderRadius: 4,
        };
        if (aspectRatio > 1) {
            return { ...baseStyle, height: '60%' };
        }
        return aspectRatio === 1 ? baseStyle : {};
    };

    return (
        <Box sx={{
            mt: 1,
            width: 'auto',
            height: { xs: 'auto', md: 620 },
            ml: {
                xs: !isFromTable ? -4 : 0,
                md: 3
            },
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            p: 3,
            bgcolor: '#fafafa'
        }}>
            <Box sx={{
                display: 'flex',
                flexDirection: {
                    xs: 'column',
                    md: 'row'
                },
                justifyContent: 'space-between'
            }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h5" gutterBottom>
                        {selectedItem?.groupName || 'Item Details'}
                    </Typography><br />
                    <Typography variant="h6">
                        {selectedItem?.name}
                    </Typography><br />
                    {/* <Typography variant="body2">
                        Selling price:<strong> {fCurrency(selectedItem?.rate) || 'N/A'}</strong>
                    </Typography> */}
                    <Typography variant="body2">
                        Available stock:
                        {selectedItem?.actualAvailableStock > 0 ?
                            <strong> {fNumber(selectedItem?.actualAvailableStock) || 'N/A'}</strong> :
                            <Label variant="soft" color="error">
                                Out of Stock
                            </Label>
                        }
                    </Typography>
                    <Typography variant="body1">
                        <strong>SKU :</strong> <code style={{ color: 'red' }}>{selectedItem?.sku}</code>
                        <Tooltip title={copySuccess ? "Copied!" : "Copy SKU"}>
                            <IconButton onClick={handleCopySKU}>
                                <Iconify icon="mingcute:copy-fill" width={25} />
                            </IconButton>
                        </Tooltip>
                    </Typography>
                    <Box
                        sx={{
                            backgroundColor: '#f2f2f2',
                            padding: 2,
                            mt: 2,
                            whiteSpace: 'pre-line'
                        }}
                    >
                        <Typography variant="body2" color="textSecondary">
                            {selectedItem?.description || 'No description available.'}
                        </Typography>
                    </Box>
                </Box>
                {/* <StoreProductDetailsCarousel images={[imageUrl]} /> */}
                <Box sx={{
                    mb: {
                        xs: 5,
                        md: 1
                    },
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                >
                    {aspectRatio > 0 ? (
                        <img
                            src={imageUrl}
                            alt={selectedItem?.name}
                            style={getImageStyle()}
                        />
                    ) : (
                        <Alert severity="error">Image not available</Alert>
                    )}
                </Box>
            </Box>
        </Box>
    );
};