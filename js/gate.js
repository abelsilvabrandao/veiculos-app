import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { app } from './main.js';

const db = getFirestore(app);
const auth = getAuth(app);

let currentVehicles = [];
let selectedVehicleId = null;

// Carregar e exibir veículos
function loadVehicles() {
    const q = query(
        collection(db, 'vehicles'),
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
            row.innerHTML = `
                <td>${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : ''}</td>
                <td>${data.plate}</td>
                <td>${data.driverName || '-'}</td>
                <td>${data.container || '-'}</td>
                <td>
                    <span class="status-badge ${data.status}">
                        ${data.status === 'scheduled' ? 'Na Programação' : 
                          data.status === 'unscheduled' ? 'Fora da Programação' : 'Pendente'}
                    </span>
                </td>
                <td>${data.observations || '-'}</td>
                <td>
                    <button onclick="openEditModal('${doc.id}')" class="btn-secondary">Editar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

// Filtrar veículos
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterVehicles(searchTerm);
});

document.querySelectorAll('input[name="status"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        filterVehicles(searchTerm);
    });
});

function filterVehicles(searchTerm) {
    const selectedStatus = document.querySelector('input[name="status"]:checked').value;
    const tableBody = document.getElementById('vehiclesTableBody');
    tableBody.innerHTML = '';

    currentVehicles.forEach(vehicle => {
        if ((vehicle.plate.toLowerCase().includes(searchTerm) ||
             vehicle.driverName?.toLowerCase().includes(searchTerm)) &&
            (selectedStatus === 'all' || vehicle.status === selectedStatus)) {
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle.createdAt ? new Date(vehicle.createdAt.toDate()).toLocaleString() : ''}</td>
                <td>${vehicle.plate}</td>
                <td>${vehicle.driverName || '-'}</td>
                <td>${vehicle.container || '-'}</td>
                <td>
                    <span class="status-badge ${vehicle.status}">
                        ${vehicle.status === 'scheduled' ? 'Na Programação' : 
                          vehicle.status === 'unscheduled' ? 'Fora da Programação' : 'Pendente'}
                    </span>
                </td>
                <td>${vehicle.observations || '-'}</td>
                <td>
                    <button onclick="openEditModal('${vehicle.id}')" class="btn-secondary">Editar</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
}

// Modal de edição
window.openEditModal = (vehicleId) => {
    selectedVehicleId = vehicleId;
    const vehicle = currentVehicles.find(v => v.id === vehicleId);
    
    document.getElementById('editStatus').value = vehicle.status;
    document.getElementById('editObservations').value = vehicle.observations || '';
    document.getElementById('editModal').classList.remove('hidden');
};

window.closeModal = () => {
    document.getElementById('editModal').classList.add('hidden');
    selectedVehicleId = null;
};

// Atualizar veículo
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedVehicleId) return;

    try {
        const vehicleRef = doc(db, 'vehicles', selectedVehicleId);
        await updateDoc(vehicleRef, {
            status: document.getElementById('editStatus').value,
            observations: document.getElementById('editObservations').value,
            updatedAt: new Date(),
            updatedBy: {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email
            }
        });

        closeModal();
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
