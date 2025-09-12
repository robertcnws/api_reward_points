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
            { content: `${currentBuy?.storeProductSelection?.storeProduct?.name}` || "", styles: { fontStyle: 'bold' } }
        ],
        [
            { content: "Redemption Date", styles: { fontStyle: 'bold' } },
            { content: `${fDateTime(currentBuy?.redeemedTime)}` || "" }
        ],
        [
            { content: "Points Spent", styles: { fontStyle: 'bold' } },
            { content: `${fNumber(currentBuy?.storeProductSelection?.storeProduct?.assignedPoints)}` || "", styles: { fontStyle: 'bold' } }
        ],
        [
            { content: "Confirmation Number", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.confirmationNumber}` || "" }
        ],
        [
            { content: "Order Number", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.orderNumber}` || "" }
        ],
        [
            { content: "Sales Person", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.salesorderPerson?.firstName} ${currentBuy?.salesorderPerson?.lastName}` || "" }
        ],
        [
            { content: "Sales Person Contact", styles: { fontStyle: 'bold' } },
            { content: `Email: ${currentBuy?.salesorderPerson?.email}, Phone: ${currentBuy?.salesorderPerson?.phoneNumber}` || "" }
        ],
        [
            { content: "Notes", styles: { fontStyle: 'bold' } },
            { content: `${currentBuy?.notes}` || "" }
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

    // const salesOrderFinalX = doc.internal.pageSize.width / 2 + 10;
    // const firstTableHeight = doc.lastAutoTable.finalY;

    // const installationDetails = [
    //     [
    //         { content: "" },
    //         { content: "Total", styles: { halign: 'center' } }
    //     ],
    //     [
    //         { content: "Subcontractors for the project" },
    //         { content: fCurrency((-1) * reportData.installation.totalSubcontractor) || "", styles: { halign: 'center', textColor: 'red' } }
    //     ],
    //     [
    //         { content: "Construction materials for the project" },
    //         { content: fCurrency((-1) * reportData.installation.totalMaterials) || "", styles: { halign: 'center', textColor: 'red' } }
    //     ],
    //     [
    //         { content: "" },
    //         { content: "" }
    //     ],
    //     [
    //         { content: "SUBTOTAL", styles: { halign: 'right', fontStyle: 'bold' } },
    //         { content: fCurrency((-1) * reportData.installation.totalInstalling) || "", styles: { halign: 'center', fontStyle: 'bold', textColor: 'red' } }
    //     ],
    //     [
    //         { content: "TAXES", styles: { halign: 'right', fontStyle: 'bold' } },
    //         { content: fCurrency(0) || "", styles: { halign: 'center', fontStyle: 'bold', textColor: 'red' } }
    //     ],
    //     [
    //         { content: "TOTAL", styles: { halign: 'right', fontStyle: 'bold' } },
    //         { content: fCurrency((-1) * reportData.installation.totalInstalling) || "", styles: { halign: 'center', fontStyle: 'bold', textColor: 'red' } }
    //     ],
    // ];


    // doc.autoTable({
    //     startY: 30,
    //     margin: { left: salesOrderFinalX - 10 },
    //     head: [[
    //         { content: "INSTALLATION COSTS", colSpan: 2, styles: { halign: 'center' } }
    //     ]],
    //     body: installationDetails,
    //     theme: "grid",
    //     styles: { fontSize: 11, cellPadding: 2 },
    //     columnStyles: {
    //         0: { cellWidth: 52 },
    //         1: { cellWidth: 48 },
    //     },
    // });


    // const label = "INSTALLATION PROFIT: ";
    // const value = fCurrency(reportData?.diff);
    
    // doc.setFontSize(14);
    
    // doc.setFont('helvetica', 'normal');
    // doc.setTextColor(0, 0, 0); 
    // const labelWidth = doc.getTextWidth(label);
    
    // doc.setFont('helvetica', 'bold');
    // if (reportData?.diff > 0) {
    //     doc.setTextColor(0, 128, 0); 
    // } else {
    //     doc.setTextColor(255, 0, 0); 
    // }
    // const valueWidth = doc.getTextWidth(value);
    
    // const totalWidth = labelWidth + valueWidth;
    // const centerX = 160; 
    // const startX = centerX - totalWidth / 2;
    
    // doc.setFont('helvetica', 'normal');
    // doc.setTextColor(0, 0, 0);
    // doc.text(label, startX, firstTableHeight + 10);
    
    // doc.setFont('helvetica', 'bold');
    // if (reportData?.diff > 0) {
    //     doc.setTextColor(0, 128, 0);
    // } else {
    //     doc.setTextColor(255, 0, 0);
    // }
    // doc.text(value, startX + labelWidth + 5, firstTableHeight + 10);




    // // doc.setFontSize(14);
    // // if (reportData?.diff > 0) {
    // //     doc.setTextColor(0, 128, 0);
    // // } else {
    // //     doc.setTextColor(255, 0, 0);
    // // }
    // // doc.text(`DIFF: ${fCurrency(reportData?.diff)}`, 200, firstTableHeight + 10, null, null, "right");


    doc.save(`REDEEMED_ORDER_${currentBuy?.confirmationNumber}_${fDateTime(new Date(), 'YYYY_MM_DD_HH_mm_ss')}.pdf`);

    const pdfBlob = doc.output('blob');

    const blobUrl = URL.createObjectURL(pdfBlob);

    window.open(blobUrl, '_blank');
}
