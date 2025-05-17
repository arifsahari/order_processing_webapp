// chart_setup.js



// =============================
// Global Setting untuk Chart.js
// =============================

// 1. Font & Warna Global untuk semua teks
Chart.defaults.font.family = 'Calibri';
// Chart.defaults.font.size = 14;
// Chart.defaults.font.weight = 'bold';
Chart.defaults.color = 'black';


// 2. Layout Global
Chart.defaults.layout = {
    padding: { right: 50, left: 0 },
    borderWidth: 1
};


// 3. Responsive Chart Setup
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;
// Chart.defaults.indexAxis = chartType === 'bar' ? 'y' : 'x';


// 4. Title (tajuk chart)
Chart.defaults.plugins.title.display = true;
Chart.defaults.plugins.title.font = {
    size: 22, weight: 'bold'
};
// Chart.defaults.plugins.title.font.size = 22;
// Chart.defaults.plugins.title.font.weight = 'bold';
Chart.defaults.plugins.title.color = 'black';


// 5. Legend (label bawah chart)
Chart.defaults.plugins.legend.display = true;
Chart.defaults.plugins.legend.labels = {
    font: { size: 16, weight: 'bold' },
    boxWidth: 20,
    boxHeight: 10,
    color: 'black'
};


// 6. Scales Global (x dan y axis)
// Chart.defaults.scales = {
//     x: {
//         // type: chartType === 'bar' ? 'category' : 'linear',
//         beginAtZero: true,
//         grid: { color: 'grey', lineWidth: 1 },
//         border: { color: 'black', width: 2 },
//         ticks: {
//             font: {
//                 size: 14, weight: 'bold'
//                 // callback: function (val) { return val; }
//                 },
//             color: 'black'
//         }
//     },
//     y: {
//         // type: chartType === 'bar' ? 'category' : 'linear',
//         grid: { color: 'grey', lineWidth: 1 },
//         border: { color: 'black', width: 2 },
//         ticks: {
//             font: {
//                 size: 14, weight: 'bold'
//                 // callback: function (val) { return val; }
//             },
//             color: 'black'
//         }
//     }
// };


// 7. Data Labels (dalam bar/line)
Chart.defaults.plugins.datalabels = {
    // display: chartType !== 'line',
    display: true,
    color: 'black',
    anchor: 'end',
    align: 'right',
    font: { size: 14, weight: 'bold' },
    formatter: value => value,
    // formatter: function(value) { return value; },
    clamp: true,
    clip: false
};


Chart.overrides.bar = {
    indexAxis: 'y',
    scales: {
        x: {
            grace: '15%',
            type: 'linear',
            beginAtZero: true,
            grid: { color: 'grey', lineWidth: 1 },
            border: { color: 'black', width: 2 },
            ticks: {
                font: { size: 14, weight: 'bold' },
                color: 'black'
            }
        },
        y: {
            grace: '100%',
            offset: true,
            type: 'category',
            grid: { color: 'grey', lineWidth: 1 },
            border: { color: 'black', width: 2 },
            ticks: {
                font: { size: 14, weight: 'bold' },
                color: 'black'
            }
        }
    }
};


Chart.overrides.line = {
    indexAxis: 'x',
    scales: {
        x: {
            type: 'category',
            grid: { color: 'grey', lineWidth: 1 },
            border: { color: 'black', width: 2 },
            ticks: {
                font: { size: 14, weight: 'bold' },
                color: 'black'
            }
        },
        y: {
            type: 'linear',
            beginAtZero: true,
            grid: { color: 'grey', lineWidth: 1 },
            border: { color: 'black', width: 2 },
            ticks: {
                font: { size: 14, weight: 'bold' },
                color: 'black'
            }
        }
    }
};
