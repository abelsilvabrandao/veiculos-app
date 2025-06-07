import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { app } from './main.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Validação de placa
const validatePlate = (plate) => {
    const platePattern = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    return platePattern.test(plate);
};

// Validação de telefone
const validatePhone = (phone) => {
    const phonePattern = /^\(\d{2}\) \d \d{4}-\d{4}$/;
    return phonePattern.test(phone);
};

// Função para converter status em texto
const getStatusText = (status) => {
    const statusMap = {
        'pending': 'Pendente',
        'scheduled': 'Na Programação',
        'unscheduled': 'Fora da Programação',
        'completed': 'Concluído',
        'cancelled': 'Cancelado',
        'aguardando': 'Aguardando'
    };
    return statusMap[status] || status;
};

// Validação de container
const validateContainer = (container) => {
    if (!container) return true; // Container é opcional
    const containerPattern = /^[A-Z]{4}\d{7}$/;
    return containerPattern.test(container);
};

// Manipulação do formulário
document.getElementById('vehicleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validação da placa do veículo
    const plateInput = document.getElementById('plate');
    const plate = plateInput.value.toUpperCase();
    
    if (!validatePlate(plate)) {
        await Swal.fire({
            icon: 'error',
            title: 'Placa Inválida',
            text: 'Por favor, insira uma placa válida no formato ABC1D23',
            confirmButtonColor: '#2E7D32'
        });
        plateInput.focus();
        return;
    }

    // Validação da placa da carreta
    const trailerPlateGroup = document.getElementById('trailerPlateGroup');
    const trailerPlateInput = document.getElementById('trailerPlate');
    let trailerPlate = '';
    
    if (trailerPlateGroup.style.display !== 'none' && trailerPlateInput.value.trim()) {
        trailerPlate = trailerPlateInput.value.toUpperCase();
        if (!validatePlate(trailerPlate)) {
            await Swal.fire({
                icon: 'error',
                title: 'Placa da Carreta Inválida',
                text: 'Por favor, insira uma placa válida no formato ABC1D23',
                confirmButtonColor: '#2E7D32'
            });
            trailerPlateInput.focus();
            return;
        }
    }

    try {

        // Validação do telefone
        const phoneInput = document.getElementById('driverPhone');
        if (phoneInput.value && !validatePhone(phoneInput.value)) {
            await Swal.fire({
                icon: 'error',
                title: 'Telefone Inválido',
                text: 'Por favor, insira um telefone válido no formato (99) 9 9999-9999',
                confirmButtonColor: '#2E7D32'
            });
            phoneInput.focus();
            return;
        }

        // Validação do container
        const containerInput = document.getElementById('container');
        const container = containerInput.value.toUpperCase();
        if (container && !validateContainer(container)) {
            await Swal.fire({
                icon: 'error',
                title: 'Container Inválido',
                text: 'Por favor, insira um número de container válido no formato ABCD1234567',
                confirmButtonColor: '#2E7D32'
            });
            containerInput.focus();
            return;
        }

        // Preparação dos dados
        const vehicleData = {
            plate,
            trailerPlate,
            driverName: document.getElementById('driverName').value.trim(),
            driverPhone: phoneInput.value.trim(),
            container,
            observations: document.getElementById('observations').value.trim(),
            status: 'aguardando', // Status padrão: AGUARDANDO', // Status inicial
            createdAt: serverTimestamp(),
            createdBy: {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                displayName: auth.currentUser.displayName || auth.currentUser.email
            }
        };

        // Verifica se o usuário está ativo
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists() || userDoc.data().status !== 'active') {
            throw new Error('Usuário não está ativo no sistema');
        }

        // Registro no Firestore
        await addDoc(collection(db, 'veiculos'), vehicleData);
        
        // Feedback de sucesso
        await Swal.fire({
            icon: 'success',
            title: 'Veículo Registrado!',
            html: `
                <div style="margin: 10px 0;">
                    <strong>Placa:</strong> ${plate}<br>
                    ${trailerPlate ? `<strong>Carreta:</strong> ${trailerPlate}<br>` : ''}
                    <strong>Motorista:</strong> ${vehicleData.driverName || 'Não informado'}
                </div>
            `,
            confirmButtonColor: '#2E7D32',
            timer: 3000,
            timerProgressBar: true
        });

        // Limpa o formulário
        e.target.reset();
        
        // Esconde o campo da carreta se estiver visível
        trailerPlateGroup.style.display = 'none';

    } catch (error) {
        console.error('Erro ao registrar veículo:', error);
        let errorMessage = 'Não foi possível registrar o veículo. Por favor, tente novamente.';
        
        if (error.message === 'Usuário não está ativo no sistema') {
            errorMessage = 'Seu usuário não está ativo no sistema. Entre em contato com o administrador.';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'Você não tem permissão para registrar veículos. Entre em contato com o administrador.';
        }

        await Swal.fire({
            icon: 'error',
            title: 'Erro ao Registrar',
            text: errorMessage,
            confirmButtonColor: '#2E7D32'
        });
    }
});

