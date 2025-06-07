// auth.js completo corrigido

import { signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth, db } from './main.js';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

function getDOMElements() {
    return {
        loginForm: document.getElementById('loginFormElement'),
        loginFormContainer: document.getElementById('loginForm'),
        mainContent: document.getElementById('mainContent'),
        nameForm: document.getElementById('nameForm'),
        accessMenu: document.getElementById('accessMenu'),
        userNameForm: document.getElementById('userNameForm'),
        userName: document.getElementById('userName'),
        welcomeName: document.getElementById('welcomeName'),
        profilePic: document.getElementById('profilePic'),
        onlineStatus: document.querySelector('.online-status')
    };
}

async function updateUserInfo(user) {
    if (!user) return;
    const elements = getDOMElements();

    const userDocRef = doc(db, 'users', user.uid);
    let userData;

    try {
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            userData = {
                email: user.email,
                displayName: user.displayName || user.email,
                photoURL: user.photoURL || 'img/avatar-inicial.png',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            await setDoc(userDocRef, userData);
            console.log('Documento do usuário criado com sucesso');
        } else {
            userData = userDoc.data();
            await updateDoc(userDocRef, { lastLogin: new Date().toISOString() });
            console.log('Last login atualizado com sucesso');
        }

        if (elements.userName) elements.userName.textContent = userData.displayName;
        if (elements.welcomeName) elements.welcomeName.textContent = userData.displayName;
        if (elements.profilePic) elements.profilePic.src = userData.photoURL;
        if (elements.onlineStatus) elements.onlineStatus.style.backgroundColor = '#2E7D32';
    } catch (error) {
        console.error('Erro ao atualizar informações do usuário:', error);
    }
}

function setupLoginForm(elements) {
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Login bem sucedido:', user.email);
            elements.loginForm.reset();
        } catch (error) {
            console.error('Erro no login:', error);
            let mensagem = 'Ocorreu um erro ao fazer login.';

            switch (error.code) {
                case 'auth/invalid-credential': mensagem = 'Usuário ou senha inválidos.'; break;
                case 'auth/invalid-email': mensagem = 'Email inválido.'; break;
                case 'auth/user-disabled': mensagem = 'Esta conta foi desativada.'; break;
                case 'auth/user-not-found': mensagem = 'Usuário não encontrado.'; break;
                case 'auth/wrong-password': mensagem = 'Senha incorreta.'; break;
                case 'auth/too-many-requests': mensagem = 'Muitas tentativas de login. Tente novamente mais tarde.'; break;
                default: console.warn('Erro não mapeado:', error.code);
            }

            Swal.fire({ icon: 'error', title: 'Erro no Login', text: mensagem, confirmButtonColor: '#3085d6', confirmButtonText: 'OK' });
        }
    });
}

function setupUserNameForm(elements) {
    if (!elements.userNameForm) return;

    elements.userNameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const displayName = document.getElementById('displayName').value.trim();
        const user = auth.currentUser;

        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    displayName: displayName,
                    email: user.email,
                    lastUpdated: new Date().toISOString(),
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    photoURL: user.photoURL || 'img/avatar-inicial.png'
                });

                await updateProfile(user, { displayName });

                console.log('Nome atualizado com sucesso');
                if (elements.nameForm) elements.nameForm.classList.add('hidden');
                if (elements.accessMenu) elements.accessMenu.classList.remove('hidden');
                updateUserInfo(user);

                await Swal.fire({ icon: 'success', title: 'Nome salvo com sucesso!', text: 'Bem-vindo ao sistema!', confirmButtonColor: '#2E7D32' });
            } catch (error) {
                console.error('Erro ao atualizar nome:', error);
                await Swal.fire({ icon: 'error', title: 'Erro ao salvar nome', text: 'Tente novamente mais tarde', confirmButtonColor: '#2E7D32' });
            }
        }
    });
}

function setupAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
        const elements = getDOMElements();

        if (user) {
            console.log('Usuário autenticado:', user.email);
            if (elements.loginFormContainer) elements.loginFormContainer.style.display = 'none';
            if (elements.mainContent) elements.mainContent.classList.remove('hidden');

            await updateUserInfo(user);

            const userDocRef = doc(db, 'users', user.uid);
            const updatedDoc = await getDoc(userDocRef);
            const userData = updatedDoc.data();

            if (userData.displayName && userData.displayName !== user.email) {
                console.log('Usuário já tem nome definido:', userData.displayName);
                if (elements.nameForm) elements.nameForm.classList.add('hidden');
                if (elements.accessMenu) elements.accessMenu.classList.remove('hidden');
            } else {
                console.log('Usuário precisa definir nome');
                if (elements.nameForm) elements.nameForm.classList.remove('hidden');
                if (elements.accessMenu) elements.accessMenu.classList.add('hidden');
            }
        } else {
            console.log('Nenhum usuário autenticado');
            if (elements.loginFormContainer) elements.loginFormContainer.style.display = 'block';
            if (elements.mainContent) elements.mainContent.classList.add('hidden');
            if (elements.nameForm) elements.nameForm.classList.add('hidden');
            if (elements.accessMenu) elements.accessMenu.classList.add('hidden');
        }
    });
}

const handleLogout = async () => {
    try {
        await signOut(auth);
        console.log('Logout realizado com sucesso');
        Swal.fire({ icon: 'success', title: 'Logout realizado', text: 'Você foi desconectado com sucesso!', timer: 2000, showConfirmButton: false });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        Swal.fire({ icon: 'error', title: 'Erro ao fazer logout', text: error.message, confirmButtonColor: '#3085d6', confirmButtonText: 'OK' });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMenu = document.getElementById('logoutBtnMenu');

    const handleLogout = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            const displayName = userData?.displayName || user.email;
            const photoURL = userData?.photoURL || 'img/avatar-inicial.png';

            const result = await Swal.fire({
                title: 'Confirmar Saída',
                html: `
                    <div style="margin-bottom: 15px; position: relative;">
                        <div style="position: relative; display: inline-block;">
                            <img src="${photoURL}" alt="Foto de Perfil" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            <span style="position: absolute; bottom: 5px; right: 5px; width: 12px; height: 12px; background-color: #2E7D32; border-radius: 50%; border: 2px solid #fff; animation: pulse 1.5s infinite;"></span>
                        </div>
                        <div style="margin-top: 10px; color: #666; font-weight: bold;">${displayName}</div>
                    </div>
                    <style>
                        @keyframes pulse {
                            0% { transform: scale(1); opacity: 1; }
                            50% { transform: scale(1.2); opacity: 0.8; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                    </style>
                    <div style="color: #666;">Você realmente deseja sair do sistema?</div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2E7D32',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sim, sair',
                cancelButtonText: 'Cancelar',
                customClass: { popup: 'glass-effect' }
            });

            if (result.isConfirmed) {
                await signOut(auth);
                window.location.reload();
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível fazer logout. Tente novamente.', customClass: { popup: 'glass-effect' } });
        }
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (logoutBtnMenu) logoutBtnMenu.addEventListener('click', handleLogout);

    const elements = getDOMElements();
    if (elements.loginForm) setupLoginForm(elements);
    if (elements.userNameForm) setupUserNameForm(elements);
    setupAuthStateListener();
});

export { handleLogout };
