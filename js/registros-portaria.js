import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, getFirestore, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { app } from './main.js';
import { checkAuth } from './auth.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Verificar autenticação antes de qualquer coisa
checkAuth();

// Cleanup ao fechar a página
window.addEventListener('beforeunload', () => {
    stopCamera();
});

let currentVehicleId = null;
let currentVehicles = [];
let selectedVehicle = null;

let mediaStream = null;
let videoElement = null;

// Função para parar a câmera
function stopCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
            track.stop();
        });
        mediaStream = null;
    }
}

// Função para lidar com fotos
window.handlePhoto = async function(type) {
    const vehicle = currentVehicles.find(v => v.id === currentVehicleId);
    if (!vehicle) return;

    const photoField = type === 'doc' ? 'docPhoto' : 'vehiclePhoto';
    const requestField = type === 'doc' ? 'documentPhotoRequested' : 'vehiclePhotoRequested';

    // Se já existe uma foto
    if (vehicle[photoField]) {
        const result = await Swal.fire({
            title: 'Foto existente',
            imageUrl: vehicle[photoField],
            imageWidth: 400,
            imageHeight: 300,
            showDenyButton: true,
            denyButtonText: 'Excluir',
            denyButtonColor: '#d33',
            showCancelButton: true,
            cancelButtonText: 'Download',
            cancelButtonColor: '#3085d6',
            width: '80%'
        });

        if (result.isDenied) {
            // Excluir foto
            try {
                await updateDoc(doc(db, 'veiculos', currentVehicleId), {
                    [photoField]: null,
                    [requestField]: false
                });
                Swal.fire('Foto excluída com sucesso!', '', 'success');
            } catch (error) {
                console.error('Erro ao excluir foto:', error);
                Swal.fire('Erro ao excluir foto', '', 'error');
            }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Download
            const a = document.createElement('a');
            a.href = vehicle[photoField];
            a.download = `${vehicle.plate}_${type === 'doc' ? 'documento' : 'veiculo'}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        return;
    }

    // Se já existe uma solicitação pendente
    if (vehicle[requestField]) {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Solicitação já enviada',
            text: `Já existe uma solicitação pendente para foto ${type === 'doc' ? 'do documento' : 'do veículo'}. Deseja cancelar a solicitação?`,
            showCancelButton: true,
            confirmButtonText: 'Sim, cancelar',
            cancelButtonText: 'Não',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#2E7D32'
        });

        if (result.isConfirmed) {
            try {
                await updateDoc(doc(db, 'veiculos', currentVehicleId), {
                    [requestField]: false
                });
                Swal.fire('Solicitação cancelada!', '', 'success');
            } catch (error) {
                console.error('Erro ao cancelar solicitação:', error);
                Swal.fire('Erro ao cancelar solicitação', '', 'error');
            }
        }
        return;
    }

    // Iniciar captura de foto
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement = document.createElement('video');
        videoElement.srcObject = mediaStream;
        videoElement.autoplay = true;

        const result = await Swal.fire({
            backdrop: 'static',
            allowOutsideClick: false,
            showCloseButton: false,
            title: 'Capturar foto',
            html: videoElement,
            showCancelButton: true,
            confirmButtonText: 'Capturar',
            cancelButtonText: 'Cancelar',
            didOpen: () => {
                Swal.getConfirmButton().focus();
            },
            willClose: () => {
                stopCamera();
            }
        });

        if (result.isConfirmed) {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            canvas.getContext('2d').drawImage(videoElement, 0, 0);
            
            stopCamera();

            const photoData = canvas.toDataURL('image/jpeg');
            try {
                await updateDoc(doc(db, 'veiculos', currentVehicleId), {
                    [photoField]: photoData,
                    [requestField]: false
                });
                Swal.fire('Foto salva com sucesso!', '', 'success');
            } catch (error) {
                console.error('Erro ao salvar foto:', error);
                Swal.fire('Erro ao salvar foto', '', 'error');
            }
        }
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        Swal.fire('Erro ao acessar câmera', 'Verifique se a câmera está disponível e se você concedeu permissão.', 'error');
    } finally {
        stopCamera();
    }
}

// Carregar registros
function loadVehicles(dateFilter = '') {
    let q = query(collection(db, 'veiculos'), orderBy('createdAt', 'desc'));

    if (dateFilter) {
        const start = new Date(dateFilter); 
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter); 
        end.setHours(23, 59, 59, 999);
        q = query(collection(db, 'veiculos'),
            where('createdAt', '>=', start),
            where('createdAt', '<=', end),
            orderBy('createdAt', 'desc'));
    }

    onSnapshot(q, (snapshot) => {
        currentVehicles = [];
        const tableBody = document.getElementById('vehiclesTableBody');
        tableBody.innerHTML = '';

        if (snapshot.empty) {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = `
                <td colspan="8" class="no-data-message">
                    <i class="fas fa-info-circle"></i> Nenhum veículo registrado.
                </td>
            `;
            tableBody.appendChild(noDataRow);
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            currentVehicles.push({ id: doc.id, ...data });

            const docPending = data.documentPhotoRequested && !data.docPhoto;
            const vehPending = data.vehiclePhotoRequested && !data.vehiclePhoto;

            const totalPending = [docPending, vehPending].filter(Boolean).length;
            const hasAnyPhoto = !!data.docPhoto || !!data.vehiclePhoto;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : ''}</td>
                <td>${data.plate}</td>
                <td>${data.trailerPlate || '-'}</td>
                <td>${data.driverName || '-'}</td>
                <td>${data.driverPhone || '-'}</td>
                <td>${data.container || '-'}</td>
                <td>
                    <span class="status-badge ${data.status}">
                        ${data.status === 'scheduled' ? 'Na Programação' :
                          data.status === 'unscheduled' ? 'Fora da Programação' :
                          data.status === 'completed' ? 'Concluído' :
                          data.status === 'cancelled' ? 'Cancelado' :
                          data.status === 'pending' ? 'Pendente' : 'Aguardando'}
                    </span>
                </td>
                <td>${data.observations || '-'}</td>
                <td>
                    <button onclick="openActionModal('${doc.id}')" class="btn-primary position-relative">
                        <i class="fas fa-edit"></i>
                        ${totalPending > 0
                            ? `<span class="notification-badge total-badge">${totalPending}</span>`
                            : (hasAnyPhoto
                                ? '<span class="success-badge"><i class="fas fa-check"></i></span>'
                                : '')
                        }
                    </button>
                        <button class="btn-danger btn-delete position-relative" title="Excluir registro" onclick="deleteVehicle('${doc.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

window.deleteVehicle = async function(docId) {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: 'Tem certeza que deseja excluir este registro?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, 'veiculos', docId));
            Swal.fire({
                icon: 'success',
                title: 'Registro excluído',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Erro ao excluir registro:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Não foi possível excluir o registro.'
            });
        }
    }
}
// Filtrar registros
function filterVehicles(searchTerm) {
    const tableBody = document.getElementById('vehiclesTableBody');
    tableBody.innerHTML = '';

    // Filtra os veículos com base no termo de busca
    const filteredVehicles = currentVehicles.filter(vehicle => {
        return (
            vehicle.plate.toLowerCase().includes(searchTerm) ||
            vehicle.trailerPlate?.toLowerCase().includes(searchTerm) ||
            vehicle.driverName?.toLowerCase().includes(searchTerm) ||
            vehicle.driverPhone?.toLowerCase().includes(searchTerm)
        );
    });

    // Se não encontrar veículos após o filtro, exibe mensagem
    if (filteredVehicles.length === 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.innerHTML = `
            <td colspan="8" class="no-data-message">
                <i class="fas fa-info-circle"></i> Nenhum veículo encontrado.
            </td>
        `;
        tableBody.appendChild(noResultsRow);
        return;
    }

    // Caso encontre veículos, renderiza as linhas normalmente
    filteredVehicles.forEach(vehicle => {
        const docPending = vehicle.documentPhotoRequested && !vehicle.docPhoto;
        const vehPending = vehicle.vehiclePhotoRequested && !vehicle.vehiclePhoto;

        const totalPending = [docPending, vehPending].filter(Boolean).length;
        const showSuccess = (vehicle.documentPhotoRequested || vehicle.vehiclePhotoRequested) && totalPending === 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehicle.createdAt ? new Date(vehicle.createdAt.toDate()).toLocaleString() : ''}</td>
            <td>${vehicle.plate}</td>
            <td>${vehicle.trailerPlate || '-'}</td>
            <td>${vehicle.driverName || '-'}</td>
            <td>${vehicle.driverPhone || '-'}</td>
            <td>${vehicle.container || '-'}</td>
            <td>
                <span class="status-badge ${vehicle.status}">
                    ${vehicle.status === 'scheduled' ? 'Na Programação' :
                      vehicle.status === 'unscheduled' ? 'Fora da Programação' :
                      vehicle.status === 'completed' ? 'Concluído' :
                      vehicle.status === 'cancelled' ? 'Cancelado' :
                      vehicle.status === 'pending' ? 'Pendente' : 'Aguardando'}
                </span>
            </td>
            <td>
                <button onclick="openActionModal('${vehicle.id}')" class="btn-primary position-relative">
                    <i class="fas fa-edit"></i>
                    ${
                      totalPending > 0
                        ? `<span class="notification-badge total-badge">${totalPending}</span>`
                        : (showSuccess
                            ? '<span class="success-badge"><i class="fas fa-check"></i></span>'
                            : '')
                    }
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}


// Função para lidar com fotos (documentos ou veículo)
window.handlePhoto = async function(type) {
    if (!currentVehicleId) return;

    try {
        const vehicleRef = doc(db, 'veiculos', currentVehicleId);
        const vehicleDoc = await getDoc(vehicleRef);
        const data = vehicleDoc.data();
        const photoField = type === 'doc' ? 'docPhoto' : 'vehiclePhoto';

        // Se já existe uma foto, mostra opção de visualizar
        if (data[photoField]) {
            const result = await Swal.fire({
                title: `Foto ${type === 'doc' ? 'do Documento' : 'do Veículo'}`,
                imageUrl: data[photoField],
                imageAlt: type === 'doc' ? 'Documento' : 'Veículo',
                showConfirmButton: true,
                confirmButtonText: 'Nova Foto',
                confirmButtonColor: '#2E7D32',
                showCancelButton: true,
                cancelButtonText: 'Fechar',
                cancelButtonColor: '#6c757d',
                width: '80%'
            });

            if (result.isConfirmed) {
                // Usuário quer tirar uma nova foto
                return await captureNewPhoto(type, vehicleRef, data, photoField);
            }
            return;
        }

        // Se não tem foto, permite capturar uma nova
        return await captureNewPhoto(type, vehicleRef, data, photoField);
    } catch (error) {
        console.error('Erro ao manipular foto:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível manipular a foto.',
            confirmButtonColor: '#2E7D32'
        });
    }
};

// Função auxiliar para capturar nova foto
async function captureNewPhoto(type, vehicleRef, data, photoField) {
    try {
        const result = await Swal.fire({
            title: `Foto ${type === 'doc' ? 'do Documento' : 'do Veículo'}`,
            html: `
                <div class="photo-upload-container">
                    <div id="previewContainer" class="preview-container hidden">
                        <img id="photoPreview" src="" alt="Preview">
                    </div>
                    <div class="upload-options">
                        <input type="file" id="photoInput" accept="image/*" capture="environment" class="hidden">
                        <button id="uploadBtn" class="swal2-confirm swal2-styled">
                            <i class="fas fa-upload"></i> Escolher Arquivo
                        </button>
                        <button id="cameraBtn" class="swal2-confirm swal2-styled">
                            <i class="fas fa-camera"></i> Usar Câmera
                        </button>
                    </div>
                </div>
            `,
            showCancelButton: true,
            showConfirmButton: true,
            confirmButtonText: 'Salvar',
            confirmButtonColor: '#2E7D32',
            cancelButtonText: 'Cancelar',
            cancelButtonColor: '#d33',
            allowOutsideClick: false,
            preConfirm: () => {
                const photoPreview = document.getElementById('photoPreview');
                if (!photoPreview.src || photoPreview.src === '') {
                    Swal.showValidationMessage('Por favor, selecione ou capture uma foto primeiro.');
                    return false;
                }
                return photoPreview.src;
            },
            didOpen: () => {
                const photoInput = document.getElementById('photoInput');
                const uploadBtn = document.getElementById('uploadBtn');
                const cameraBtn = document.getElementById('cameraBtn');
                const previewContainer = document.getElementById('previewContainer');
                const photoPreview = document.getElementById('photoPreview');
                
                // Desabilita o botão de confirmar até ter uma foto
                Swal.getConfirmButton().disabled = true;

                // Função para lidar com a seleção de arquivo
                photoInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            photoPreview.src = e.target.result;
                            previewContainer.classList.remove('hidden');
                            Swal.getConfirmButton().disabled = false;
                        };
                        reader.readAsDataURL(file);
                    }
                };

                // Função para abrir a câmera
                const openCamera = async () => {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { 
                                facingMode: 'environment',
                                width: { ideal: 1920 },
                                height: { ideal: 1080 }
                            } 
                        });
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        video.autoplay = true;
                        video.style.width = 'auto';
                        video.style.height = 'auto';
                        video.style.maxHeight = '300px';

                        previewContainer.innerHTML = '';
                        previewContainer.appendChild(video);
                        previewContainer.classList.remove('hidden');

                        // Botão para capturar foto
                        const captureBtn = document.createElement('button');
                        captureBtn.className = 'swal2-confirm swal2-styled';
                        captureBtn.innerHTML = '<i class="fas fa-camera"></i> Capturar';
                        previewContainer.appendChild(captureBtn);

                        // Desabilita o botão de confirmar enquanto estiver na câmera
                        Swal.getConfirmButton().disabled = true;

                        captureBtn.onclick = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            
                            // Desenha a imagem do vídeo no canvas com a melhor qualidade
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.drawImage(video, 0, 0);
                            
                            // Parar a câmera
                            stream.getTracks().forEach(track => track.stop());
                            
                            // Mostrar preview da foto capturada
                            photoPreview.src = canvas.toDataURL('image/jpeg', 0.9); // 90% de qualidade
                            previewContainer.innerHTML = '';
                            previewContainer.appendChild(photoPreview);
                            
                            // Habilitar botão de confirmar
                            Swal.getConfirmButton().disabled = false;
                        };
                    } catch (error) {
                        console.error('Erro ao acessar câmera:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Erro',
                            text: 'Não foi possível acessar a câmera.',
                            confirmButtonColor: '#2E7D32'
                        });
                    }
                };

                // Event listeners para os botões
                uploadBtn.onclick = () => photoInput.click();
                cameraBtn.onclick = openCamera;
            },
            preConfirm: () => {
                return new Promise((resolve) => {
                    const photoPreview = document.getElementById('photoPreview');
                    if (photoPreview.src) {
                        // Converter para base64 se necessário
                        if (photoPreview.src.startsWith('data:')) {
                            resolve(photoPreview.src);
                        } else {
                            const canvas = document.createElement('canvas');
                            canvas.width = photoPreview.naturalWidth;
                            canvas.height = photoPreview.naturalHeight;
                            canvas.getContext('2d').drawImage(photoPreview, 0, 0);
                            resolve(canvas.toDataURL('image/jpeg'));
                        }
                    } else {
                        resolve(null);
                    }
                });
            }
        });

        if (result.dismiss === Swal.DismissReason.cancel) {
            return;
        }

        const base64Image = result.value;
        if (!base64Image) return;

        // Atualizar documento com a foto
        await updateDoc(vehicleRef, {
            [photoField]: base64Image,
            [`${photoField}Timestamp`]: serverTimestamp(),
            [`notifications.${type}.status`]: 'completed',
            [`notifications.${type}.completedAt`]: serverTimestamp(),
            [`${type === 'doc' ? 'document' : 'vehicle'}PhotoRequested`]: false
        });

        // Atualizar interface
        const notificationBadge = document.getElementById(`${type}Notification`);
        const successBadge = document.getElementById(`${type}Success`);
        
        if (notificationBadge) notificationBadge.classList.add('hidden');
        if (successBadge) successBadge.classList.remove('hidden');

        await Swal.fire({
            icon: 'success',
            title: 'Foto anexada com sucesso',
            text: `A foto ${type === 'doc' ? 'do documento' : 'do veículo'} foi anexada com sucesso.`,
            confirmButtonColor: '#2E7D32'
        });

    } catch (error) {
        console.error('Erro ao anexar foto:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível anexar a foto.',
            confirmButtonColor: '#2E7D32'
        });
    }
};

// Modal de ações
window.openActionModal = async (vehicleId) => {
    try {
        const vehicleDoc = await getDoc(doc(db, 'veiculos', vehicleId));
        if (!vehicleDoc.exists()) return;

        const data = vehicleDoc.data();
        currentVehicleId = vehicleId;

        // Atualiza informações básicas
        document.getElementById('modalPlate').textContent = data.plate +
            (data.trailerPlate ? ` / ${data.trailerPlate}` : '');
        document.getElementById('modalDriver').textContent = data.driverName || '-';
        document.getElementById('modalPhone').textContent = data.driverPhone || '-';
        const statusElement = document.getElementById('editStatus');
        // Remove classes de status anteriores
        statusElement.className = 'status-badge';
        // Define o texto do status
        const statusText = data.status === 'scheduled' ? 'Na Programação' :
                   data.status === 'unscheduled' ? 'Fora da Programação' :
                   data.status === 'completed' ? 'Concluído' :
                   data.status === 'cancelled' ? 'Cancelado' :
                   data.status === 'pending' ? 'Pendente' : 'Aguardando';

        statusElement.textContent = statusText;

// Adiciona a classe do status para aplicar a cor
statusElement.classList.add(data.status || 'aguardando');


        // Verifica notificações e fotos
        const docNotification = document.getElementById('docNotification');
        const vehicleNotification = document.getElementById('vehicleNotification');
        const docSuccess = document.getElementById('docSuccess');
        const vehicleSuccess = document.getElementById('vehicleSuccess');

        // Mostra badge vermelho se houver solicitação pendente
        if (docNotification) docNotification.classList.toggle('hidden', !data.documentPhotoRequested || data.docPhoto);
        if (vehicleNotification) vehicleNotification.classList.toggle('hidden', !data.vehiclePhotoRequested || data.vehiclePhoto);

        // Mostra badge verde se houver foto anexada
        if (docSuccess) docSuccess.classList.toggle('hidden', !data.docPhoto);
        if (vehicleSuccess) vehicleSuccess.classList.toggle('hidden', !data.vehiclePhoto);

    } catch (error) {
        console.error('Erro ao abrir modal:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar os dados do veículo.',
            confirmButtonColor: '#2E7D32'
        });
    }

    const modal = document.getElementById('actionModal');
    modal.classList.remove('hidden');
};

window.closeActionModal = () => {
    document.getElementById('actionModal').classList.add('hidden');
    selectedVehicle = null;
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Busca
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterVehicles(searchTerm);
    });

    // Carregar registros iniciais
    loadVehicles();
});

// Função para lidar com ligações telefônicas
window.handleCall = function() {
    const phoneNumber = document.getElementById('modalPhone').textContent;
    if (phoneNumber && phoneNumber !== '-') {
        window.location.href = `tel:${phoneNumber.replace(/\D/g, '')}`;
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Telefone não disponível',
            text: 'Não há número de telefone cadastrado para este motorista.',
            confirmButtonColor: '#2E7D32'
        });
    }
};

// Iniciar quando autenticado
auth.onAuthStateChanged((user) => {
    if (user) {
        loadVehicles();
    }
});

function exportTableToExcel(filename) {
    const table = document.getElementById('vehiclesTable');
    const worksheetData = [];

    const rows = table.querySelectorAll('tr');
    let ignoreIndex = -1;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const cells = row.querySelectorAll('th, td');
        const rowData = [];

        if (rowIndex === 0) {
            cells.forEach((cell, i) => {
                if (cell.innerText.trim().toLowerCase() === 'ações') {
                    ignoreIndex = i;
                }
            });
        }

        cells.forEach((cell, i) => {
            if (rowIndex === 0) {
                if (cell.innerText.trim().toLowerCase() === 'data/hora') {
                    rowData.push('Data');
                    rowData.push('Hora');
                } else if (i !== ignoreIndex) {
                    rowData.push(cell.innerText);
                }
            } else {
                if (i === 0) {
                    const parts = cell.innerText.split(',');
                    if (parts.length === 2) {
                        rowData.push(parts[0].trim());
                        rowData.push(parts[1].trim());
                    } else {
                        rowData.push(cell.innerText.trim());
                        rowData.push('');
                    }
                } else if (i !== ignoreIndex) {
                    rowData.push(cell.innerText);
                }
            }
        });

        worksheetData.push(rowData);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');

    XLSX.writeFile(workbook, filename);
}

// Evento do botão
document.getElementById('exportExcelBtn').addEventListener('click', () => {
    exportTableToExcel('Registros_Portaria.xlsx');
});

