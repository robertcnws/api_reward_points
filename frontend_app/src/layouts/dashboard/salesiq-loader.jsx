import { useEffect } from 'react';

export default function SalesIQLoader({ widgetCode, onReady }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const w = window;
    w.$zoho = w.$zoho || {};
    const prev = w.$zoho.salesiq?.ready;
    
    w.$zoho.salesiq = w.$zoho.salesiq || {};
    w.$zoho.salesiq.ready = function () {
      if (typeof prev === 'function') prev();
      if (typeof onReady === 'function') onReady(w.$zoho.salesiq);
    };
    
    if (!document.getElementById('zsiqscript')) {
      const s = document.createElement('script');
      s.id = 'zsiqscript';
      s.defer = true;
      s.src = `https://salesiq.zohopublic.com/widget?wc=${widgetCode}`;
      document.body.appendChild(s);
    }
  }, [widgetCode, onReady]);

  return null; 
}
