// commented_script.js

// ------------------------------
// Contains all previuos version of function
// that have been altered from script.js

// ------------------------------


// ------------------------------
// function exportFile() {
//     console.log('Sending export request...'); // Debugging
//     fetch('/export', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({})
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log('Export Response:', data); // Debugging
//         if (data.status === 'success') {
//             alert('Files exported successfully!');
//         } else {
//             alert('Error: ' + data.message);
//         }
//     })
//     .catch(error => {
//         console.error('Export error:', error);
//         if (typeof retryCount === 'undefined') {
//             retryCount = 0;
//         }
//         if (retryCount < 2) {  // Retry maksimum 2 kali
//             console.log(`🔄 Retrying exportFile (${retryCount + 1})`);
//             setTimeout(() => exportFile(retryCount + 1), 1000);
//         } else {
//             alert('Export failed after multiple attempts: ' + error);
//         }
//     });
//     document.getElementById('labelDropdown').value = '';
// }

// ------------------------------

// function exportFile() {
//     const selectDesign = Array.from(document.querySelectorAll('#selectDesign option:checked')).map(opt => opt.value);
//     const filterDesign = document.querySelector('input[name="filterDesign"]:checked')?.value;
//     const labelDropdown = document.getElementById('labelDropdown')?.value;

//     console.log('Sending export request...', selectDesign, filterDesign, labelDropdown);

//     let retryCount = 0;
//     fetch('/export', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             selectDesign: selectDesign,
//             filterDesign: filterDesign,
//             labelDropdown: labelDropdown
//         })
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log('Export Response:', data); // Debugging
//         if (data.status === 'success') {
//             alert('Files exported successfully!');
//         } else {
//             alert('Error: ' + data.message);
//         }
//     })
//     .catch(error => {
//         console.error('Export error:', error);
//         if (typeof retryCount === 'undefined') {
//             retryCount = 0;
//         }
//         if (retryCount < 2) {
//             console.log(`🔄 Retrying exportFile (${retryCount + 1})`);
//             setTimeout(() => exportFile(retryCount + 1), 1000);
//         } else {
//             alert('Export failed after multiple attempts: ' + error);
//         }
//     });

//     // Kosongkan dropdown
//     document.getElementById('labelDropdown').value = '';
// }

// ------------------------------

// function loadChart() {
//     fetch('/chartdata')
//     .then(response => response.json())
//     .then(data => {
//         if (data.status !== 'success') {
//             alert('Failed to load chart: ' + data.message);
//             return;
//         }

//         const ctx = document.getElementById('orderChart').getContext('2d');
//         // const colorList = ['#440154', '#3b528b', '#21918c', '#5cc863', '#fde725'];
//         const colorList = ['#2b8cbe', '#67a9cf', '#d1e5f0', '#f7f7f7', '#fddbc7', '#ef8a62', '#b2182b'];
//         const colors = data.x.map((_, i) => colorList[i % colorList.length]);

//         new Chart(ctx, {
//             plugins: [ChartDataLabels],
//             // type: 'bar',
//             data: {
//                 labels: data.x,
//                 datasets: [{
//                     type: 'bar',
//                     label: 'Total Orders',
//                     data: data.y,
//                     backgroundColor: colors,
//                     borderColor: 'grey',
//                     borderWidth: 2
//                 }]
//             },
//             options: {
//                 indexAxis: 'y',  // horizontal bar
//                 maintainAspectRatio: false,
//                 responsive: true,
//                 scales: {
//                     // X-Axis
//                     x: {
//                         grid: { color: 'grey', lineWidth: 1 },
//                         border: { color: 'black', width: 2 },
//                         beginAtZero: true,
//                         ticks: { font: { size: 20, weight: 'bold' }, color: 'black' }
//                     },
//                     // Y-Axis
//                     y: {
//                         grid: { color: 'grey', lineWidth: 1 },
//                         border: { color: 'black', width: 2 },
//                         ticks: { font: { size: 20, weight: 'bold' }, color: 'black' }
//                     }
//                 },
//                 layout: { padding: { right: 30 }, borderWidth: 1 },

