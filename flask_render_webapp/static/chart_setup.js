// chart_setup.js


// =============================
// Global Setting for Chart JS
// =============================

// 1. Fonts
Chart.defaults.font.family = 'Calibri';
Chart.defaults.color = 'black';


// 2. Layout
Chart.defaults.layout = {
    padding: { right: 10, left: 0 },
    borderWidth: 1
};


// 3. Responsive Chart Setup
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;
// Chart.defaults.indexAxis = chartType === 'bar' ? 'y' : 'x';


// 4. Title
Chart.defaults.plugins.title.display = true;
Chart.defaults.plugins.title.font = {
    size: 22, weight: 'bold'
};
Chart.defaults.plugins.title.color = 'black';


// 5. Legend
Chart.defaults.plugins.legend.display = true;
Chart.defaults.plugins.legend.labels = {
    font: { size: 16, weight: 'bold' },
    boxWidth: 20,
    boxHeight: 10,
    color: 'black'
};


// // 6. Scales (x-axis and y-axis)
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


// 7. Data Labels (within bar/line)
Chart.defaults.plugins.datalabels = {
    // display: ctx => ctx.chart.config.type !== 'line',
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


// Chart : Bar Chart (Horizontal)
Chart.overrides.bar = {
    indexAxis: 'y',
    scales: {
        x: {
            grace: '20%',
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


// Chart : Line Chart
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
            grace: '10%',
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


// Chart : Scatter Plot
Chart.overrides.scatter = {
    indexAxis: 'x',
    scales: {
        x: {
            type: 'linear',
            grid: { color: 'grey', lineWidth: 1 },
            border: { color: 'black', width: 2 },
            title: {
                display: true,
                text: 'X Axis',
                font: { size: 14, weight: 'bold' },
                color: 'black'
            },
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
            title: {
                display: true,
                text: 'Y Axis',
                font: { size: 14, weight: 'bold' },
                color: 'black'
            },
            ticks: {
                font: { size: 14, weight: 'bold' },
                color: 'black'
            }
        }
    }
};


// Chart : Heatmap
Chart.overrides.matrix = {
    indexAxis: 'x',
    scales: {
        x: {
            type: 'category',
            offset: true,
            grid: { display: false },
            border: { color: 'black', width: 2 },
            ticks: {
                font: { size: 14, weight: 'bold' },
                color: 'black'
            }
        },
        y: {
            type: 'category',
            offset: true,
            grid: { display: false },
            border: { color: 'black', width: 2 },
            ticks: {
                font: { size: 14, weight: 'bold' },
                color: 'black'
            }
        }
    },
    plugins: {
        legend: { display: false }
    }
};


// =============================
// Global Setting for Chart Dataset Handler
// =============================
function getDatasetByChartType(chartType, data, colorList) {
    // Scatter
    if (chartType === 'scatter' || chartType === 'bubble') {
        return {
            label: data.label || 'Data',
            data: data.xy, // [{x, y}] or [{x, y, r}]
            // backgroundColor: 'rgba(0, 102, 204, 0.6)',
            backgroundColor: data.xy.map((_, i) => colorList[i % colorList.length]),
            borderColor: 'black',
            borderWidth: 1
        };
    }

    // Heatmap
    if (chartType === 'matrix') {
        return {
            label: data.label || 'Heatmap',
            data: data.matrix, // [{x, y, v}]
            backgroundColor: function(ctx) {
                const val = ctx.raw.v;
                return val > 80 ? '#B82C3D'
                     : val > 60 ? '#D58690'
                     : val > 40 ? '#F0E0E2'
                     : val > 20 ? '#A4CBE0'
                     : '#BAD7E6';
            },
            borderWidth: 1,
            width: ({chart}) => chart.chartArea.width / data.columns.length,
            height: ({chart}) => chart.chartArea.height / data.rows.length
        };
    }

    // Default (bar, line, etc.)
    return {
        label: data.label || 'Data',
        data: data.y,
        backgroundColor: data.x.map((_, i) => colorList[i % colorList.length]),
        borderColor: 'grey',
        borderWidth: 2,
        borderRadius: 3,
        fill: chartType === 'line' ? false : true,
        tension: 0.3,             // Kawal kelenturan garis
        barPercentage: 1,         // Kawal lebar bar
        // categoryPercentage: 0.9
    };
}



// ------------------------------------------------------------------------------------------------------




// // ======================
// // CHART SETUP (GLOBAL)
// // ======================
// Chart.defaults.font.family = 'Calibri';
// Chart.defaults.font.size = 14;
// Chart.defaults.font.weight = 'bold';
// Chart.defaults.plugins.title.display = true;
// Chart.defaults.plugins.title.font = { size: 20, weight: 'bold' };
// Chart.defaults.plugins.legend.labels.font = { size: 14 };

// // =======================================
// // CHART OVERRIDES (PER CHART TYPE)
// // =======================================
// Chart.overrides.bar = {
//   indexAxis: 'y',
//   scales: {
//     x: {
//       type: 'linear',
//       beginAtZero: true,
//       grid: { color: 'grey', lineWidth: 1 },
//       border: { color: 'black', width: 2 },
//       ticks: { color: 'black' }
//     },
//     y: {
//       type: 'category',
//       grid: { color: 'grey', lineWidth: 1 },
//       border: { color: 'black', width: 2 },
//       ticks: { color: 'black' }
//     }
//   }
// };

// Chart.overrides.line = {
//   indexAxis: 'x',
//   scales: {
//     x: {
//       type: 'category',
//       grid: { color: 'grey' },
//       border: { color: 'black' },
//       ticks: { color: 'black' }
//     },
//     y: {
//       type: 'linear',
//       beginAtZero: true,
//       grid: { color: 'grey' },
//       border: { color: 'black' },
//       ticks: { color: 'black' }
//     }
//   }
// };

// Chart.overrides.scatter = {
//   indexAxis: 'x',
//   scales: {
//     x: {
//       type: 'linear',
//       title: { display: true, text: 'X Axis' },
//       grid: { color: 'grey' },
//       border: { color: 'black' },
//       ticks: { color: 'black' }
//     },
//     y: {
//       type: 'linear',
//       beginAtZero: true,
//       title: { display: true, text: 'Y Axis' },
//       grid: { color: 'grey' },
//       border: { color: 'black' },
//       ticks: { color: 'black' }
//     }
//   }
// };

// Chart.overrides.matrix = {
//   indexAxis: 'x',
//   scales: {
//     x: {
//       type: 'category',
//       offset: true,
//       grid: { display: false },
//       border: { color: 'black' },
//       ticks: { color: 'black' }
//     },
//     y: {
//       type: 'category',
//       offset: true,
//       grid: { display: false },
//       border: { color: 'black' },
//       ticks: { color: 'black' }
//     }
//   }
// };

// // =======================================
// // UNIVERSAL DATASET HANDLER
// // =======================================
// function getDatasetByChartType(chartType, data, colorList) {
//   if (chartType === 'scatter' || chartType === 'bubble') {
//     return {
//       label: data.label || 'Data',
//       data: data.xy,
//       backgroundColor: 'rgba(0, 102, 204, 0.6)',
//       borderColor: 'black',
//       borderWidth: 1
//     };
//   }

//   if (chartType === 'matrix') {
//     return {
//       label: data.label || 'Heatmap',
//       data: data.matrix,
//       backgroundColor: ctx => {
//         const v = ctx.raw.v;
//         return v > 80 ? '#B82C3D'
//              : v > 60 ? '#D58690'
//              : v > 40 ? '#F0E0E2'
//              : v > 20 ? '#A4CBE0'
//              : '#BAD7E6';
//       },
//       borderWidth: 1,
//       width: ctx => ctx.chart.chartArea.width / data.columns.length,
//       height: ctx => ctx.chart.chartArea.height / data.rows.length
//     };
//   }

//   // default for bar, line, pie etc
//   return {
//     label: data.label || 'Data',
//     data: data.y,
//     backgroundColor: (data.x || []).map((_, i) => colorList[i % colorList.length]),
//     borderColor: 'grey',
//     borderWidth: 2,
//     fill: chartType === 'line' ? false : true,
//     tension: 0.3
//   };
// }

