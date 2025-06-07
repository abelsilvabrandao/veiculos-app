# Manual para Ajuste do Problema do Nome e Foto do Usuário que Desaparecem após Atualização (F5)

Este manual apresenta um passo a passo detalhado com trechos de código para que você possa corrigir manualmente o problema do nome e foto do usuário que desaparecem após atualizar a página.

---

## 1. Verificar se o Listener de Autenticação está Funcionando

No arquivo `js/auth.js`, existe um listener que monitora o estado de autenticação do usuário:

```js
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth } from './main.js';

function setupAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('Usuário autenticado:', user.email);
            // Atualiza a interface com os dados do usuário
            await updateUserInfo(user);
            // Mostrar conteúdo principal e ocultar login
            // ...
        } else {
            console.log('Nenhum usuário autenticado');
            // Mostrar login e ocultar conteúdo principal
            // ...
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupAuthStateListener();
});
```

**Ação:**  
- Verifique no console do navegador se aparecem as mensagens "Usuário autenticado:" após o login e ao atualizar a página.  
- Se não aparecer, confirme se o arquivo `js/auth.js` está sendo carregado corretamente no `index.html`.

---

## 2. Atualizar a Interface com os Dados do Usuário

A função `updateUserInfo(user)` busca os dados do usuário no Firestore e atualiza os elementos da interface:

```js
async function updateUserInfo(user) {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : null;

    if (userData) {
        document.getElementById('userName').textContent = userData.displayName;
        document.getElementById('welcomeName').textContent = userData.displayName;
        document.getElementById('profilePic').src = userData.photoURL || 'img/avatar-inicial.png';
    }
}
```

**Ação:**  
- Confirme que os elementos com ids `userName`, `welcomeName` e `profilePic` existem no HTML (`index.html`).  
- No console, execute manualmente `updateUserInfo(auth.currentUser)` para forçar a atualização da interface.

---

## 3. Persistência da Foto do Perfil no localStorage

No arquivo `js/profile.js`, a foto do perfil é salva no `localStorage` para persistir após refresh:

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

**Ação:**  
- Verifique no console se o `localStorage` contém a chave `userProfilePic` após o login:  
  ```js
  localStorage.getItem('userProfilePic');
  ```  
- Se estiver vazio, a foto pode não estar sendo salva corretamente.  
- Certifique-se que o evento `onAuthStateChanged` está chamando `loadProfilePicture()`.

---

## 4. Controle de Visibilidade dos Elementos

No `index.html`, existem elementos que são mostrados ou ocultados conforme o estado do usuário:

- Formulário de login: `id="loginForm"`
- Conteúdo principal: `id="mainContent"`
- Formulário para definir nome: `id="nameForm"`
- Menu de acesso: `id="accessMenu"`

No `js/auth.js`, o código controla a visibilidade:

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

**Ação:**  
- Verifique se os elementos estão com as classes e estilos corretos após o login e após o refresh.  
- No console, execute:  
  ```js
  document.getElementById('loginForm').style.display;
  document.getElementById('mainContent').classList.contains('hidden');
  document.getElementById('nameForm').classList.contains('hidden');
  document.getElementById('accessMenu').classList.contains('hidden');
  ```

---

## 5. Testes Recomendados

- Faça login e verifique se o nome e a foto aparecem corretamente.  
- Atualize a página (F5) e confirme se o nome e a foto permanecem visíveis.  
- Teste o logout e login novamente para garantir que o fluxo funciona.  
- Altere o nome e a foto do perfil e verifique se as alterações persistem após o refresh.

---

## Resumo

- O problema geralmente ocorre porque o listener de autenticação não atualiza a interface corretamente após o refresh.  
- A persistência da foto depende do localStorage e do atributo photoURL do usuário no Firebase.  
- A visibilidade dos elementos deve ser controlada conforme o estado do usuário e se o nome está definido.  
- Use o console do navegador para verificar estados, elementos e localStorage.

---

Se precisar, posso ajudar a criar scripts de depuração ou melhorias para garantir a persistência dos dados do usuário.
