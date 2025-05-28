// script.js


// ------------------------------
// Helper Function
// ------------------------------

// ------------------------------
// Function : Call load_design when refresh

// $(document).ready(function () {
//         $('#selectDesign').select2({
//             minimumResultsForSearch: -1,  // Hide search box
//             width: '100%',
//             dropdownAutoWidth: false
//         });
//         loadDesigns();

//         // ✅ Force dropdown collapse
//         $('#selectDesign').on('select2:open', function() {
//             $('.select2-results').css('max-height', '200px');
//         });
//     });


$(document).ready(function () {
    // const ids = ['#selectDesign', '#selectDesignColor', '#selectDesignSize']; // Add your HTML IDs here
    const ids = ['#selectDesign']; // Add your HTML IDs here

    ids.forEach(id => {
        $(id).select2({
            minimumResultsForSearch: -1,  // Hide search box
            width: '100%',
            dropdownAutoWidth: false
        });

        // Force dropdown collapse
        $(id).on('select2:open', function () {
            $('.select2-results').css('max-height', '200px');
        });
    });

    loadDesigns();
    // loadDesignsColor();
    // loadDesignsColorSize();
});
// ------------------------------



// ------------------------------
// Function : Load design list to dropdown

function loadDesigns() {
    fetch('/design_list')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // let dropdown = $('#selectDesign');
                // dropdown.empty();

                // data.designs.forEach(design => {
                //     dropdown.append(new Option(design, design));
                // });

                // Populate #selectDesign with designs
                let designDropdown = $('#selectDesign');
                data.designs.forEach(design => {
                    designDropdown.append(new Option(design, design));
                });

                // // Populate #selectDesignColor with designs_color
                // let designColorDropdown = $('#selectDesignColor');
                // data.designs_color.forEach(design_color => {
                //     designColorDropdown.append(new Option(design_color, design_color));
                // });

                // // Populate #selectDesignSize with designs_size
                // let designSizeDropdown = $('#selectDesignSize');
                // data.designs_size.forEach(design_size => {
                //     designSizeDropdown.append(new Option(design_size, design_size));
                // });

                // Tambah Select2
                designDropdown.select2({
                    placeholder: 'Search or Select Design',
                    allowClear: true
                });
                // designColorDropdown.select2({
                //     placeholder: 'Color',
                //     allowClear: true });
                // designSizeDropdown.select2({
                //     placeholder: 'Size',
                //     allowClear: true });
            } else {
                console.error('Error fetching designs:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}
// ------------------------------


// ------------------------------
// Function-Button : Select and unselect all design

// Select
function selectAllDesigns() {
    let dropdown = $('#selectDesign');
    dropdown.find('option').prop('selected', true);
    dropdown.trigger('change');
}

// Unselect
function clearDesigns() {
    let dropdown = $('#selectDesign');
    dropdown.val(null).trigger('change');
}
// ------------------------------


// ------------------------------
// Function : Combined Event Listener

// Function : Trigger

['filter_batch', 'min_last_batch_size'].forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
        radio.addEventListener('change', loadBatchDropdown);
    });
});

// Function : Auto run when page load
window.addEventListener('load', function () {
    if (window.location.pathname === '/') {
        loadBatchDropdown();
        loadDesigns();
        loadChart();
        // controlCheckbox();
        console.log(window.location.pathname);
    }
});
// ------------------------------


// ------------------------------
// Function : Checkbox Controller

function controlCheckbox() {
    const allCheckbox = document.getElementById('all_opt');
    const otherCheckboxes = document.querySelectorAll('input[type="checkbox"]:not(#all_opt)');

    // Disable other checkbox if tick 'all'
    if (allCheckbox.checked) {
        otherCheckboxes.forEach(cb => {
            cb.disabled = true;
            cb.checked = false;
        });
    } else {
    // Enable other checkbox if untick 'all'
        otherCheckboxes.forEach(cb => {
            cb.disabled = false
        });
    }
}
// ------------------------------


