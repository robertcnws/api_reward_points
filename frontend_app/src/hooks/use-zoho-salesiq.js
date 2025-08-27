import { useEffect } from 'react';

export function useZohoSalesIQ() {
    useEffect(() => {
        if (window.$zoho?.salesiq) return;

        window.$zoho = window.$zoho || {};
        window.$zoho.salesiq = window.$zoho.salesiq || {
            ready: () => {
                const salesiq = window?.$zoho?.salesiq;
                if (!salesiq) return;
                salesiq.floatbutton.visible("hide");
                // salesiq.chatbutton.visible("hide");
            }
        };

        // window.$zoho?.salesiq?.floatbutton?.visible('show');

        const s = document.createElement("script");
        const currentDomain = 'https://customerportal.newwindowsystem.net/';
        s.id = "zsiqscript";
        s.defer = true;
        s.src = `https://salesiq.zohopublic.com/widget?wc=siqa82f685ce7d0b934d9223bd2fdfda6469e6563643b687eb5595ffb473d248017&current_domain=${currentDomain}`;
        document.body.appendChild(s);
    }, []);
}
