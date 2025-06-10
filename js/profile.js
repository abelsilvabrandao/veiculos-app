import { updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { auth, storage } from './main.js';

// Função para upload da foto de perfil
async function uploadProfilePicture(file) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Você precisa estar logado para alterar a foto');
            return;
        }

        // Validar o arquivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida');
            return;
        }

        // Limitar tamanho do arquivo (2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
            return;
        }

        // Mostrar loading
        const profilePic = document.getElementById('profilePic');
        profilePic.style.opacity = '0.5';

        try {
            // Criar referência no Storage
            const fileRef = ref(storage, `profile_pictures/${user.uid}/${Date.now()}_${file.name}`);
            
            // Fazer upload do arquivo
            await uploadBytes(fileRef, file);
            
            // Obter URL da imagem
            const photoURL = await getDownloadURL(fileRef);
            
            // Atualizar perfil do usuário
            await updateProfile(user, { photoURL });
            
            // Atualizar todas as imagens de perfil na página
            document.querySelectorAll('.profile-pic').forEach(pic => {
                pic.src = photoURL;
            });

            // Salvar URL no localStorage para persistência
            localStorage.setItem('userProfilePic', photoURL);

        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload da imagem. Tente novamente.');
        }

        // Remover loading
        profilePic.style.opacity = '1';

    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        alert('Erro ao processar arquivo. Tente novamente.');
    }
}

// Função para abrir o seletor de arquivo
function openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadProfilePicture(file);
        }
    };
    input.click();
}

// Função para carregar foto do perfil
function loadProfilePicture() {
    const user = auth.currentUser;
    const savedPic = localStorage.getItem('userProfilePic');

    const newSrc = user?.photoURL || savedPic || 'img/avatar-inicial.png';

    document.querySelectorAll('.profile-pic, .profile-pic-menu').forEach(pic => {
        pic.src = newSrc;
    });
}


auth.onAuthStateChanged(user => {
    if (user) {
        loadProfilePicture();
    } else {
        document.querySelectorAll('.profile-pic').forEach(pic => {
            pic.src = 'img/avatar-inicial.png';
        });
        localStorage.removeItem('userProfilePic');
    }
});
