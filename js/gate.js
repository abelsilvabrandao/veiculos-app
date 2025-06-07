import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { app } from './main.js';

const db = getFirestore(app);
const auth = getAuth(app);

let currentVehicles = [];
let selectedVehicleId = null;

// Carregar e exibir veículos
function loadVehicles() {
    const q = query(
        collection(db, 'veiculos'),
        orderBy('createdAt', 'desc')
    );

    onSnapshot(q, (snapshot) => {
        currentVehicles = [];
        const tableBody = document.getElementById('vehiclesTableBody');
        tableBody.innerHTML = '';

        snapshot.forEach((doc) => {
            const data = doc.data();
            currentVehicles.push({ id: doc.id, ...data });

            const row = document.createElement('tr');
            const statusClass = data.status === 'aguardando' ? 'aguardando' :
                data.status === 'scheduled' ? 'scheduled' :
                data.status === 'unscheduled' ? 'unscheduled' :
                data.status === 'completed' ? 'completed' :
                data.status === 'cancelled' ? 'cancelled' : 'pending';

            const statusText = data.status === 'aguardando' ? 'Aguardando' :
                data.status === 'scheduled' ? 'Na Programação' :
                data.status === 'unscheduled' ? 'Fora da Programação' :
                data.status === 'completed' ? 'Concluído' :
                data.status === 'cancelled' ? 'Cancelado' : 'Pendente';

            // ✅ Cálculo dos badges
            const docRequested = data.documentPhotoRequested;
            const vehRequested = data.vehiclePhotoRequested;

            const docPending = docRequested && !data.docPhoto;
            const vehPending = vehRequested && !data.vehiclePhoto;

            const totalRequested = (docRequested ? 1 : 0) + (vehRequested ? 1 : 0);
            const totalPending = (docPending ? 1 : 0) + (vehPending ? 1 : 0);
            const showSuccess = (!!data.docPhoto || !data.documentPhotoRequested) &&
                    (!!data.vehiclePhoto || !data.vehiclePhotoRequested) &&
                    (data.docPhoto || data.vehiclePhoto);

            const showPending = totalPending > 0;

            row.innerHTML = `
                <td>${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : ''}</td>
                <td>${data.plate}</td>
                <td>${data.trailerPlate || '-'}</td>
                <td>${data.driverName || '-'}</td>
                <td>${data.driverPhone || '-'}</td>
                <td>${data.container || '-'}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>${data.observations || '-'}</td>
                <td>
                    <button onclick="openActionModal('${doc.id}')" class="btn-primary position-relative">
                        <i class="fas fa-edit"></i>
                        ${showSuccess
                          ? '<span class="success-badge"><i class="fas fa-check"></i></span>'
                          : (showPending
                            ? `<span class="notification-badge total-badge">${totalPending}</span>`
                            : '')
                        }
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        // ✅ Atualizar os badges gerais de pendências após carregar
        const pendencias = contarPendencias();
        const badgeDocContainer = document.getElementById('badgeDoc');
        const badgeVehicleContainer = document.getElementById('badgeVehicle');

        if (badgeDocContainer) {
            badgeDocContainer.innerHTML = pendencias.countDoc > 0
                ? `<span class="notification-badge doc-badge">${pendencias.countDoc}</span>`
                : '';
        }

        if (badgeVehicleContainer) {
            badgeVehicleContainer.innerHTML = pendencias.countVehicle > 0
                ? `<span class="notification-badge vehicle-badge">${pendencias.countVehicle}</span>`
                : '';
        }
    });
}

function contarPendencias() {
    let countDoc = currentVehicles.filter(v => v.documentPhotoRequested && !v.docPhoto).length;
    let countVehicle = currentVehicles.filter(v => v.vehiclePhotoRequested && !v.vehiclePhoto).length;
    return { countDoc, countVehicle };
}

// Filtrar veículos
document.getElementById('statusSelect').addEventListener('change', () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filterVehicles(searchTerm);
});

document.getElementById('pendingSelect').addEventListener('change', () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filterVehicles(searchTerm);
});

['startDate', 'startTime', 'endDate', 'endTime'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        filterVehicles(searchTerm);
    });
});

document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterVehicles(searchTerm);
});

function filterVehicles(searchTerm) {
    const pendingFilter = document.getElementById('pendingSelect').value;
    const selectedStatus = document.getElementById('statusSelect').value;
    const startDate = document.getElementById('startDate').value;
    const startTime = document.getElementById('startTime').value;
    const endDate = document.getElementById('endDate').value;
    const endTime = document.getElementById('endTime').value;

    let startDateTime = null;
    let endDateTime = null;

    if (startDate) {
        startDateTime = new Date(startDate + 'T' + (startTime || '00:00'));
    }
    if (endDate) {
        endDateTime = new Date(endDate + 'T' + (endTime || '23:59'));
    }

    const tableBody = document.getElementById('vehiclesTableBody');
    tableBody.innerHTML = '';

    currentVehicles.forEach(vehicle => {
        const matchesSearch = vehicle.plate.toLowerCase().includes(searchTerm) ||
            vehicle.trailerPlate?.toLowerCase().includes(searchTerm) ||
            vehicle.driverName?.toLowerCase().includes(searchTerm);

        const matchesStatus = selectedStatus === 'all' || vehicle.status === selectedStatus;

        let matchesDateTime = true;
        if (startDateTime || endDateTime) {
            const vehicleDate = vehicle.createdAt ? vehicle.createdAt.toDate() : null;
            if (!vehicleDate) {
                matchesDateTime = false;
            } else {
                if (startDateTime && vehicleDate < startDateTime) matchesDateTime = false;
                if (endDateTime && vehicleDate > endDateTime) matchesDateTime = false;
            }
        }

        const hasPending = (vehicle.documentPhotoRequested && !vehicle.docPhoto) ||
            (vehicle.vehiclePhotoRequested && !vehicle.vehiclePhoto);

        let matchesPending = true;
        if (pendingFilter === 'with') {
            matchesPending = hasPending;
        } else if (pendingFilter === 'without') {
            matchesPending = !hasPending;
        }

        if (matchesSearch && matchesStatus && matchesDateTime && matchesPending) {
            const row = document.createElement('tr');

            const statusClass = vehicle.status === 'aguardando' ? 'aguardando' :
                vehicle.status === 'scheduled' ? 'scheduled' :
                vehicle.status === 'unscheduled' ? 'unscheduled' :
                vehicle.status === 'completed' ? 'completed' :
                vehicle.status === 'cancelled' ? 'cancelled' : 'pending';

            const statusText = vehicle.status === 'aguardando' ? 'Aguardando' :
                vehicle.status === 'scheduled' ? 'Na Programação' :
                vehicle.status === 'unscheduled' ? 'Fora da Programação' :
                vehicle.status === 'completed' ? 'Concluído' :
                vehicle.status === 'cancelled' ? 'Cancelado' : 'Pendente';

            const docRequested = vehicle.documentPhotoRequested;
            const vehRequested = vehicle.vehiclePhotoRequested;

            const docPending = docRequested && !vehicle.docPhoto;
            const vehPending = vehRequested && !vehicle.vehiclePhoto;

            const totalRequested = (docRequested ? 1 : 0) + (vehRequested ? 1 : 0);
            const totalPending = (docPending ? 1 : 0) + (vehPending ? 1 : 0);

            const showSuccess = (!!vehicle.docPhoto || !vehicle.documentPhotoRequested) &&
                    (!!vehicle.vehiclePhoto || !vehicle.vehiclePhotoRequested) &&
                    (vehicle.docPhoto || vehicle.vehiclePhoto);

            const showPending = totalPending > 0;

            row.innerHTML = `
                <td>${vehicle.createdAt ? new Date(vehicle.createdAt.toDate()).toLocaleString() : ''}</td>
                <td>${vehicle.plate}</td>
                <td>${vehicle.trailerPlate || '-'}</td>
                <td>${vehicle.driverName || '-'}</td>
                <td>${vehicle.driverPhone || '-'}</td>
                <td>${vehicle.container || '-'}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>${vehicle.observations || '-'}</td>
                <td>
                    <button onclick="openActionModal('${vehicle.id}')" class="btn-primary position-relative">
                        <i class="fas fa-edit"></i>
                        ${showSuccess
                          ? '<span class="success-badge"><i class="fas fa-check"></i></span>'
                          : (showPending
                            ? `<span class="notification-badge total-badge">${totalPending}</span>`
                            : '')
                        }
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        }
    });
}


document.getElementById('pendingSelect').addEventListener('change', () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filterVehicles(searchTerm);
});