//                 plugins: {
//                     // label
//                     datalabels: {
//                         anchor: 'end',
//                         align: 'right',
//                         color: 'black',
//                         font: { size: 18, weight: 'bold' },
//                         formatter: value => value
//                     },
//                     // Tajuk
//                     title: {
//                         display: true,
//                         text: 'Order Summary',
//                         font: { size: 28, family: 'Open Sans', weight: 'bold', color: 'black' }
//                     },
//                     legend: {
//                         display: true,
//                         labels: {font: {size: 20}}
//                     }
//                 },

//             }

//         });
//     });
// }

// ------------------------------

// function uploadFile() {
//     let fileInput = document.getElementById('fileUpload');  //.files[0];
//     let file = fileInput.files[0];

//     if (!file) {
//         alert('Please select a file.');
//         return;
//     }

//     let formData = new FormData();
//     formData.append('file', file);

//     fetch('/upload', { method: 'POST', body: formData })
//         .then(response => response.json())
//         // .then(data => alert(data.message))
//         .then(data => {
//             alert(data.message);
//             if (data.success) {
//                 console.log('File upload success, now ready for processing.');

//                 let newFileInput = document.createElement('input');
//                 newFileInput.type = 'file';
//                 newFileInput.id = 'fileUpload';
//                 newFileInput.className = 'form-control'; // Pastikan class tetap sama

//                 fileInput.replaceWith(newFileInput);  // Gantikan elemen lama dengan yang baru


//                 // location.reload();
//                 //     alert('File upload success !');
//                 // } else {
//                 //     alert((data.message || 'Unknown error.'));

//             }
//         })
//         .catch(error => {
//             console.error('Upload error :', error);
//             alert('An error occured while uploading file');
//         });
//     // .finally(() => {
//     //     fileInput.value = '';
//     // });
// }

// ------------------------------

// Function : Load batch list into dropdown
// function loadBatchDropdown() {
//     const filterBatch = getRadioValue('filter_batch') || 'none'; // 'none' atau 'batch'
//     const minLastBatchSize = getRadioValue('min_last_batch_size') || 0;  // default '0'

// //     // const filterBatch = document.getElementById('filter_batch')?.value || '';
// //     // const minLastBatchSize = document.getElementById('min_last_batch_size')?.value || 0;

//     console.log(`fetching: /batch?filter_batch=${filterBatch}&min_last_batch_size=${minLastBatchSize}`);
//     console.log('filterBatch:', filterBatch);
//     console.log('minLastBatchSize:', minLastBatchSize);


//   fetch(`/batch?filter_batch=${filterBatch}&min_last_batch_size=${minLastBatchSize}`)
//       .then(response => {
//             if (!response.ok) throw new Error('Network response was not ok');
//             return response.json();

//             // if (!response.ok) {
//             //     throw new Error('Network response was not ok ' + response.statusText);
//             // }
//             // return response.json();
//       })
//     //   response.json())
//     .then(data => {
//         if(data.status !== 'success') {
//             console.error('Batch loading error:', data.message);
//             return;
//         }
//         const dropdown = document.getElementById('batchListDropdown');
//         dropdown.innerHTML = '';

//         //   if (data.status === 'success' && data.batches.length > 0) {
//         if (data.batches && data.batches.length > 0) {
//         data.batches.forEach(batch => {
//             const option = document.createElement('option');
//             option.value = batch.value;
//             // option.text = batch.label;
//             option.textContent = batch.label;
//             dropdown.appendChild(option);
//         });
//         } else {
//             const option = document.createElement('option');
//             // option.text = 'None';
//             option.textContent = 'None';
//             dropdown.appendChild(option);
//         }
//     })
//     .catch(err => {
//       console.error('Batch loading failed:', err);
//     });
// }

// ------------------------------

// function loadTable() {
//     const fileSelect = document.getElementById('fileSelect');
//     const selectedFile = fileSelect.value;
//     const selectedBatch = document.getElementById('batchListDropdown').value;

