import { auth, db } from './main.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Variáveis globais
let cropper = null;

// Elementos do DOM
const modal = document.getElementById('cropperModal');
const cropperImage = document.getElementById('cropperImage');
const profilePic = document.getElementById('profilePic');
const cancelButton = document.getElementById('cancelCrop');
const saveButton = document.getElementById('saveCrop');
const closeButton = document.querySelector('.close-modal');

// Função para abrir o modal de recorte
function openCropperModal(imageUrl) {
    modal.classList.remove('hidden');
    cropperImage.src = imageUrl;
    
    // Inicializar o Cropper.js
    cropper = new Cropper(cropperImage, {
        aspectRatio: 1, // Força formato quadrado
        viewMode: 1, // Restringe a área de visualização ao container
        dragMode: 'move', // Permite mover a imagem
        autoCropArea: 0.8, // Define a área inicial de recorte
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        cropBoxShape: 'circle' // Força o recorte em formato circular
    });
}

// Função para fechar o modal
function closeCropperModal() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    modal.classList.add('hidden');
    cropperImage.src = '#';
}

// Função para salvar a imagem recortada
async function saveCroppedImage() {
    if (!cropper) return;

    try {
        // Obter o canvas com a imagem recortada
        const canvas = cropper.getCroppedCanvas({
            width: 300, // Tamanho máximo da imagem
            height: 300,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        // Converter para blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        
        // Criar URL da imagem
        const croppedImageUrl = URL.createObjectURL(blob);

        // Atualizar foto de perfil
        profilePic.src = croppedImageUrl;

        // Converter blob para base64
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });

        // Salvar no Firestore
        const user = auth.currentUser;
        if (user) {
            try {
                // Atualizar documento do usuário no Firestore
                const userRef = doc(db, 'users', user.uid);
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName || 'Usuário',
                    photoURL: base64,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });

                // Atualizar todas as imagens de perfil na página
                const allProfilePics = document.querySelectorAll('.profile-pic');
                allProfilePics.forEach(pic => pic.src = base64);

                console.log('Foto de perfil atualizada com sucesso');
            } catch (error) {
                console.error('Erro ao salvar dados do usuário:', error);
                throw error;
            }
        }

        closeCropperModal();
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Foto de perfil atualizada com sucesso!',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Erro ao salvar imagem:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Não foi possível salvar a imagem. Tente novamente.'
        });
    }
}

// Event Listeners
if (window.location.pathname.includes('index.html')) {
    // Só adiciona os listeners na página index.html
    profilePic.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => openCropperModal(e.target.result);
                reader.readAsDataURL(file);
            }
        };
        input.click();
    });

    // Botões do modal
    cancelButton.addEventListener('click', closeCropperModal);
    closeButton.addEventListener('click', closeCropperModal);
    saveButton.addEventListener('click', saveCroppedImage);

    // Fechar modal com Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeCropperModal();
        }
    });
}