// Função para abrir o modal de edição
window.openActionModal = (vehicleId) => {
    selectedVehicleId = vehicleId;
    const vehicle = currentVehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) return;

    document.getElementById('modalPlate').textContent = vehicle.plate + (vehicle.trailerPlate ? ` / ${vehicle.trailerPlate}` : '');
    document.getElementById('modalDriver').textContent = vehicle.driverName || '-';
    document.getElementById('editStatus').value = vehicle.status || 'aguardando';
    document.getElementById('editObservations').value = vehicle.observations || '';

    // Atualiza notificações e badges de sucesso
 atualizarBadgesModal(vehicle);

    document.getElementById('actionModal').classList.remove('hidden');
};

window.closeActionModal = () => {
    document.getElementById('actionModal').classList.add('hidden');
    selectedVehicleId = null;

    // Resetar badges do modal
    document.getElementById('docNotification').classList.add('hidden');
    document.getElementById('vehicleNotification').classList.add('hidden');
    document.getElementById('docSuccess').classList.add('hidden');
    document.getElementById('vehicleSuccess').classList.add('hidden');
};

// Função para ligar para o motorista
window.handleCall = () => {
    const selectedVehicle = currentVehicles.find(v => v.id === selectedVehicleId);
    if (selectedVehicle?.driverPhone) {
        window.location.href = `tel:${selectedVehicle.driverPhone}`;
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Telefone não disponível',
            text: 'Não há número de telefone registrado para este motorista.'
        });
    }
};