//     if (!selectedFile) {
//         alert('Please select a file type.');
//         return;
//     }

//     // List yang perlu ikut batch
//     const batchRequired = ['picklist', 'orderlist'];

//     let url = '';
//     if (batchRequired.includes(selectedFile)) {
//         url = `/view_list_batch/${selectedFile}?batch=${selectedBatch}`;
//     } else {
//         url = `/view_data/${selectedFile}`;
//     }

//     fetch(url)
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             // if (!data.columns || !data.data) {
//             //     throw new Error('Invalid response format');
//             // }
//             if (!Array.isArray(data)) {
//                 console.error("Invalid data format:", data);
//                 throw new Error('Invalid response format');
//             }

//             let table = document.getElementById('dataTable');
//             let thead = table.querySelector('thead');
//             let tbody = table.querySelector('tbody');
//             thead.innerHTML = '';
//             tbody.innerHTML = '';

//             let headerRow = document.createElement('tr');
//             data.columns.forEach(col => {
//                 let th = document.createElement('th');
//                 th.innerText = col;
//                 headerRow.appendChild(th);
//             });
//             thead.appendChild(headerRow);

//             data.data.forEach(row => {
//                 let tr = document.createElement('tr');
//                 row.forEach(cell => {
//                     let td = document.createElement('td');
//                     td.innerText = cell;
//                     tr.appendChild(td);
//                 });
//                 tbody.appendChild(tr);
//             });
//             document.getElementById('fileSelect').value = '';
//         })
//         .catch(error => {
//             console.error('Error loading table:', error);
//             alert('Table load failed: ' + error.message);
//         });
// }

// ------------------------------

// function loadTable() {
//     let file = document.getElementById('fileSelect').value;
//     fetch('/view_data/' + file)
//     .then(response => response.json())
//     .then(data => {
//         let table = document.getElementById('dataTable');
//         let thead = table.querySelector('thead');
//         let tbody = table.querySelector('tbody');

//         // Kosongkan table sebelum tambah data baru
//         thead.innerHTML = '';
//         tbody.innerHTML = '';

//         if (data.length === 0) {
//             alert('No data found.');
//             return;
//         }

//         // Buat header table
//         let headerRow = document.createElement('tr');
//         let headers = Object.keys(data[0]);
//         headers.forEach(key => {
//             let th = document.createElement('th');
//             th.innerText = key;
//             headerRow.appendChild(th);

//             // th.style.position = 'relative';
//             // th.appendChild(headerRow);
//             // headerRow.appendChild(headerRow);
//         });
//         thead.appendChild(headerRow);

//         // Masukkan data dalam table
//         data.forEach((row) => {
//             let tr = document.createElement('tr');
//             headers.forEach((key) => {
//                 let td = document.createElement('td');

//                 let value = row[key] | '';
//                 td.innerText = value;
//                 tr.appendChild(td);
//             });
//             tbody.appendChild(tr);
//         });
//         console.log('Table loaded:', file);
//     })
//     .catch((error) => console.error('Error:', error));
// };

// ------------------------------

// Function-Button : Print results table
// function printTable(listType) {
//     let apiUrl = '';
//     let title = '';
//     let tableClass = '';
//     // let selectedBatch = document.getElementById('batchDropdown').value;

//     if (listType === 'orderlist') {
//         apiUrl = '/view_data/orderlist.csv';
//         title = 'Order List';
//         tableClass = 'orderlist-table';
//     } else if (listType === 'picklist') {
//         apiUrl = '/view_data/picklist.csv';
//         title = 'Pick List';
//         tableClass = 'picklist-table';
//     } else {
//         alert('Invalid List Type');
//         return;
//     }

//     fetch(apiUrl)
//     .then(response => response.json())
//     .then(data => {
//         if (!data || data.length === 0) {
//             alert('No data available for printing.');
//             return;
//         }

//         let table = document.createElement('table');
//         table.classList.add(tableClass);

