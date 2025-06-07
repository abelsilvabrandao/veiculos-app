import { auth, db } from './main.js';
import { doc, updateDoc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const userNameElement = document.getElementById('userName');
    const editIcon = userNameElement.nextElementSibling;

    const editName = async () => {
        const user = auth.currentUser;
        if (!user) return;

        let newName;
        let userData; // Declarado fora do try para escopo global na função

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            userData = userDoc.data();
            const currentName = userData?.displayName || user.email;
            const photoURL = userData?.photoURL || 'img/avatar-inicial.png';

            const result = await Swal.fire({
                title: 'Editar Nome',
                html: `
                    <div style="position: relative; display: inline-block; margin-bottom: 10px;">
                        <img src="${photoURL}" alt="Foto de Perfil" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                        <div style="position: absolute; bottom: 5px; right: 5px; width: 12px; height: 12px; background: #2E7D32; border-radius: 50%; border: 2px solid #fff; animation: pulse 1.5s infinite;"></div>
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
                    if (!value) {
                        return 'Por favor, digite um nome';
                    }
                    if (value.length > 30) {
                        return 'O nome deve ter no máximo 30 caracteres';
                    }
                }
            });

            if (result.isConfirmed) {
                newName = result.value;
            } else {
                return;
            }
        } catch (error) {
            console.error('Erro ao obter dados do usuário:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Não foi possível carregar os dados do usuário.'
            });
            return;
        }

        if (newName) {
            try {
                const userRef = doc(db, 'users', user.uid);
                const currentDoc = await getDoc(userRef);

                if (!currentDoc.exists()) {
                    await setDoc(userRef, {
                        email: user.email,
                        displayName: newName,
                        photoURL: user.photoURL || 'img/avatar-inicial.png',
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString(),
                        lastLogin: new Date().toISOString()
                    });
                } else {
                    await updateDoc(userRef, {
                        displayName: newName,
                        lastUpdated: new Date().toISOString()
                    });
                }

                userNameElement.textContent = newName;
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
            <img src="${userData?.photoURL || 'img/avatar-inicial.png'}"
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

            } catch (error) {
                console.error('Erro ao atualizar nome:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro ao atualizar nome',
                    text: 'Por favor, tente novamente mais tarde.'
                });
            }
        }
    };

    userNameElement.addEventListener('click', editName);
    editIcon.addEventListener('click', editName);
});