// Função para solicitar ou visualizar foto
window.handlePhoto = async function(type) {
    if (!selectedVehicleId) return;

    const vehicle = currentVehicles.find(v => v.id === selectedVehicleId);
    const photoField = type === 'doc' ? 'docPhoto' : 'vehiclePhoto';
    const requestField = type === 'doc' ? 'documentPhotoRequested' : 'vehiclePhotoRequested';

    // Função para fazer download da imagem
    const downloadImage = (imageData, fileName) => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Função para deletar a foto
    // Função para deletar a foto
const deletePhoto = async () => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir a foto ${type === 'doc' ? 'do documento' : 'do veículo'}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
        try {
            await updateDoc(doc(db, 'veiculos', selectedVehicleId), {
                [photoField]: null,
                [`${photoField}Timestamp`]: null,
                [requestField]: true,
                [`notifications.${type}`]: {
                    type: type,
                    timestamp: serverTimestamp(),
                    status: 'pending'
                }
            });

            // Atualiza os badges
            document.getElementById(`${type}Success`).classList.add('hidden');
            document.getElementById(`${type}Notification`).classList.remove('hidden');

            // Atualiza o veículo na lista
            const vehicleIndex = currentVehicles.findIndex(v => v.id === selectedVehicleId);
            if (vehicleIndex !== -1) {
                currentVehicles[vehicleIndex][photoField] = null;
                currentVehicles[vehicleIndex][`${photoField}Timestamp`] = null;
                currentVehicles[vehicleIndex][requestField] = true;
                currentVehicles[vehicleIndex].notifications = {
                    ...currentVehicles[vehicleIndex].notifications,
                    [type]: {
                        type: type,
                        timestamp: new Date(),
                        status: 'pending'
                    }
                };
            }

            Swal.fire({
                title: 'Excluído!',
                text: 'A foto foi excluída e a pendência reaberta.',
                icon: 'success',
                confirmButtonColor: '#2E7D32'
            });
        } catch (error) {
            console.error('Erro ao excluir foto:', error);
            Swal.fire({
                title: 'Erro',
                text: 'Não foi possível excluir a foto.',
                icon: 'error'
            });
        }
    }
};


    // Se já existe uma foto, mostra ela
    if (vehicle?.[photoField]) {
        await Swal.fire({
            title: type === 'doc' ? 'Foto do Documento' : 'Foto do Veículo',
            imageUrl: vehicle[photoField],
            imageAlt: type === 'doc' ? 'Documento' : 'Veículo',
            showConfirmButton: true,
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#2E7D32',
            showDenyButton: true,
            denyButtonText: 'Excluir',
            denyButtonColor: '#d33',
            showCancelButton: true,
            cancelButtonText: 'Download',
            cancelButtonColor: '#3085d6',
            width: '80%'
        }).then((result) => {
            if (result.isDenied) {
                deletePhoto();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                downloadImage(
                    vehicle[photoField], 
                    `${vehicle.plate}_${type === 'doc' ? 'documento' : 'veiculo'}.jpg`
                );
            }
        });
        return;
    }
    // Se já existe uma solicitação pendente
    if (vehicle?.[requestField]) {
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
                await updateDoc(doc(db, 'veiculos', selectedVehicleId), {
                    [requestField]: false,
                    [`notifications.${type}`]: null
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Solicitação cancelada',
                    text: `A solicitação de foto ${type === 'doc' ? 'do documento' : 'do veículo'} foi cancelada.`,
                    confirmButtonColor: '#2E7D32'
                });

                document.getElementById(`${type}Notification`).classList.add('hidden');
            } catch (error) {
                console.error('Erro ao cancelar solicitação:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Não foi possível cancelar a solicitação de foto.'
                });
            }
        }
        return;
    }
    // Se não tem foto nem solicitação, pergunta se quer solicitar
    try {
        const result = await Swal.fire({
            icon: 'question',
            title: 'Confirmação',
            text: `Deseja enviar solicitação de foto ${type === 'doc' ? 'do documento' : 'do veículo'}?`,
            showCancelButton: true,
            confirmButtonText: 'Sim, enviar',
            cancelButtonText: 'Não',
            confirmButtonColor: '#2E7D32',
            cancelButtonColor: '#d33'
        });

        if (result.isConfirmed) {
            const notification = {
                type: type,
                timestamp: serverTimestamp(),
                status: 'pending'
            };

            await updateDoc(doc(db, 'veiculos', selectedVehicleId), {
                [requestField]: true,
                [`notifications.${type}`]: notification
            });

            document.getElementById(`${type}Notification`).classList.remove('hidden');

            Swal.fire({
                icon: 'success',
                title: 'Solicitação enviada',
                text: `Solicitação de foto ${type === 'doc' ? 'do documento' : 'do veículo'} enviada com sucesso.`,
                confirmButtonColor: '#2E7D32'
            });
        }
    } catch (error) {
        console.error('Erro ao solicitar foto:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível enviar a solicitação de foto.'
        });
    }
};