// ------------------------------
// Function : Universal Fetch

// Function : Fetch value from radio button
function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : null;
}

// Function : Fetch value from checkbox
function getCheckedValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}
// ------------------------------


// ------------------------------
// Helper function to convert string to Title Case

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
// ------------------------------


// ------------------------------------------------------------


// ------------------------------
// Main Function
// ------------------------------


// ------------------------------
// Function-Button : Upload File to Dedicated Folder

function uploadFile() {
    let fileInput = document.getElementById('fileUpload');  //.files[0];
    let file = fileInput.files[0];
    let targetFolder = getRadioValue('file_upload'); // contoh: 'abx', 'sf', 'upload'

    if (!file) {
        alert('Please select a file.');
        return;
    }

    let formData = new FormData();
    formData.append('file', file);
    formData.append('folder', targetFolder);

    fetch('/upload', { method: 'POST', body: formData })
        .then(response => response.json())
        // .then(data => alert(data.message))
        .then(data => {
            alert(data.message);
            if (data.success) {
                console.log('File upload success, now ready for processing.');

                let newFileInput = document.createElement('input');
                newFileInput.type = 'file';
                newFileInput.id = 'fileUpload';             // make sure class name match to frontend
                newFileInput.className = 'form-control';    // make sure class name match to frontend

                fileInput.replaceWith(newFileInput);        // replace existing element
            }
            document.querySelector('input[name="file_upload"][value="upload"]').checked = true;
        })
        .catch(error => {
            console.error('Upload error :', error);
            alert('An error occured while uploading file');
        });
}
// ------------------------------


// ------------------------------
// Main Function : Load Batch into Dropdown

