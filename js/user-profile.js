import { auth, db } from './main.js';
import { doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { updateProfile, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Aguarda autenticação antes de inicializar
auth.onAuthStateChanged(user => {
    if (!user) return;

    // Carrega a foto do perfil assim que o usuário estiver autenticado
    loadProfilePicture();
});

document.addEventListener('DOMContentLoaded', () => {
    let cropper = null;

    const profileContainer = document.getElementById('profileContainer');
    const profileMenu = document.getElementById('profileMenu');
    const profilePic = document.getElementById('profilePic');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const editNameBtn = document.getElementById('editNameBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!profileContainer || !profileMenu) {
        console.warn('Avatar ou menu não encontrados');
        return;
    }

    // Toggle do menu ao clicar no avatar
    profileContainer.addEventListener('click', () => {
        profileMenu.classList.toggle('visible');
    });

    // Fecha o menu ao clicar fora
    document.addEventListener('click', (event) => {
        if (!profileContainer.contains(event.target) && !profileMenu.contains(event.target)) {
            profileMenu.classList.remove('visible');
        }
    });

    // Trocar avatar
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            profileMenu.classList.remove('visible');
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    openCropperModal(URL.createObjectURL(file));
                }
            };
            input.click();
        });
    }

    // Editar nome
    if (editNameBtn) {
        editNameBtn.addEventListener('click', async () => {
            profileMenu.classList.remove('visible');
            const user = auth.currentUser;
            if (!user) return;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const data = userDoc.data();
            const currentName = data?.displayName || user.email;
            const result = await Swal.fire({
                title: 'Editar Nome',
                html: `
                    <div style="position: relative; display: inline-block; margin-bottom: 10px;">
                        <img src="${data?.photoURL || 'img/avatar-inicial.png'}" alt="Foto de Perfil" 
                            style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff; 
                                   box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                        <div style="position: absolute; bottom: 5px; right: 5px; width: 12px; height: 12px; 
                                    background: #2E7D32; border-radius: 50%; border: 2px solid #fff; 
                                    animation: pulse 1.5s infinite;"></div>
                    </div>
                    <div style="margin: 10px 0; font-weight: bold; color: #666;">${currentName}</div>
                    <style>
                        @keyframes pulse {
                            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
                            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
                            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
                        }
                        .swal2-input { margin-top: 15px !important; }
                    </style>
                `,
                input: 'text',
                inputLabel: 'Digite seu novo nome',
                inputValue: currentName,
                showCancelButton: true,
                confirmButtonText: 'Sim, alterar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#2E7D32',
                cancelButtonColor: '#d33',
                customClass: {
                    popup: 'glass-effect'
                },
                inputValidator: (value) => {
                    if (!value) return 'Digite um nome';
                    if (value.length > 30) return 'Máximo de 30 caracteres';
                }
            });

            if (result.isConfirmed && result.value) {
                const newName = result.value;
                await updateDoc(doc(db, 'users', user.uid), {
                    displayName: newName,
                    lastUpdated: new Date().toISOString()
                });
                document.querySelector('.user-name-menu').textContent = newName;
                const welcomeName = document.getElementById('welcomeName');
                if (welcomeName) welcomeName.textContent = newName;

                await Swal.fire({
                    html: `
                        <style>
                            .swal2-popup.glass-effect::before {
                                content: '';
                                position: absolute;
                                top: 0; left: 0; right: 0; bottom: 0;
                                background: rgba(255, 255, 255, 0.25);
                                backdrop-filter: blur(12px);
                                border-radius: inherit;
                                z-index: 0;
                            }
                            .swal2-popup.glass-effect {
                                position: relative;
                                overflow: hidden;
                            }
                            .swal2-icon {
                                position: absolute !important;
                                top: 50% !important;
                                left: 50% !important;
                                transform: translate(-50%, -50%) scale(2);
                                opacity: 0.15;
                                z-index: 0;
                            }
                            .swal2-html-container {
                                position: relative;
                                z-index: 1;
                            }
                            @keyframes pulse {
                                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
                                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
                                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
                            }
                        </style>
                        <div style="position: relative; display: inline-block; margin-bottom: 10px;">
                            <img src="${data?.photoURL || 'img/avatar-inicial.png'}"
                                alt="Foto de Perfil"
                                style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff;
                                       box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1;">
                            <div style="position: absolute; bottom: 5px; right: 5px; width: 12px; height: 12px;
                                        background: #2E7D32; border-radius: 50%; border: 2px solid #fff;
                                        animation: pulse 1.5s infinite;"></div>
                        </div>
                        <h3 style="color: #2E7D32;">Nome alterado com sucesso!</h3>
                        <p style="color: #666;">Seu novo nome é <strong>${newName}</strong></p>
                    `,
                    showConfirmButton: false,
                    timer: 2500,
                    customClass: {
                        popup: 'glass-effect'
                    }
                });
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            profileMenu.classList.remove('visible');
            const user = auth.currentUser;
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();
                const displayName = userData?.displayName || user.email;

                const result = await Swal.fire({
                    title: 'Confirmar Logout',
                    html: `
                        <style>
                            @keyframes pulse {
                                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
                                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
                                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
                            }
                        </style>
                        <div style="position: relative; display: inline-block; margin-bottom: 10px;">
                            <img src="${userData?.photoURL || 'img/avatar-inicial.png'}"
                                alt="Foto de Perfil"
                                style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff;
                                       box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1;">
                            <div style="position: absolute; bottom: 5px; right: 5px; width: 12px; height: 12px;
                                        background: #2E7D32; border-radius: 50%; border: 2px solid #fff;
                                        animation: pulse 1.5s infinite;"></div>
                        </div>
                        <p style="color: #666; margin-top: 10px;">Tem certeza que deseja sair,<br><strong>${displayName}</strong>?</p>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Sim, sair',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#2E7D32',
                    customClass: {
                        popup: 'glass-effect'
                    }
                });

                if (result.isConfirmed) {
                    await signOut(auth);
                    localStorage.clear();
                    
                    await Swal.fire({
                        html: `
                            <style>
                                .swal2-popup.glass-effect::before {
                                    content: '';
                                    position: absolute;
                                    top: 0; left: 0; right: 0; bottom: 0;
                                    background: rgba(255, 255, 255, 0.25);
                                    backdrop-filter: blur(12px);
                                    border-radius: inherit;
                                    z-index: 0;
                                }
                                .swal2-popup.glass-effect {
                                    position: relative;
                                    overflow: hidden;
                                }
                                .swal2-html-container {
                                    position: relative;
                                    z-index: 1;
                                }
                            </style>
                            <div style="margin: 20px 0;">
                                <i class="fas fa-check-circle" style="font-size: 48px; color: #2E7D32;"></i>
                            </div>
                            <h3 style="color: #2E7D32; margin: 10px 0;">Logout realizado com sucesso!</h3>
                            <p style="color: #666;">Até logo, <strong>${displayName}</strong>!</p>
                        `,
                        showConfirmButton: false,
                        timer: 2000,
                        customClass: {
                            popup: 'glass-effect'
                        }
                    });

                    location.reload();
                }
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro ao fazer logout',
                    text: 'Por favor, tente novamente.',
                    confirmButtonColor: '#2E7D32'
                });
            }
        });
    }

// Cropper Modal
    function openCropperModal(imageUrl) {
        const modal = document.getElementById('cropperModal');
        const cropperImage = document.getElementById('cropperImage');
        modal.classList.remove('hidden');
        cropperImage.src = imageUrl;
        cropper = new Cropper(cropperImage, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 0.8,
            dragMode: 'move',
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            cropBoxShape: 'circle', // Força o recorte em formato circular
            background: false, // Remove o fundo xadrez
            viewMode: 2, // Força a visualização dentro do container
            minContainerWidth: 300,
            minContainerHeight: 300
        });

        document.getElementById('saveCrop').onclick = async () => {
            const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            const base64 = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });

            const user = auth.currentUser;
            await setDoc(doc(db, 'users', user.uid), {
                photoURL: base64,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // Armazena no localStorage
            localStorage.setItem('userProfilePic', base64);

           const profilePics = document.querySelectorAll('.profile-pic');
profilePics.forEach(el => el.src = base64);

const profilePicMenu = document.querySelector('.profile-pic-menu');
if (profilePicMenu) {
    profilePicMenu.src = base64;
} else {
    console.warn('Elemento .profile-pic-menu não encontrado no DOM');
}

            closeModal();
            await Swal.fire({
                html: `
                    <style>
                        .swal2-popup.glass-effect::before {
                            content: '';
                            position: absolute;
                            top: 0; left: 0; right: 0; bottom: 0;
                            background: rgba(255, 255, 255, 0.25);
                            backdrop-filter: blur(12px);
                            border-radius: inherit;
                            z-index: 0;
                        }
                        .swal2-popup.glass-effect {
                            position: relative;
                            overflow: hidden;
                        }
                        .swal2-icon {
                            position: absolute !important;
                            top: 50% !important;
                            left: 50% !important;
                            transform: translate(-50%, -50%) scale(2);
                            opacity: 0.15;
                            z-index: 0;
                        }
                        .swal2-html-container {
                            position: relative;
                            z-index: 1;
                        }
                        @keyframes pulse {
                            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
                            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
                            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
                        }
                    </style>
                    <div style="position: relative; display: inline-block; margin-bottom: 10px;">
                        <img src="${base64}"
                            alt="Foto de Perfil"
                            style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff;
                                   box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1;">
                        <div style="position: absolute; bottom: 5px; right: 5px; width: 12px; height: 12px;
                                    background: #2E7D32; border-radius: 50%; border: 2px solid #fff;
                                    animation: pulse 1.5s infinite;"></div>
                    </div>
                    <h3 style="color: #2E7D32;">Avatar atualizado com sucesso!</h3>
                `,
                showConfirmButton: false,
                timer: 2500,
                customClass: {
                    popup: 'glass-effect'
                }
            });
        };

        document.getElementById('cancelCrop').onclick =
        document.querySelector('.close-modal').onclick = closeModal;
    }

    function closeModal() {
        document.getElementById('cropperModal').classList.add('hidden');
        cropper?.destroy();
        cropper = null;
    }
    loadProfilePicture()
});

async function loadProfilePicture() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Busca dados do usuário no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        // Prioridade: Firestore > localStorage > default
        const newSrc = userData?.photoURL || localStorage.getItem('userProfilePic') || 'img/avatar-inicial.png';
        
        // Atualiza todas as imagens de perfil
        document.querySelectorAll('.profile-pic, .profile-pic-menu').forEach(pic => {
            pic.src = newSrc;
        });

        // Salva no localStorage para acesso offline
        localStorage.setItem('userProfilePic', newSrc);

        // Não vamos mais atualizar o photoURL do auth devido à limitação de tamanho
    } catch (error) {
        console.error('Erro ao carregar foto do perfil:', error);
        // Em caso de erro, usa a foto padrão
        document.querySelectorAll('.profile-pic, .profile-pic-menu').forEach(pic => {
            pic.src = 'img/avatar-inicial.png';
        });
    }
}

