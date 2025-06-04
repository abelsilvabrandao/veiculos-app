import { signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth, db } from './main.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Função para obter elementos do DOM
function getDOMElements() {
    return {
        loginForm: document.getElementById('loginFormElement'),
        loginFormContainer: document.getElementById('loginForm'),
        mainContent: document.getElementById('mainContent'),
        nameForm: document.getElementById('nameForm'),
        accessMenu: document.getElementById('accessMenu'),
        userNameForm: document.getElementById('userNameForm'),
        userNameElement: document.getElementById('userName'),
        profilePic: document.getElementById('profilePic'),
        onlineStatus: document.querySelector('.online-status')
    };
}

// Função para atualizar informações do usuário na interface
async function updateUserInfo() {
    const user = auth.currentUser;
    const elements = getDOMElements();

    if (user) {
        try {
            // Buscar dados do usuário no Firestore
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data() || {};

            const displayName = userData.displayName || user.displayName || 'Usuário';
            const photoURL = userData.photoURL || 'img/avatar-inicial.png';

            console.log('Atualizando informações do usuário:', {
                email: user.email,
                displayName: displayName
            });

            // Atualizar nome do usuário
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                console.log('Atualizando elemento userName com:', displayName);
                userNameElement.textContent = displayName;
            } else {
                console.warn('Elemento userName não encontrado na página atual');
            }

            // Atualizar nome de boas-vindas
            const welcomeElement = document.getElementById('welcomeName');
            if (welcomeElement) {
                console.log('Atualizando elemento welcomeName com:', displayName);
                welcomeElement.textContent = displayName;
            }

            // Atualizar foto de perfil
            const profilePic = document.getElementById('profilePic');
            if (profilePic) {
                console.log('Atualizando foto de perfil');
                profilePic.src = photoURL;
            } else {
                console.warn('Elemento profilePic não encontrado na página atual');
            }

            // Atualizar status online
            const onlineStatus = document.querySelector('.online-status');
            if (onlineStatus) {
                console.log('Atualizando status online');
                onlineStatus.classList.add('active');
            } else {
                console.warn('Elemento online-status não encontrado na página atual');
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
        }
    } else {
        console.log('Nenhum usuário autenticado');
        // Limpar informações do usuário quando não estiver logado
        if (elements.userName) elements.userName.textContent = '';
        if (elements.welcomeName) elements.welcomeName.textContent = '';
        if (elements.profilePic) elements.profilePic.src = 'img/avatar-inicial.png';
        if (elements.onlineStatus) elements.onlineStatus.classList.remove('active');
    }
}

// Função para configurar o formulário de login
function setupLoginForm(elements) {
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Tentar fazer login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Login bem sucedido:', user.email);
            
            // Limpar o formulário
            elements.loginForm.reset();
        } catch (error) {
            console.error('Erro no login:', {
                code: error.code,
                message: error.message
            });
            
            let mensagem = 'Ocorreu um erro ao fazer login.';
            
            switch (error.code) {
                case 'auth/invalid-credential':
                    mensagem = 'Usuário ou senha inválidos.';
                    break;
                case 'auth/invalid-email':
                    mensagem = 'Email inválido.';
                    break;
                case 'auth/user-disabled':
                    mensagem = 'Esta conta foi desativada.';
                    break;
                case 'auth/user-not-found':
                    mensagem = 'Usuário não encontrado.';
                    break;
                case 'auth/wrong-password':
                    mensagem = 'Senha incorreta.';
                    break;
                case 'auth/too-many-requests':
                    mensagem = 'Muitas tentativas de login. Tente novamente mais tarde.';
                    break;
                default:
                    console.warn('Erro não mapeado:', error.code);
            }

            Swal.fire({
                icon: 'error',
                title: 'Erro no Login',
                text: mensagem,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
        }
    });
}

// Função para configurar o formulário de nome
function setupUserNameForm(elements) {
    elements.userNameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const displayName = document.getElementById('displayName').value.trim();

        try {
            await updateProfile(auth.currentUser, { displayName });
            if (elements.nameForm) elements.nameForm.classList.add('hidden');
            if (elements.accessMenu) elements.accessMenu.classList.remove('hidden');
            updateUserInfo();

            Swal.fire({
                icon: 'success',
                title: 'Nome salvo com sucesso!',
                text: 'Bem-vindo ao sistema!',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
        } catch (error) {
            console.error('Erro ao salvar nome:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao salvar nome',
                text: 'Por favor, tente novamente.',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
        }
    });
}

// Função para configurar o listener de estado de autenticação
function setupAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuário está logado
            console.log('Usuário autenticado:', user.email);
            const elements = getDOMElements();
            
            if (elements.loginFormContainer) {
                console.log('Ocultando formulário de login');
                elements.loginFormContainer.classList.add('hidden');
            }
            if (elements.mainContent) {
                console.log('Mostrando conteúdo principal');
                elements.mainContent.classList.remove('hidden');
            }
            
            // Atualizar informações do usuário na interface
            updateUserInfo();

            // Verificar se o usuário já tem um nome definido
            if (user.displayName) {
                console.log('Usuário já tem nome definido:', user.displayName);
                if (elements.nameForm) {
                    elements.nameForm.classList.add('hidden');
                    console.log('Formulário de nome ocultado');
                }
                if (elements.accessMenu) {
                    elements.accessMenu.classList.remove('hidden');
                    console.log('Menu de acesso exibido');
                }
            } else {
                console.log('Usuário precisa definir um nome');
                if (elements.nameForm) {
                    elements.nameForm.classList.remove('hidden');
                    console.log('Formulário de nome exibido');
                }
                if (elements.accessMenu) {
                    elements.accessMenu.classList.add('hidden');
                    console.log('Menu de acesso ocultado');
                }
            }
        } else {
            // Usuário está deslogado
            const elements = getDOMElements();
            
            if (elements.loginFormContainer) {
                elements.loginFormContainer.classList.remove('hidden');
            }
            if (elements.mainContent) {
                elements.mainContent.classList.add('hidden');
            }
            
            // Remover classe online
            if (elements.onlineStatus) {
                elements.onlineStatus.classList.remove('active');
            }
            
            // Resetar foto de perfil
            if (elements.profilePic) {
                elements.profilePic.src = 'img/avatar-inicial.png';
            }
        }
    });
}

// Função de logout
const handleLogout = async () => {
    try {
        await signOut(auth);
        console.log('Logout realizado com sucesso');
        
        // Mostrar mensagem de sucesso
        Swal.fire({
            icon: 'success',
            title: 'Logout realizado',
            text: 'Você foi desconectado com sucesso!',
            timer: 2000,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        
        // Mostrar mensagem de erro
        Swal.fire({
            icon: 'error',
            title: 'Erro ao fazer logout',
            text: error.message,
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    }
};

// Aguardar o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    const elements = getDOMElements();

    // Configurar listeners apenas se os elementos existirem
    if (elements.loginForm) {
        setupLoginForm(elements);
    }

    if (elements.userNameForm) {
        setupUserNameForm(elements);
    }

    // Iniciar listener de autenticação
    setupAuthStateListener();
});

// Exportar funções necessárias
export { handleLogout };