function loadBatchDropdown() {
    const filterBatch = getRadioValue('filter_batch') || 'none'; // 'none' or 'batch'
    const minLastBatchSize = getRadioValue('min_last_batch_size') || 0;  // default '0'

    // const filterBatch = document.getElementById('filter_batch')?.value || '';
    // const minLastBatchSize = document.getElementById('min_last_batch_size')?.value || 0;

    console.log(`fetching: /batch?filter_batch=${filterBatch}&min_last_batch_size=${minLastBatchSize}`);
    console.log('filterBatch:', filterBatch);
    console.log('minLastBatchSize:', minLastBatchSize);


    fetch(`/batch?filter_batch=${filterBatch}&min_last_batch_size=${minLastBatchSize}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();

            // if (!response.ok) {
            //     throw new Error('Network response was not ok ' + response.statusText);
            // }
            // return response.json();
        })
        .then(data => {
            if (data.status !== 'success') {
                console.error('Batch loading error:', data.message);
                return;
            }
            const dropdown = document.getElementById('batchListDropdown');
            dropdown.innerHTML = '';

            //   if (data.status === 'success' && data.batches.length > 0) {
            if (data.batches && data.batches.length > 0) {
                data.batches.forEach(batch => {
                    const option = document.createElement('option');
                    option.value = batch.value;
                    // option.text = batch.label;
                    option.textContent = batch.label;
                    dropdown.appendChild(option);
                    // option.value = batch.value || '';
                    // option.textContent = batch.label || 'Unknown';
                    // dropdown.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                // option.text = 'None';
                option.textContent = 'None';
                dropdown.appendChild(option);
            }
        })
        .catch(err => {
            console.error('Batch loading failed:', err);
        });
}
// ------------------------------


// ------------------------------
// Main Function-Button : Run Processing (Main Button)

function runProcessChain() {
    let statusMessage = document.getElementById('statusMessage');
    statusMessage.innerHTML = '<b>⏳ Processing...</b>';

    let selectedDesign = $('#selectDesign').val() || [];   // Design dropdown value
    let filterDesign = document.querySelector('input[name="filterDesign"]:checked').value;  // Design radio value
    let filterWarehouse = document.querySelector('input[name="filterWarehouse"]:checked').value;  // Warehouse radio value
    let filterPlatform = document.querySelector('input[name="filterPlatform"]:checked').value;  // Platform radio value
    let filterStores = getCheckedValues('filterStores'); // Store checkbox value

    console.log('Design:', selectedDesign);
    console.log('Filter Design:', filterDesign);
    console.log('Filter Warehouse:', filterWarehouse);
    console.log('Filter Platform:', filterPlatform);
    console.log('Filter Store:', filterStores);


    let processSteps = [
        { name: 'Processing', url: '/process_step_a', method: 'GET' },
        { name: 'Filtering', url: '/process_step_b', method: 'POST',
            body: { designs: selectedDesign, filter_design: filterDesign,
                    warehouse:filterWarehouse, platform: filterPlatform,
                    stores: filterStores }},
        { name: 'Generate Picklist', url: '/list', method: 'POST',
            body: { options: 'picklist' }},
        { name: 'Generate Orderlist', url: '/list', method: 'POST',
            body: { options: 'orderlist' }},
        { name: 'Overview', url: '/list', method: 'POST',
            body: { options: 'data_overview' }},
        { name: 'Tracking', url: '/list', method: 'POST',
            body: { options: 'tracking_map' }},

        // { name: 'Chart', url: '/chartdata', method: 'GET',
        //     callback: () => loadChart() }
    ];

    // Run Each Step
    function executeStep(index, retryCount = 0) {
        if (index >= processSteps.length) {
            statusMessage.innerHTML += '<br><b>✔ All Processes Completed !</b>';
            alert('✔ All Processes Completed !');
            console.log('All processes done!');
            loadChart();
            return;
        }

        let step = processSteps[index];
        console.log(`🔍 Running ${step.name}`);

        let requestOptions = { method: step.method };
        if (step.method === 'POST') {
            requestOptions.headers = { 'Content-Type': 'application/json' };
            requestOptions.body = JSON.stringify(step.body);
            console.log('Sending Data:', requestOptions.body); // Debug data yang dihantar ke Flask
        }

        fetch(step.url, requestOptions)
            .then(response => response.json())
            .then(data => {
                console.log(`${step.name} Completed:`, data);
                if (data.status === 'success') {
                    statusMessage.innerHTML += `<br>✔ ${step.name}`;
                    executeStep(index + 1);   // Jalankan step seterusnya
                } else {
                    alert(`${step.name} failed: ` + data.message);
                    statusMessage.innerHTML += `<br>❌ ${step.name} failed`;
                }
                // Return selected input to default values
                // clearDesigns();
                document.querySelector('input[name="filterDesign"][value="none"]').checked = true;
                document.querySelector('input[name="filterWarehouse"][value="none"]').checked = true;
                document.querySelector('input[name="filterPlatform"][value="none"]').checked = true;
                document.querySelectorAll('input[name="filterStores"]').forEach(cb => cb.checked = false);
            })
            .catch(error => {
                console.error(`🚨 Error in ${step.name}:`, error);

                if (retryCount < 5) {  // Retry maksimum 5 kali
                    console.log(`🔄 Retrying ${step.name} (${retryCount + 1})`);
                    setTimeout(() => executeStep(index, retryCount + 1), 1000);
                } else {
                    alert(`Error in ${step.name}: ` + error);
                    statusMessage.innerHTML += `<br>❌ ${step.name} Error`;
                }
            });

    }
    // Timeout of each step
    setTimeout(() => {
        executeStep(0);    // start from beginning
    }, 1000);
};
// ------------------------------



// ------------------------------
// Main Function-Table : View Table from dropdown

function loadTable() {
    let dropdown = document.getElementById('fileSelect');
    let file = document.getElementById('fileSelect').value;
    let table = document.getElementById('dataTable');

    table.classList.remove('picklist-table', 'orderlist-table');
    if (file === 'picklist.csv') {
        table.classList.add('picklist-table');
    }
    else if (file === 'orderlist.csv') {
        table.classList.add('orderlist-table');
    }


    fetch('/view_data/' + file)
        .then(response => response.json())
        .then(data => {
            // let table = document.getElementById('dataTable');
            let thead = table.querySelector('thead');
            let tbody = table.querySelector('tbody');

            // Empty table before creating new
            thead.innerHTML = '';
            tbody.innerHTML = '';

            if (data.length === 0) {
                alert('No data found.');
                return;
            }

            // Table Header
            let headerRow = document.createElement('tr');
            Object.keys(data[0]).forEach((key) => {
                let th = document.createElement('th');
                th.innerText = key;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Table Data
            data.forEach((row) => {
                let tr = document.createElement('tr');
                Object.values(row).forEach((value) => {
                    let td = document.createElement('td');
                    td.innerText = value;
                    tr.appendChild(td);

                });
                tbody.appendChild(tr);
            });

            console.log('Table loaded:', file);
            document.getElementById('fileSelect').value = '';
        })
        .catch((error) => console.error('Error:', error));
}
// ------------------------------



// ------------------------------
// Main Function-Button : Print Result Table

function printTable(listType) {
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

            let columns = result.columns;
            let data = result.data;

            if (data.length === 0) {
                alert('No data found for selected batch.');
                return;
            }

            // Set Mapping List Type
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
            // let valueStore = document.querySelector('input[name="filterPlatform"]:checked')?.value || 'none';
            let valueStore = getRadioValue('filterPlatform') || 'none';
            let displayStoreType = typeStore[valueStore];

            // Set Date
            let today = new Date();
            // let dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
            // let dateStr = today.toLocaleDateString('en-MY'); // DD/MM/YYYY
            let day = String(today.getDate()).padStart(2, '0');
            let month = String(today.getMonth() + 1).padStart(2, '0');
            let year = today.getFullYear();
            let dateStr = `${day}/${month}/${year}`;

            // Set formatting
            let totalQty = data.reduce((sum, row) => {
                let qtyKey = Object.keys(row).find(k => k.toLowerCase() === ('qty') || k.toLowerCase() === ('quantity'));
                return sum + (parseInt(row[qtyKey]) || 0);
            }, 0);

            let table = document.createElement('table');
            table.className = listType + '-table';

            // Header
            let thead = document.createElement('thead');

            let customHeaderRow = document.createElement('tr');
            let customHeaderCell = document.createElement('th');
            customHeaderCell.colSpan = columns.length;
            customHeaderCell.className = 'custom-header-row';
            // customHeaderCell.innerText = `${listType.toUpperCase()} ${dateStr} : [${selectedBatch}] [${totalQty} item]`;
            customHeaderCell.innerText = `${displayListType.toUpperCase()} ${dateStr} : [${selectedBatch}] [${totalQty} item]`;
            let customSavedName = `${displayListType.toUpperCase()} ${displayStoreType} ${dateStr} - ${selectedBatch}`;

            customHeaderRow.appendChild(customHeaderCell);
            thead.appendChild(customHeaderRow);

            // Nama Kolum
            let headerRow = document.createElement('tr');
            columns.forEach(col => {
                let th = document.createElement('th');
                th.innerText = col;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Kolum Body
            let tbody = document.createElement('tbody');
            data.forEach(row => {
                let tr = document.createElement('tr');
                columns.forEach((col, index) => {
                    let td = document.createElement('td');
                    td.innerText = row[col];

                    // Bold and fill color for qty > 1
                    let headerText = col.toLowerCase();
                    if ((headerText.includes('qty') || headerText.includes('quantity')) && parseInt(row[col]) > 1) {
                        td.style.fontWeight = 'bold';
                        td.style.backgroundColor = '#ffcccb';
                    }

                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            // Styling print
            let style = `
            <style>
                @page { size: A4; margin: 20px 15px; margin-bottom: 15px; }

                @media print {
                    /* start script asal */
                    /* body { font-family: Calibri, Segoe UI, Helvetica Neue, Arial, sans-serif; }
                    table { font-size: 12px !important; width: 100%;
                            border-collapse: collapse; page-break-before: always;
                            break-inside: avoid; page-break-inside: avoid; }
                    th, td { border: 1px solid black; text-align: left; vertical-align: top;
                             text-overflow: clip; overflow: hidden; padding: 2px 2px !important; }
                    th { background-color: #f2f2f2; }
                    thead { box-decoration-break: clone; } */
                    /* end script asal */

                    /* start fix */
                    /* table { font-size: 12px !important; width: 100%;
                            border-collapse: collapse; page-break-before: auto;
                            page-break-after: auto; }
                    table, tr, td, th {
                        border: 1px solid black; text-align: left; vertical-align: top;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important; padding: 2px 2px !important; }
                    thead {  box-decoration-break: clone; display: table-header-group !important; }
                    tbody { display: table-row-group; }
                    table { page-break-before: auto; page-break-after: auto; }
                    tr { page-break-inside: avoid !important; } */
                    /* end fix */

                    body { font-family: Calibri, 'Carlito', sans-serif; }

                    table { font-size: 12px !important; width: 100%;
                            border-collapse: collapse; page-break-before: auto;
                            break-inside: avoid; page-break-inside: avoid;
                            page-break-after: auto; }
                    th, td { border: 1px solid black; text-align: left;
                            vertical-align: top; text-overflow: clip;
                            overflow: hidden; padding: 2px 2px !important; }
                    th { background-color: #f2f2f2;
                        page-break-inside: avoid; }
                    td { page-break-inside: avoid; }
                    tr { page-break-inside: avoid; }
                    thead { box-decoration-break: clone;
                            display: table-header-group !important; }
                    tbody { display: table-row-group; }

                    .print-header { position: fixed; top: 0mm; left: 0mm;
                                    font-size: 12px; font-weight: bold; text-align: left; }

                    .custom-header-row { background-color: #ffffff; border: none;
                                         font-size: 12px; font-weight: normal; text-align:
                                         left;
                                         padding-bottom: 15px !important; }

                    td[data-quantity]:not([data-quantity="1"]) {
                        font-weight: bold; background-color: #ffcccb; }

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
            </style>
        `;

            let printWindow = window.open('', '', 'width=2000,height=1000');
            printWindow.document.write(`<html><head><title>${customSavedName}</title>${style}</head><body>`);
            printWindow.document.write(table.outerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        })
        .catch(error => {
            alert('Failed to print table.');
            console.error('Print Error:', error);
        });
}


// ------------------------------



// ------------------------------
// Function : Export File

function exportFile() {
    const selectDesign = Array.from(document.querySelectorAll('#selectDesign option:checked')).map(opt => opt.value);
    const filterDesign = document.querySelector('input[name="filterDesign"]:checked')?.value;
    const labelDropdown = document.getElementById('labelDropdown')?.value;

    console.log('Sending export request...', selectDesign, filterDesign, labelDropdown);

    let retryCount = 0; // Initialize retry count

    function attemptExport() {
        fetch('/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selectDesign: selectDesign,
                filterDesign: filterDesign,
                labelDropdown: labelDropdown
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Export Response:', data); // Debugging
                if (data.status === 'success') {
                    alert('Files exported successfully!');
                } else {
                    throw new Error(data.message);
                }
            })
            .catch(error => {
                console.error('Export error:', error);
                if (retryCount < 5) { // Retry maximum 5 times
                    retryCount++;
                    console.log(`🔄 Retrying exportFile (${retryCount})`);
                    setTimeout(attemptExport, 1000);
                } else {
                    alert('Export failed after multiple attempts: ' + error);
                }
            });
    }

    attemptExport(); // Start the export attempt

    // Empty dropdown
    document.getElementById('labelDropdown').value = '';
}
// ------------------------------



// ------------------------------
// Function : Load Chart

document.getElementById('chartSelector').addEventListener('change', function () {
    const [chartType, dataType] = this.value.split('-');
    loadChart(chartType, dataType);      // passing type : data
    document.getElementById('chartSelector').value = '';
});


// // version 1
// function loadChart(chartType = 'bar', dataType = 'order_summary') {
//     const selectedLimit = document.querySelector("input[name='bar_rank']:checked")?.value || 10;
//     const ctx = document.getElementById('orderChart').getContext('2d');

//     fetch(`/chartdata?type=${dataType}&bar_rank=${selectedLimit}`)
//     // fetch(`/chartdata?type=${dataType}`)
//         // .then(response => response.json())
//         .then(response => {
//             if (!response.ok) throw new Error(`Chart API error: ${response.status}`);
//             return response.json();
//         })
//         .then(data => {
//             if (data.status !== 'success') {
//                 alert('Failed to load chart: ' + data.message);
//                 return;
//             }

//             // Setting color
//             // const colorList = ['#2b8cbe', '#67a9cf', '#d1e5f0', '#f7f7f7', '#fddbc7', '#ef8a62', '#b2182b'];
//             const colorList = ['#2B8CBE', '#4097C4', '#54A1CA', '#66ABCF', '#7BB6D5',
//                                 '#91C1DB', '#A4CBE0', '#BAD7E6', '#CFE2EC', '#E3ECF1',
//                                 '#F7F7F7', '#F0E0E2', '#E9C9CD', '#E3B4BA','#DC9DA5',
//                                 '#D58690', '#CE707B', '#C75A67', '#C04553', '#B82C3D', '#B2182B',
//                                 '#B82C3D', '#C04553', '#C75A67', '#CE707B', '#D58690',
//                                 '#DC9DA5', '#E3B4BA', '#E9C9CD', '#F0E0E2', '#F7F7F7',
//                                 '#E3ECF1', '#CFE2EC', '#BAD7E6', '#A4CBE0', '#91C1DB',
//                                 '#7BB6D5', '#66ABCF', '#54A1CA', '#4097C4', '#2B8CBE' ]

//             const dataset = getDatasetByChartType(chartType, data, colorList);
//             // const colors = data.x.map((_, i) => colorList[i % colorList.length]);
//             let colors = [];

//             if (chartType === 'bar' || chartType === 'line' || chartType === 'pie') {
//                 colors = data.x.map((_, i) => colorList[i % colorList.length]);
//             } else if (chartType === 'scatter') {
//                 colors = data.xy.map((_, i) => colorList[i % colorList.length]);
//             }
//             // else if (chartType === 'matrix') {
//             //     colors = data.matrix.map((_, i) => colorList[i % colorList.length]);
//             // }
//             console.log('Chart data:', data);
//             console.log('FINAL DATASET:', dataset);

//             // Clear existing chart
//             if (window.orderChart instanceof Chart) {
//                 window.orderChart.destroy();
//             }

//             // Generate new chart
//             window.devicePixelRatio = 2;
//             window.orderChart = new Chart(ctx, {
//                 type: chartType,
//                 plugins: [ChartDataLabels],
//                 data: {
//                     // labels: ['bar', 'line', 'pie'].includes(chartType) ? data.x : undefined,
//                     // dataset: [{ dataset }],
//                     labels: data.x,
//                     datasets: [{
//                         label: data.label || 'Data',
//                         data: data.y,
//                         backgroundColor: colors,
//                         borderColor: 'grey',
//                         borderWidth: 2,
//                         borderRadius: 4,
//                         fill: chartType === 'line' ? false : true,
//                         tension: 0.3, // smooth line
//                         barPercentage: 1,         // Kawal lebar bar
//                         // categoryPercentage: 0.9
//                     }]
//                 },
//                 options: {
//                     // indexAxis: 'y',
//                     // indexAxis: chartType === 'bar' ? 'y' : 'x',
//                     // maintainAspectRatio: false,
//                     // responsive: true,
//                     // scales: {
//                     //     x: {
//                     //         suggestedMax: Math.max(...data.y) * 1.1,
//                     //         // type: data.time ? 'time' : 'category',
//                     //         // time: data.time ? { unit: 'day' } : undefined,
//                     //         grid: { color: 'grey', lineWidth: 1 },
//                     //         border: { color: 'black', width: 2 },
//                     //         beginAtZero: true,
//                     //         ticks: { font: { size: 14, weight: 'bold' }, color: 'black' }
//                     //     },
//                     //     y: {
//                     //         grid: { color: 'grey', lineWidth: 1 },
//                     //         border: { color: 'black', width: 2 },
//                     //         ticks: { font: { size: 14, weight: 'bold' }, color: 'black' }
//                     //     }
//                     // },
//                     // layout: { padding: { right: 30, left: 0 }, borderWidth: 1 },
//                     plugins: {
//                     //     datalabels: {
//                     //         display: chartType !== 'line',
//                     //         anchor: 'end',
//                     //         align: 'right',
//                     //         color: 'black',
//                     //         font: { size: 16, weight: 'bold' },
//                     //         formatter: value => value
//                     //    },
//                         title: {
//                             display: true,
//                             text: data.title || 'Order Summary',
//                     //        font: { size: 22, family: 'Calibri', weight: 'bold', color: 'black' }
//                         }
//                     //     legend: {
//                     //         display: true,
//                     //         labels: { font: { size: 16 } }
//                     //     }
//                     }
//                 }
//             });
//         });
// }


// ------------------------------

// version 2
// function loadChart(chartType = 'bar', dataType = 'order_summary') {
//   const selectedLimit = document.querySelector("input[name='bar_rank']:checked")?.value || 10;
//   const ctx = document.getElementById('orderChart').getContext('2d');

//   fetch(`/chartdata?type=${dataType}&bar_rank=${selectedLimit}`)
//     .then(response => {
//       if (!response.ok) throw new Error(`Chart API error: ${response.status}`);
//       return response.json();
//     })
//     .then(data => {
//       if (data.status !== 'success') {
//         alert('Data gagal diproses: ' + data.message);
//         return;
//       }

//       console.log('Chart data:', data);

//       // Generate color list
//       const colorList = ['#2B8EBE', '#4097C4', '#54A1CA', '#66ABCF', '#7BB6D5',
//         '#91C1DB', '#A4CBE0', '#BAD7E6', '#CFE2EC', '#E3ECF1',
//         '#F7F7F7', '#F0E0E2', '#E9C9CD', '#E3B4BA', '#DC9DA5',
//         '#D58690', '#CE707B', '#C75A67', '#C04553', '#B82C3D'];

//       // Generate dataset from helper
//       const dataset = getDatasetByChartType(chartType, data, colorList);
//       console.log('FINAL DATASET:', dataset);

//       // Destroy previous chart
//       if (window.orderChart instanceof Chart) {
//         window.orderChart.destroy();
//       }

//       // Chart setup
//       window.orderChart = new Chart(ctx, {
//         type: chartType,
//         data: {
//           labels: (chartType === 'bar' || chartType === 'line' || chartType === 'pie') ? data.x : undefined,
//           datasets: [dataset]
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           indexAxis: chartType === 'bar' ? 'y' : 'x',
//           scales: chartType === 'scatter' || chartType === 'matrix' ? undefined : {
//             x: {
//               grid: { color: 'grey' },
//               border: { color: 'black' },
//               ticks: { color: 'black' }
//             },
//             y: {
//               grid: { color: 'grey' },
//               border: { color: 'black' },
//               ticks: { color: 'black' },
//               beginAtZero: true
//             }
//           },
//           plugins: {
//             title: {
//               display: true,
//               text: data.title || 'Chart',
//               font: { size: 22, weight: 'bold' }
//             },
//             legend: {
//               display: true,
//               labels: { font: { size: 14, family: 'Calibri' } }
//             },
//             datalabels: {
//               display: chartType !== 'line' && chartType !== 'scatter' && chartType !== 'matrix',
//               anchor: 'end',
//               align: 'right',
//               color: 'black',
//               font: { size: 14, weight: 'bold' },
//               formatter: value => value,
//               clamp: true
//             }
//           },
//           layout: { padding: { right: 30, left: 0 } }
//         },
//         plugins: [ChartDataLabels]
//       });
//     })
//     .catch(error => {
//       alert('Gagal memuatkan carta: ' + error.message);
//       console.error(error);
//     });
// }


// ------------------------------

// latest version
function loadChart(chartType = 'bar', dataType = 'order_summary') {
    const selectedLimit = document.querySelector('input[name="bar_rank"]:checked')?.value || 10;
    const ctx = document.getElementById('orderChart').getContext('2d');

    fetch(`/chartdata?type=${dataType}&bar_rank=${selectedLimit}`)
    // fetch(`/chartdata?type=${dataType}`)
        // .then(response => response.json())
        .then(response => {
            if (!response.ok) throw new Error(`Chart API error: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status !== 'success') {
                alert('Failed to load chart: ' + data.message);
                return;
            }

            // Setting color
            const colorList = ['#2B8CBE', '#4097C4', '#54A1CA', '#66ABCF', '#7BB6D5',
                                '#91C1DB', '#A4CBE0', '#BAD7E6', '#CFE2EC', '#E3ECF1',
                                '#F7F7F7', '#F0E0E2', '#E9C9CD', '#E3B4BA','#DC9DA5',
                                '#D58690', '#CE707B', '#C75A67', '#C04553', '#B82C3D', '#B2182B',
                                '#B82C3D', '#C04553', '#C75A67', '#CE707B', '#D58690',
                                '#DC9DA5', '#E3B4BA', '#E9C9CD', '#F0E0E2', '#F7F7F7',
                                '#E3ECF1', '#CFE2EC', '#BAD7E6', '#A4CBE0', '#91C1DB',
                                '#7BB6D5', '#66ABCF', '#54A1CA', '#4097C4', '#2B8CBE' ]

            // const colors = data.x.map((_, i) => colorList[i % colorList.length]);
            // let colors = [];

            // if (chartType === 'bar' || chartType === 'line' || chartType === 'pie') {
            //     colors = data.x.map((_, i) => colorList[i % colorList.length]);
            // } else if (chartType === 'scatter') {
            //     colors = data.xy.map((_, i) => colorList[i % colorList.length]);
            // }
            // else if (chartType === 'matrix') {
            //     colors = data.matrix.map((_, i) => colorList[i % colorList.length]);
            // }

            const dataset = getDatasetByChartType(chartType, data, colorList);
            console.log('Chart data:', data);
            console.log('Final Dataset:', dataset);

            // Clear existing chart
            if (window.orderChart instanceof Chart) {
                window.orderChart.destroy();
            }

            // Generate new chart
            window.devicePixelRatio = 2;
            window.orderChart = new Chart(ctx, {
                type: chartType,
                plugins: [ChartDataLabels],
                data: {
                    // labels: ['bar', 'line', 'pie'].includes(chartType) ? data.x : undefined,
                    // datasets: [getDatasetByChartType(chartType, data, colorList)]
                    labels: (chartType === 'bar' || chartType === 'line' || chartType === 'pie') ? data.x : undefined,
                    datasets: [dataset]
                },
                options: {
                    plugins: {
                        datalabels: {
                            display: chartType !== 'line' && chartType !== 'scatter' && chartType !== 'matrix'
                        },
                        title: {
                            display: true,
                            text: data.title || 'Order Summary'
                        }
                    }
                }
            });
        });
}
// ---------------------------


