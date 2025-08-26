import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Box,
    Paper,
    Portal,
    Tooltip,
    IconButton,
    ClickAwayListener,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Divider,
    Typography,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/ChatBubbleRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import { Iconify } from 'src/components/iconify';
import { useDataContext } from 'src/auth/context/data/data-context';

export default function ChatLauncher({
    componentId,
    operators,
    // operators = [
    //     { id: 'anna', name: 'Anna (Sales)', chatUrl: '/chat/anna' },
    //     { id: 'mark', name: 'Mark (Support)', chatUrl: '/chat/mark' },
    //     { id: 'sofia', name: 'Sofia (Billing)', chatUrl: '/chat/sofia' },
    // ],
    position = { right: 10, bottomMobile: 40, bottomDesktop: 32 },
    label = 'Chat with us',
}) {
    const [open, setOpen] = useState(false);
    const [operatorId, setOperatorId] = useState('');
    const [chattingWith, setChattingWith] = useState(null);
    

    const hasOperators = operators && operators.length > 0;

    const selectedOperator = useMemo(
        () => operators.find((op) => op.id === operatorId) || null,
        [operators, operatorId]
    );

    const canStart = !!selectedOperator;

    const handleOpen = useCallback(() => setOpen(true), []);

    const handleClose = useCallback(() => {
        setOpen(false);
        setChattingWith(null);
        setOperatorId('');
    }, []);

    const handleCloseChatWith = useCallback(() => {
        setChattingWith(null);
        setOperatorId('');
        setOpen(true);
    }, []);

    const handleStartChat = useCallback(() => {
        if (!selectedOperator) return;
        setChattingWith(selectedOperator);
        setOpen(false);
    }, [selectedOperator]);

    return (
        <Portal>
            <Box id={componentId}
                sx={{
                    position: 'fixed',
                    right: position.right,
                    bottom: { xs: position.bottomMobile, md: position.bottomDesktop },
                    zIndex: (t) => t.zIndex.tooltip,
                }}
            >
                {/* Launcher Icon - hidden when panel open */}
                {(!open && !chattingWith) && (
                    <Tooltip title={label} placement="left" arrow>
                        <IconButton
                            onClick={handleOpen}
                            sx={{
                                width: 56,
                                height: 56,
                                bgcolor: 'background.paper',
                                boxShadow: 3,
                                color: 'primary.dark',
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    color: 'primary.main',
                                    transform: 'scale(1.12) rotate(8deg)',
                                    boxShadow: 6,
                                },
                                '@keyframes bounce': {
                                    '0%, 100%': { transform: 'translateY(0)' },
                                    '50%': { transform: 'translateY(-6px)' },
                                },
                                animation: 'bounce 1.6s infinite',
                            }}
                        >
                            {/* <ChatIcon sx={{ width: 28, height: 28 }} /> */}
                            <Iconify icon="cryptocurrency:chat" sx={{ width: 50, height: 50 }} />
                        </IconButton>
                    </Tooltip>
                )}

                {/* Chat Panel */}
                {open && (
                    <ClickAwayListener onClickAway={handleClose}>
                        <Paper
                            elevation={8}
                            sx={{
                                p: 2,
                                width: { xs: 320, md: 360 },
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                boxShadow: (t) => t.shadows[12],
                                position: 'relative',
                                overflow: 'visible',
                            }}
                            role="dialog"
                            aria-label="Chat panel"
                        >
                            {/* Close button */}
                            <IconButton
                                onClick={handleClose}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                }}
                                aria-label="Close chat"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>

                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                                Start a chat
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Choose an operator to begin. A new tab will open for your conversation.
                            </Typography>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (canStart) handleStartChat();
                                }}
                            >
                                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                    <InputLabel id="operator-label">Operator</InputLabel>
                                    <Select
                                        labelId="operator-label"
                                        label="Operator"
                                        value={operatorId}
                                        onChange={(e) => setOperatorId(e.target.value)}
                                        disabled={!hasOperators}
                                        MenuProps={{
                                            disablePortal: true,
                                            PaperProps: {
                                                sx: {
                                                    zIndex: (t) => t.zIndex.tooltip + 2,
                                                },
                                            },
                                        }}
                                    >
                                        {operators.map((op) => (
                                            <MenuItem key={op.id} value={op.id}>
                                                {op.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Divider sx={{ my: 1 }} />

                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 1 }}>
                                    <Button variant="outlined" onClick={handleClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={!canStart}
                                        sx={{
                                            bgcolor: 'primary.dark',
                                            '&:hover': {
                                                bgcolor: 'primary.main',
                                            },
                                        }}>
                                        Start chat
                                    </Button>
                                </Box>
                            </form>
                        </Paper>
                    </ClickAwayListener>
                )}
                {chattingWith && (
                    <ClickAwayListener onClickAway={handleCloseChatWith}>
                        <Paper
                            elevation={8}
                            sx={{
                                p: 2,
                                width: { xs: 320, md: 360 },
                                borderRadius: 3,
                                bgcolor: 'background.paper',
                                boxShadow: (t) => t.shadows[12],
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                            role="dialog"
                            aria-label={`Chat with ${chattingWith.name}`}
                        >

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    Chat: {chattingWith.name}
                                </Typography>
                                <IconButton size="small" onClick={handleCloseChatWith} aria-label="Close chat">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Box
                                sx={{
                                    height: 220,
                                    borderRadius: 2,
                                    bgcolor: 'background.neutral',
                                    p: 1.5,
                                    overflowY: 'auto',
                                    mb: 1.5,
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    Conversation with <b>{chattingWith.name}</b> will appear here...
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <input
                                    placeholder="Type a message..."
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        borderRadius: 8,
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        outline: 'none',
                                    }}
                                />
                                <Button
                                    variant="contained"
                                    sx={{
                                        bgcolor: 'primary.dark',
                                        '&:hover': {
                                            bgcolor: 'primary.main',
                                        },
                                    }}>
                                    Send
                                </Button>
                            </Box>
                        </Paper>
                    </ClickAwayListener>
                )}
            </Box>
        </Portal>
    );
}
