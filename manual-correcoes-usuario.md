# Manual de Correções para Problema do Nome e Foto do Usuário

Este arquivo apresenta os trechos atuais dos arquivos relevantes e as correções sugeridas para que o nome e a foto do usuário apareçam corretamente após o login e após atualizar a página (F5).

---

## 1. index.html

### Trecho Atual (relevante para usuário e foto):

```html
<div class="user-info">
    <div style="display: flex; align-items: center; gap: 15px;">
        <div class="profile-wrapper">
            <div class="profile-container">
                <img src="img/avatar-inicial.png" alt="Foto de Perfil" id="profilePic" class="profile-pic" title="Clique para alterar a foto">
            </div>
            <span class="online-status"></span>
        </div>
        <div class="user-details">
            <span id="userName" style="color: #666666; cursor: pointer;" title="Clique para editar seu nome"></span>
            <i class="fas fa-edit" style="color: #666666; font-size: 0.8em; margin-left: 5px; cursor: pointer;" title="Editar nome"></i>
            <small>Clique na foto para alterar</small>
        </div>
    </div>
</div>
```

### Correção Sugerida:

Nenhuma alteração necessária no HTML, pois os elementos estão corretos e possuem os IDs usados no JS.

---

## 2. js/auth.js

### Trecho Atual (função updateUserInfo):

```js
async function updateUserInfo(user) {
    if (!user) {
        // Limpa UI
        return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    let userData;

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
    } else {
        userData = userDoc.data();
        await updateDoc(userDocRef, { lastLogin: new Date().toISOString() });
    }

    // Atualiza UI
    if (elements.userName) elements.userName.textContent = userData.displayName;
    if (elements.welcomeName) elements.welcomeName.textContent = userData.displayName;
    if (elements.profilePic) elements.profilePic.src = userData.photoURL;
}
```

### Correção Sugerida:

Adicionar verificação para garantir que os elementos existem antes de atualizar e adicionar fallback para foto padrão:

```js
if (elements.userName) elements.userName.textContent = userData.displayName || user.email;
if (elements.welcomeName) elements.welcomeName.textContent = userData.displayName || user.email;
if (elements.profilePic) elements.profilePic.src = userData.photoURL || 'img/avatar-inicial.png';
```

---

## 3. js/profile.js

### Trecho Atual (função loadProfilePicture):

```js
function loadProfilePicture() {
    const user = auth.currentUser;
    const savedPic = localStorage.getItem('userProfilePic');

    document.querySelectorAll('.profile-pic').forEach(pic => {
        if (user?.photoURL) {
            pic.src = user.photoURL;
        } else if (savedPic) {
            pic.src = savedPic;
        } else {
            pic.src = 'img/avatar-inicial.png';
        }
    });
}
```

### Correção Sugerida:

Garantir que a foto seja atualizada também no localStorage após upload e que o carregamento ocorra após autenticação:

```js
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
```

---

## 4. Controle de Visibilidade (js/auth.js)

### Trecho Atual:

```js
if (user) {
    elements.loginFormContainer.style.display = 'none';
    elements.mainContent.classList.remove('hidden');

    if (userData.displayName && userData.displayName !== user.email) {
        elements.nameForm.classList.add('hidden');
        elements.accessMenu.classList.remove('hidden');
    } else {
        elements.nameForm.classList.remove('hidden');
        elements.accessMenu.classList.add('hidden');
    }
} else {
    elements.loginFormContainer.style.display = 'block';
    elements.mainContent.classList.add('hidden');
    elements.nameForm.classList.add('hidden');
    elements.accessMenu.classList.add('hidden');
}
```

### Correção Sugerida:

Confirmar que as classes e estilos estão sendo aplicados corretamente e que os elementos existem no DOM.

---

## Passo a Passo para Aplicar as Correções Manualmente

1. No arquivo `index.html`, confirme que os elementos com ids `userName`, `welcomeName` e `profilePic` existem conforme o trecho acima.

2. No arquivo `js/auth.js`, atualize a função `updateUserInfo` para garantir que os elementos são atualizados com fallback para valores padrão.

3. No arquivo `js/profile.js`, confirme que a função `loadProfilePicture` está sendo chamada após a autenticação e que o localStorage está sendo usado para persistir a foto.

4. Verifique o controle de visibilidade dos elementos no `js/auth.js` para garantir que o formulário de login, conteúdo principal, formulário de nome e menu de acesso estão sendo mostrados ou ocultados corretamente.

5. Teste o fluxo completo:
   - Faça login e verifique se o nome e a foto aparecem.
   - Atualize a página (F5) e confirme se o nome e a foto permanecem.
   - Teste logout e login novamente.
   - Altere o nome e a foto do perfil e verifique se as alterações persistem após o refresh.

---

Se precisar, posso ajudar a criar scripts para automatizar essas verificações ou melhorias adicionais.
