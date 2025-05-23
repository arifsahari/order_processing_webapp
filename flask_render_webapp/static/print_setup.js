// print_setup.js



// ------------------------------
// Print Contents

function contentPrintTable(result, listType, selectedBatch) {
    let columns = result.columns;
    let data = result.data;

    if (data.length === 0) {
        alert('No data found for selected batch.');
        return;
    }

    let { displayListType, displayStoreType, dateStr, totalQty } = customTitle(result, listType);

    // // Set formatting
    // let totalQty = data.reduce((sum, row) => {
    //     let qtyKey = Object.keys(row).find(k => k.toLowerCase() === 'qty' || k.toLowerCase() === 'quantity');
    //     return sum + (parseInt(row[qtyKey]) || 0);
    // }, 0);

    let table = document.createElement('table');
    table.className = listType + '-table';

    let thead = document.createElement('thead');

    let customHeaderRow = document.createElement('tr');
    let customHeaderCell = document.createElement('th');
    customHeaderCell.colSpan = columns.length;
    customHeaderCell.className = 'custom-header-row';
    // customHeaderCell.innerText = `${listType.toUpperCase()} ${dateStr} : ${selectedBatch} (${totalQty} item)`;
    customHeaderCell.innerText = `${displayListType.toUpperCase()} ${displayStoreType} ${dateStr} : [${selectedBatch}] [${totalQty} item]`;

    customHeaderRow.appendChild(customHeaderCell);
    thead.appendChild(customHeaderRow);

    let headerRow = document.createElement('tr');
    columns.forEach(col => {
        let th = document.createElement('th');
        th.innerText = col;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');
    data.forEach(row => {
        let tr = document.createElement('tr');
        columns.forEach(col => {
            let td = document.createElement('td');
            td.innerText = row[col];

            let headerText = col.toLowerCase();
            if ((headerText.includes('qty') || headerText.includes('quantity'))) {
                td.setAttribute('data-quantity', parseInt(row[col]));

                if (parseInt(row[col]) > 1) {
                    td.style.fontWeight = 'bold';  // Optional: fallback styling
                    td.style.backgroundColor = '#ffccbb';  // Optional: fallback styling
                }
            }

            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
}
// ------------------------------


// ------------------------------
// Set print style

function printStyle() {
    return `
        @page { size: A4; margin: 20px 15px; margin-bottom: 15px; }

        @media print {
            body { font-family: Calibri, 'Carlito', sans-serif; }
            table { font-size: 12px !important; width: 100% !important;
                    border-collapse: collapse; page-break-before: auto;
                    break-inside: avoid; page-break-inside: avoid;
                    page-break-after: auto; table-layout: fixed; /* enforce width control */}
            th, td { border: 1px solid black; text-align: left;
                    vertical-align: top; text-overflow: clip;
                    overflow: hidden; padding: 2px 2px !important; word-wrap: break-word; }
            th { background-color: #f2f2f2; page-break-inside: avoid; }
            td { page-break-inside: avoid; }
            tr { page-break-inside: avoid; }
            thead { box-decoration-break: clone; display: table-header-group !important; }
            tbody { display: table-row-group; }
            .print-header { position: fixed; top: 0mm; left: 0mm;
                            font-size: 12px; font-weight: bold; text-align: left; }
            .custom-header-row { background-color: #ffffff; border: none;
                                 font-size: 12px; font-weight: normal; text-align: left;
                                 padding-bottom: 15px !important; }
            td[data-quantity]:not([data-quantity="1"]) {
                font-weight: bold; background-color: #ffccbb;
            }
        }
        .picklist-table th:nth-child(1), .picklist-table td:nth-child(1) { width: 3%; }
        .picklist-table th:nth-child(2), .picklist-table td:nth-child(2) { width: 1%; text-align: center !important; }
        .picklist-table th:nth-child(3), .picklist-table td:nth-child(3) { width: 17%; }
        .picklist-table th:nth-child(4), .picklist-table td:nth-child(4) { width: 50%; }
        .picklist-table th:nth-child(5), .picklist-table td:nth-child(5) { width: 1%; text-align: center !important; }
        .picklist-table th:nth-child(6), .picklist-table td:nth-child(6) { width: 28%; }

        .orderlist-table th:nth-child(1), .orderlist-table td:nth-child(1) { width: 3%; }
        .orderlist-table th:nth-child(2), .orderlist-table td:nth-child(2) { width: 13%; }
        .orderlist-table th:nth-child(3), .orderlist-table td:nth-child(3) { width: 10%; }
        .orderlist-table th:nth-child(4), .orderlist-table td:nth-child(4) { width: 63%; }
        .orderlist-table th:nth-child(5), .orderlist-table td:nth-child(5) { width: 1%; text-align: center !important; }
        .orderlist-table th:nth-child(6), .orderlist-table td:nth-child(6) { width: 10%; }

    `;
}
// ------------------------------


// ------------------------------
// Set custom header and title name
function customTitle(result, listType) {
    let data = result.data;

    let typeList = {
        picklist: 'PL',
        orderlist: 'OL'
    };
    let displayListType = typeList[listType.toLowerCase()] || listType;

    // Set Mapping Store Type
    let typeStore = {
        none: '',
        website: 'Web',
        marketplace: 'MP'
    };
    let valueStore = getRadioValue('filterPlatform') || 'none';
    let displayStoreType = typeStore[valueStore];

    // Set Date
    let today = new Date();
    let dateStr = today.toLocaleDateString('en-MY'); // DD/MM/YYYY
    // let day = String(today.getDate()).padStart(2, '0');
    // let month = String(today.getMonth() + 1).padStart(2, '0');
    // let year = today.getFullYear();
    // let dateStr = `${day}/${month}/${year}`;

    // Set formatting
    let totalQty = data.reduce((sum, row) => {
        let qtyKey = Object.keys(row).find(k => k.toLowerCase() === 'qty' || k.toLowerCase() === 'quantity');
        return sum + (parseInt(row[qtyKey]) || 0);
    }, 0);

    return { displayListType, displayStoreType, dateStr, totalQty };
}
// ------------------------------


// ------------------------------
// Use the helper
let { displayListType, displayStoreType, dateStr, totalQty } = getPrintTableInfo(result, listType);
// ------------------------------


// ------------------------------
// Desktop Print

function printTableDesktop(result, listType, selectedBatch) {
    const table = contentPrintTable(result, listType, selectedBatch);

    let { displayListType, displayStoreType, dateStr, totalQty } = customTitle(result, listType);
    const title = `${displayListType.toUpperCase()} ${displayStoreType} ${dateStr} - ${selectedBatch}`;

    const style = `<style>${printStyle()}</style>`;
    let printWindow = window.open('', '', 'width=2000,height=1000');
    printWindow.document.write(`<html><head><title>${title}</title>${style}</head><body>`);
    printWindow.document.write(table.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}
// ------------------------------


// ------------------------------
// Mobile Print

// function printTableMobile(result, listType, selectedBatch) {
//     const table = contentPrintTable(result, listType, selectedBatch);
// 
//     let { displayListType, displayStoreType, dateStr, totalQty } = customTitle(result, listType);
//     const title = `${displayListType.toUpperCase()} ${displayStoreType} ${dateStr} - ${selectedBatch}`;
// 
//     let iframe = document.createElement('iframe');
//     iframe.style.display = 'none';
//     document.body.appendChild(iframe);
// 
//     const style = `<style>${printStyle()}</style>`;
//     const doc = iframe.contentDocument || iframe.contentWindow.document;
//     doc.open();
//     doc.write(`<html><head><title>${title}</title>${style}</head><body>`);
//     doc.write(table.outerHTML);
//     doc.write('</body></html>');
//     doc.write(`
//         <script>
//             // Tunggu sehingga DOM siap
//             window.onload = function() {
//                 // Panggil fungsi highlightColumn jika ada
//                 if (typeof highlightColumn === 'function') {
//                     highlightColumn();
//                 }
// 
//                 // Force print selepas gaya siap
//                 setTimeout(() => {
//                     window.focus();
//                     window.print();
//                 }, 300);
//             };
//         </script>
//     `);
//    doc.close();
// 
//     // setTimeout(() => {
//     //     iframe.contentWindow.focus();
//     //     iframe.contentWindow.print();
//     //     setTimeout(() => document.body.removeChild(iframe), 2000);
//     // }, 500);
//     setTimeout(() => {
//         document.body.removeChild(iframe);
//     }, 3000);
// }
// ------------------------------
// function printTableMobile(result, listType, selectedBatch) {
//     const table = contentPrinTable(result, listType, selectedBatch);
// 
//     let { displayListType, displayStoreType, dateStr, totalQty } = customTitle(result, listType);
//     const title = `${displayListType.toUpperCase()} ${displayStoreType} ${dateStr} - ${selectedBatch}`;
// 
//     const wrapper = document.createElement('div');
//     wrapper.innerHTML = `<style>${printStyle()}</style>`;
//     wrapper.appendChild(table);
//     document.body.appendChild(wrapper);
// 
//     const opt = {
//         margin: 0.5,
//         image: { type: 'jpeg', quality: 0.98 },
//         html2canvas: { scale: 2 },
//         jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
//     };

    // html2pdf().set(opt).from(wrapper).outputPdf('bloburl').then((blobUrl) => {
    //     const win = window.open(blobUrl);
    //     document.body.removeChild(wrapper);
    //     if (win) {
    //         win.focus();
    //         win.print();
    //     }
    // });

//     html2pdf().set(opt).from(wrapper).save().then(() => {
//         document.body.removeChild(wrapper);
//     });
// }
// ------------------------------
function printTableMobile(result, listType, selectedBatch) {
    const table = contentPrinTable(result, listType, selectedBatch);
    const { displayListType, displayStoreType, dateStr } = customTitle(result, listType);
    const title = `${displayListType.toUpperCase()} ${displayStoreType} ${dateStr} - ${selectedBatch}`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `<style>${printStyle()}</style>`;
    wrapper.appendChild(table);
    document.body.appendChild(wrapper);

    const opt = {
        margin: 0.5,
        filename: `${title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pdfCallback: function (pdf) {
            const blob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = blobUrl;
            document.body.appendChild(iframe);
            iframe.onload = function () {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                URL.revokeObjectURL(blobUrl);
                document.body.removeChild(iframe);
                document.body.removeChild(wrapper);
            };
        }
    };

    html2pdf().set(opt).from(wrapper).toPdf().get('pdf');
}






// ------------------------------
// Main Function Print

function printTableAuto(listType) {
    let batchDropdown = document.getElementById('batchListDropdown');
    let selectedBatch = batchDropdown && batchDropdown ? parseInt(batchDropdown.value) : 0;
    // let selectedBatch = batchDropdown ? parseInt(batchDropdown.value) : 0;

    fetch(`/print_table/${listType}?batch=${selectedBatch}`)
        .then(response => response.json())
        .then(result => {
            if (!result || !Array.isArray(result.data)) {
                alert('Invalid print data format.');
                console.error('Response:', result);
                return;
            }

            if (window.innerWidth < 768) {
                printTableMobile(result, listType, selectedBatch);
            } else {
                printTableDesktop(result, listType, selectedBatch);
            }
        })
        .catch(error => {
            alert('Failed to print table.');
            console.error('Print Error:', error);
        });

}
// ------------------------------






// ------------------------------

// // Fungsi untuk buka print window (desktop)
// function openPrintWindow(title, content) {
//     let printWindow = window.open('', '', 'width=2000,height=1000');
//     printWindow.document.write(`<html><head><title>${title}</title><style>${printStyle()}</style></head><body>`);
//     printWindow.document.write(content);
//     printWindow.document.write('</body></html>');
//     printWindow.document.close();
//     printWindow.print();
// }

// // Fungsi untuk print dalam iframe (mobile)
// function openPrintIframe(title, content) {
//     let iframe = document.createElement('iframe');
//     iframe.style.display = 'none';
//     document.body.appendChild(iframe);

//     const doc = iframe.contentDocument || iframe.contentWindow.document;
//     doc.open();
//     doc.write(`<html><head><title>${title}</title><style>${printStyle()}</style></head><body>`);
//     doc.write(content);
//     doc.write('</body></html>');
//     doc.close();

//     setTimeout(() => {
//         iframe.contentWindow.focus();
//         iframe.contentWindow.print();
//         setTimeout(() => document.body.removeChild(iframe), 2000);
//     }, 500);
// }