// Atualizar veículo
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedVehicleId) return;

    try {
        const vehicleRef = doc(db, 'veiculos', selectedVehicleId);
        await updateDoc(vehicleRef, {
            status: document.getElementById('editStatus').value,
            observations: document.getElementById('editObservations').value,
            updatedAt: new Date(),
            updatedBy: {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email
            }
        });

        closeActionModal();
    } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
        alert('Erro ao atualizar veículo. Tente novamente.');
    }
});

// Iniciar carregamento quando autenticado
auth.onAuthStateChanged((user) => {
    if (user) {
        loadVehicles();
    }
});

function atualizarBadgesModal(vehicle) {
    const docNotification = document.getElementById('docNotification');
    const vehicleNotification = document.getElementById('vehicleNotification');
    const docSuccess = document.getElementById('docSuccess');
    const vehicleSuccess = document.getElementById('vehicleSuccess');

    const showDocNotification = vehicle.documentPhotoRequested && !vehicle.docPhoto;
    const showVehicleNotification = vehicle.vehiclePhotoRequested && !vehicle.vehiclePhoto;

    docNotification.classList.toggle('hidden', !showDocNotification);
    vehicleNotification.classList.toggle('hidden', !showVehicleNotification);
    docSuccess.classList.toggle('hidden', !vehicle.docPhoto);
    vehicleSuccess.classList.toggle('hidden', !vehicle.vehiclePhoto);
}

