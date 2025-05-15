// function downloadFile(folder, filename) {
//     const fullPath = folder ? `${folder}/${filename}` : filename;
//     const encoded = encodeURIComponent(fullPath);
//     window.location.href = `/download_file/${encoded}`;
// }


// function deleteFile(folder, filename) {
//     const fullPath = folder ? `${folder}/${filename}` : filename;
//     if (confirm('Are you sure you want to delete ' + fullPath + '?')) {
//         $.post(`/delete_file/${fullPath}`, function(response) {
//             alert(response.message);
//             location.reload();
//         });
//     }
// }


function downloadFile(folder, filename) {
    const encoded = encodeURIComponent(filename);
    window.location.href = `/download_file/${folder}/${encoded}`;
}

function deleteFile(folder, filename) {
    const encoded = encodeURIComponent(filename);
    if (confirm('Are you sure you want to delete ' + filename)) {
        fetch(`/delete_file/${folder}/${encoded}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                location.reload();
            })
            .catch(() => alert(data.message));
    }
}