// Inicialização dos campos e eventos
const initializeFields = () => {
    // Formatação e validação das placas em tempo real
    const plateInputs = ['plate', 'trailerPlate'];
    plateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                const value = e.target.value.toUpperCase();
                e.target.value = value;
                
                // Validação em tempo real
                if (value.length > 0) {
                    if (validatePlate(value)) {
                        e.target.classList.remove('invalid');
                        e.target.setCustomValidity('');
                    } else {
                        e.target.classList.add('invalid');
                        e.target.setCustomValidity('Placa inválida');
                    }
                } else {
                    e.target.classList.remove('invalid');
                    e.target.setCustomValidity('');
                }
            });

            // Valida ao perder o foco
            input.addEventListener('blur', (e) => {
                const value = e.target.value.trim();
                if (value && !validatePlate(value)) {
                    e.target.classList.add('invalid');
                }
            });
        }
    });

    // Máscara para telefone
    const phoneInput = document.getElementById('driverPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, '($1) $2 $3-$4');
                e.target.value = value;
            }
        });
    }

    // Formatação do container para maiúsculo
    const containerInput = document.getElementById('container');
    if (containerInput) {
        containerInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Toggle do campo de carreta
    const addTrailerBtn = document.getElementById('addTrailerPlate');
    const trailerGroup = document.getElementById('trailerPlateGroup');
    if (addTrailerBtn && trailerGroup) {
        // Força display none inicialmente e reseta o botão
        trailerGroup.style.display = 'none';
        addTrailerBtn.innerHTML = '<i class="fas fa-plus"></i> Carreta';
        
        // Limpa o campo da carreta
        const trailerPlateInput = document.getElementById('trailerPlate');
        if (trailerPlateInput) {
            trailerPlateInput.value = '';
        }
        
        addTrailerBtn.addEventListener('click', () => {
            const isHidden = trailerGroup.style.display === 'none';
            trailerGroup.style.display = isHidden ? 'block' : 'none';
            addTrailerBtn.innerHTML = isHidden ? 
                '<i class="fas fa-minus"></i> Remover Carreta' : 
                '<i class="fas fa-plus"></i> Carreta';
            
            if (!isHidden && trailerPlateInput) {
                trailerPlateInput.value = '';
                trailerPlateInput.focus();
            }
        });
    }
};

// Inicializa os campos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeFields);

// Carregar registros recentes
function loadRecentEntries() {
    const q = query(
        collection(db, 'veiculos'),
        orderBy('createdAt', 'desc'),
        limit(3)
    );

    onSnapshot(q, (snapshot) => {
        const entriesList = document.getElementById('recentEntriesList');
        if (!entriesList) return; // Elemento pode não existir em todas as páginas

        entriesList.innerHTML = '';

        if (snapshot.empty) {
            entriesList.innerHTML = `
                <div class="empty-state glass-effect">
                    <i class="fas fa-truck" style="font-size: 2em; color: #666666;"></i>
                    <p>Nenhum veículo registrado ainda</p>
                </div>
            `;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const entry = document.createElement('div');
            entry.className = 'entry-item glass-effect';
            
            // Formata a data/hora
            const createdAt = data.createdAt ? new Date(data.createdAt.toDate()) : new Date();
            const formattedDate = new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(createdAt);

            // Conta o número de pendências (fotos solicitadas)
            const pendingCount = (data.documentPhotoRequested ? 1 : 0) + (data.vehiclePhotoRequested ? 1 : 0);
            
            entry.innerHTML = `
                <div class="entry-content">
                    <div class="entry-header">
                        <strong class="plate-number">${data.plate}</strong>
                        ${data.trailerPlate ? `<span class="trailer-plate">/ ${data.trailerPlate}</span>` : ''}
                        ${pendingCount > 0 ? `<span class="notification-count">${pendingCount}</span>` : ''}
                    </div>
                    <div class="entry-details">
                        <span class="driver-name">${data.driverName || 'Motorista não informado'}</span>
                        ${data.container ? `<span class="container-number">Container: ${data.container}</span>` : ''}
                        <small class="timestamp">${formattedDate}</small>
                    </div>
                </div>
                <div class="entry-status">
                    <span class="status-badge ${(data.status || 'pending').toLowerCase()}">
                        ${getStatusText(data.status || 'pending')}
                    </span>
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
