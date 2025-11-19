import 'jspdf-autotable';
import { jsPDF as JsPDF } from 'jspdf';

import { fDateTime } from './format-time';
import { fCurrency, fNumber } from './format-number';
import logoBase64 from '../../public/files/color_white_background/icon_with_text/NWS-CUSTOMER-REPORT.png';


export const generateRedeemedReport = ({ currentBuy }) => {
    const doc = new JsPDF();

    const margin = 2;
    const logoWidth = 25;
    const logoHeight = 25;
    const columnSpacing = 105;

    doc.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight);

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NEW WINDOW SYSTEM", 170, 10, null, null, "center");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`REDEEMED REWARD REPORT: ${fDateTime(new Date())}`, 105, 25, null, null, "center");
    
    doc.setFontSize(12);
    const salesOrderDetails = [
        [
            { content: "Client", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.storeProductSelection?.user?.firstName} ${currentBuy?.storeProductSelection?.user?.lastName}` || "" }
        ],
        [
            { content: "Company", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.storeProductSelection?.user?.companyName}` || "" }
        ],
        [
            { content: "Reward", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.storeProductSelection?.storeProduct?.name || " - "}` , styles: { fontStyle: 'bold' } }
        ],
        [
            { content: "Redemption Date", styles: { fontStyle: 'bold' } },
            { content: `${fDateTime(currentBuy?.redeemedTime) || " - "}` }
        ],
        [
            { content: "Points Spent", styles: { fontStyle: 'bold' } },
            { content: `${fNumber(currentBuy?.storeProductSelection?.storeProduct?.assignedPoints) || " - "}`, styles: { fontStyle: 'bold' } }
        ],
        [
            { content: "Confirmation Number", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.confirmationNumber || " - "}` }
        ],
        [
            { content: "Order Number", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.orderNumber || " - "}` }
        ],
        [
            { content: "Sales Person", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.salesorderPerson?.firstName || " - " } ${currentBuy?.salesorderPerson?.lastName || " - "}` }
        ],
        [
            { content: "Sales Person Contact", styles: { fontStyle: 'bold' } },
            { content: `Email: ${currentBuy?.salesorderPerson?.email || " - "}, Phone: ${currentBuy?.salesorderPerson?.phoneNumber || " - "}` }
        ],
        [
            { content: "Notes", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.notes || " - "}` }
        ],
    ];

    doc.autoTable({
        startY: 30,
        startX: margin + 5,
        margin: { left: margin + 3 },
        head: [[
            { content: "ORDER CHECKOUT", colSpan: 2, styles: { halign: 'center' } }
        ]],
        body: salesOrderDetails,
        theme: "grid",
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 52 },
            1: { cellWidth: 148 },
        },
    });

    doc.save(`REDEEMED_ORDER_${currentBuy?.confirmationNumber}_${fDateTime(new Date(), 'YYYY_MM_DD_HH_mm_ss')}.pdf`);

    const pdfBlob = doc.output('blob');

    const blobUrl = URL.createObjectURL(pdfBlob);

    window.open(blobUrl, '_blank');
}