//         // Build table header
//         let thead = document.createElement('thead');
//         let headerRow = document.createElement('tr');
//         Object.keys(data[0]).forEach(key => {
//             let th = document.createElement('th');
//             th.innerText = key;
//             headerRow.appendChild(th);
//         });
//         thead.appendChild(headerRow);
//         table.appendChild(thead);

//         // Build table body
//         let tbody = document.createElement('tbody');
//         data.forEach(row => {
//             let tr = document.createElement('tr');
//             // Object.values(row).forEach(value => {
//             //     let td = document.createElement('td');
//             //     td.innerText = value;

//             //     tr.appendChild(td);

//             Object.values(row).forEach((value, index) => {
//                 let td = document.createElement('td');
//                 td.innerText = value;

//                 // Pastikan ini adalah kolum 'Quantity' sebelum memprosesnya
//                 let headerText = headerRow.cells[index].innerText.toLowerCase();
//                 if (headerText.includes('quantity') || headerText.includes('qty')) {
//                     let quantity = parseInt(value, 10);
//                     if (!isNaN(quantity) && quantity > 1) {
//                         td.style.fontWeight = 'bold';
//                         td.style.backgroundColor = '#ffcccb'; // Warna merah lembut
//                     }
//                 }

//                 tr.appendChild(td);

//             });
//             tbody.appendChild(tr);
//         });
//         table.appendChild(tbody);

//         let style = `
//             <style>
//                 @media print {
//                     @page { size: A4; margin: 10mm 2mm; margin-top: 15mm; }
//                     .print-header { position: fixed; top: 0; text-align: left;}

//                     body { font-family: Calibri; }
//                     table { font-size: 12px !important; width: 100%;
//                             border-collapse: collapse; page-break-before: always; break-inside: avoid; }
//                     th, td { border: 1px solid black; text-align: left; vertical-align: top;
//                              text-overflow: clip; overflow: hidden; padding: 2px 2px !important;}
//                     th { background-color: #f2f2f2; }
//                     /*tr { break-inside: avoid; page-break-inside: avoid; }*/
//                 }


//                 .picklist-table th:nth-child(1), .picklist-table td:nth-child(1) { width: 1%; }
//                 .picklist-table th:nth-child(2), .picklist-table td:nth-child(2) { width: 1%; text-align: center !important }
//                 .picklist-table th:nth-child(3), .picklist-table td:nth-child(3) { width: 20%; /*22%;*/ }
//                 .picklist-table th:nth-child(4), .picklist-table td:nth-child(4) { width: 50%; /*45%;*/ }
//                 .picklist-table th:nth-child(5), .picklist-table td:nth-child(5) { width: 1%; text-align: center !important}
//                 .picklist-table th:nth-child(6), .picklist-table td:nth-child(6) { width: 27%;  /*28%;*/ }

//                 .orderlist-table th:nth-child(1), .orderlist-table td:nth-child(1) { width: 1%; }
//                 .orderlist-table th:nth-child(2), .orderlist-table td:nth-child(2) { width: 13%; }
//                 .orderlist-table th:nth-child(3), .orderlist-table td:nth-child(3) { width: 10%; }
//                 .orderlist-table th:nth-child(4), .orderlist-table td:nth-child(4) { width: 65%; }
//                 .orderlist-table th:nth-child(5), .orderlist-table td:nth-child(5) { width: 1%; text-align: center !important}
//                 .orderlist-table th:nth-child(6), .orderlist-table td:nth-child(6) { width: 10%; }
//             </style>
//         `;


//         let printWindow = window.open('', '', 'width=2000,height=1000');
//         let today = new Date().toLocaleDateString();
//         // let header = `<div class='print-header'>Report Generated on ${today}</div>`;
//         // printWindow.document.write(header);
//         printWindow.document.write('<html><head><title>Print Table</title>' + style + '</head><body>');
//         printWindow.document.write(table.outerHTML);
//         printWindow.document.write('</body></html>');
//         printWindow.document.close();
//         printWindow.print();
//     })
//     .catch(error => {
//         console.error('Error fetching data:', error);
//         alert('Failed to fetch data for printing.');
//     });
// }

// ------------------------------
