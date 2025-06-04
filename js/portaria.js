import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { app } from './main.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Manipulação do formulário
document.getElementById('vehicleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const plateInput = document.getElementById('plate');
    const plateResult = formatLicensePlate(plateInput.value);
    if (!plateResult.isValid) {
        alert('Formato de placa inválido');
        plateInput.focus();
        return;
    }

    try {
        const vehicleData = {
            plate,
            driverName: document.getElementById('driverName').value,
            driverPhone: document.getElementById('driverPhone').value,
            container: document.getElementById('container').value,
            observations: document.getElementById('observations').value,
            status: 'pending', // Status inicial
            createdAt: serverTimestamp(),
            createdBy: {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email
            }
        };

        await addDoc(collection(db, 'vehicles'), vehicleData);
        e.target.reset();
        alert('Veículo registrado com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar veículo:', error);
        alert('Erro ao registrar veículo. Tente novamente.');
    }
});

// Formatação automática da placa
document.getElementById('plate').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Carregar registros recentes
function loadRecentEntries() {
    const q = query(
        collection(db, 'vehicles'),
        orderBy('createdAt', 'desc'),
        limit(5)
    );

    onSnapshot(q, (snapshot) => {
        const entriesList = document.getElementById('recentEntriesList');
        entriesList.innerHTML = '';

        snapshot.forEach((doc) => {
            const data = doc.data();
            const entry = document.createElement('div');
            entry.className = 'entry-item glass-effect';
            entry.innerHTML = `
                <div>
                    <strong>${data.plate}</strong> - ${data.driverName || 'Não informado'}
                    <br>
                    <small>${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : ''}</small>
                </div>
                <div>
                    <span class="status-badge ${data.status}">${data.status}</span>
                </div>
            `;
            entriesList.appendChild(entry);
        });
    });
}

// Iniciar carregamento quando autenticado
auth.onAuthStateChanged((user) => {
    if (user) {
        loadRecentEntries();
    }
});
