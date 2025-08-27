import { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { LoadingContext } from 'src/auth/context/loading-context';
import {
    Box,
    Portal,
} from '@mui/material';
import ChatContainer from './chat-container';


const SALESIQ_WIDGETCODE =
    'siqa82f685ce7d0b934d9223bd2fdfda6469e6563643b687eb5595ffb473d248017';

export function ensureSalesIQ() {
    if (window.salesiqReadyFlag && window.$zoho && window.$zoho.salesiq) {
        return Promise.resolve(window.$zoho.salesiq);
    }
    if (window.salesiqPromiseRef) {
        return window.salesiqPromiseRef;
    }

    window.salesiqPromiseRef = new Promise((resolve, reject) => {
        if (
            window.$zoho &&
            window.$zoho.salesiq &&
            window.$zoho.salesiq.chat &&
            typeof window.$zoho.salesiq.chat.start === 'function'
        ) {
            window.salesiqReadyFlag = true;
            resolve(window.$zoho.salesiq);
            return;
        }

        window.$zoho = window.$zoho || {};
        window.$zoho.salesiq = window.$zoho.salesiq || {};
        window.$zoho.salesiq.widgetcode = SALESIQ_WIDGETCODE;
        window.$zoho.salesiq.values = window.$zoho.salesiq.values || {};
        window.$zoho.salesiq.ready = function ready() {
            window.salesiqReadyFlag = true;
            resolve(window.$zoho.salesiq);
        };

        const existing = document.getElementById('zsiqscript');
        if (!existing) {
            const s = document.createElement('script');
            s.id = 'zsiqscript';
            s.defer = true;
            s.src = `https://salesiq.zohopublic.com/widget?wc=${SALESIQ_WIDGETCODE}`;
            s.onerror = function onerror() {
                reject(new Error('No se pudo cargar Zoho SalesIQ'));
            };
            document.head.appendChild(s);
        } else {
            let attempts = 0;
            const maxAttempts = 160; // ~8s si interval = 50ms
            const interval = setInterval(() => {
                attempts += 1;
                if (
                    window.$zoho &&
                    window.$zoho.salesiq &&
                    window.$zoho.salesiq.chat &&
                    typeof window.$zoho.salesiq.chat.start === 'function'
                ) {
                    clearInterval(interval);
                    window.salesiqReadyFlag = true;
                    resolve(window.$zoho.salesiq);
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error('Zoho SalesIQ tardó demasiado en inicializar'));
                }
            }, 50);
        }
    }).finally(() => {
        delete window.salesiqPromiseRef;
    });
    return window.salesiqPromiseRef;
}

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

    useEffect(() => {
        const id = 'siq-offset-fix';
        let appended = false;

        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = `
                /* Botón flotante */
                body #zsiq_chat_wrap { bottom: 92px; right: 14px !important; }
                body .zsiq-float { bottom: 32px; right: 14px !important; }
            `;
            document.head.appendChild(style);
            appended = true;
        }

        // Siempre devuelve una función (cleanup)
        return () => {
            if (appended) {
                const el = document.getElementById(id);
                if (el) el.remove();
            }
        };
    }, []);

    const { isMobile } = useContext(LoadingContext)

    const userLogged = useMemo(() => JSON.parse(sessionStorage.getItem('userLogged')), []);

    const [visibleLoader, setVisibleLoader] = useState(true);

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

    function bindSalesIQOnClose(salesiq) {
        if (window.__siqOnCloseBound) return;
        window.__siqOnCloseBound = true;

        salesiq.floatbutton.visible('hide');

        try {
            salesiq?.floatwindow?.close?.(() => {
                setVisibleLoader(true);
                setOpen(false);
                setChattingWith(null);
                setOperatorId('');
            });
        } catch (e) { /* noop */ }
    }

    const handleStartChat = useCallback(() => {
        // const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(window.location.hostname);
        // if (isIP) {
        //     alert('SalesIQ requiere un dominio permitido. Abre la app por https://customerportal.newwindowsystem.net');
        //     return;
        // }

        const startNow = (salesiq) => {
            if (!salesiq?.chat?.start) {
                alert('SalesIQ is not ready. Please try again later.');
                return;
            }

            const user = userLogged?.data || null;
            const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
            try { if (fullName && salesiq.visitor?.name) salesiq.visitor.name(fullName); } catch (e) { /* noop */ }
            try { if (user?.email && salesiq.visitor?.email) salesiq.visitor.email(user.email); } catch (e) { /* noop */ }

            const op = selectedOperator || {};
            try {
                if (salesiq.visitor?.info) {
                    salesiq.visitor.info({ chosenOperator: op.name, operatorId: op.id });
                }
            } catch (e) { /* noop */ }

            try {
                if (op?.department && salesiq.chat?.defaultdepartment) {
                    salesiq.chat.defaultdepartment(op.department);
                }
            } catch (e) { /* noop */ }

            const saludo = `Hola, I want to chat with ${op?.name || 'an operator'}`;
            try { salesiq.visitor?.question?.(saludo); } catch (e) { /* noop */ }

            bindSalesIQOnClose(salesiq);

            try {
                salesiq.chatwindow?.visible?.('show');
                setVisibleLoader(false);
            } catch (e) { /* noop */ }
            // try { salesiq.chat?.start?.(); } catch (e) {
            //     alert('No fue posible iniciar el chat (verifica que el dominio esté permitido en SalesIQ).');
            // }
        };

        if (window.salesiqReadyFlag && window.$zoho?.salesiq) {
            startNow(window.$zoho.salesiq);
        } else {
            ensureSalesIQ()
                .then((siq) => startNow(siq))
                .catch(() => {
                    alert('No se pudo cargar Zoho SalesIQ. Intenta nuevamente más tarde.');
                });
        }
    }, [selectedOperator, userLogged]);


    return (
        <Portal>
            {(visibleLoader ) && (
                <Box id={componentId}
                    sx={{
                        position: 'fixed',
                        right: position.right,
                        bottom: { xs: position.bottomMobile, md: position.bottomDesktop },
                        zIndex: (t) => t.zIndex.tooltip,
                    }}
                >
                    <ChatContainer
                        componentId={componentId}
                        label={label}
                        position={position}
                        open={open}
                        handleOpen={handleOpen}
                        operators={operators}
                        hasOperators={hasOperators}
                        operatorId={operatorId}
                        setOperatorId={setOperatorId}
                        chattingWith={chattingWith}
                        handleCloseChatWith={handleCloseChatWith}
                        canStart={canStart}
                        handleClose={handleClose}
                        handleStartChat={handleStartChat}
                    />
                </Box>
            )}
        </Portal>
    );
}
