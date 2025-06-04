# Sistema de Controle de Entrada - Porto

Sistema web responsivo para registrar, monitorar e validar veículos na portaria do porto.

## Funcionalidades

- Login de usuários com Firebase Authentication
- Registro e monitoramento de entrada de veículos
- Interface responsiva (mobile/desktop)
- Indicador de status online
- Registro de logs completo
- Previsão do tempo local
- Perfil de usuário com foto

## Tecnologias Utilizadas

- HTML5
- CSS3 (com design responsivo)
- JavaScript (Vanilla)
- Firebase
  - Authentication
  - Firestore
  - Storage
- GitHub Pages para hospedagem

## Configuração do Projeto

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/nome-do-repo.git
```

2. Configure o Firebase
- Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
- Copie as configurações do seu projeto
- Crie um arquivo `js/firebase-config.js` com suas configurações

3. Estrutura do arquivo firebase-config.js
```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-auth-domain",
  projectId: "seu-project-id",
  storageBucket: "seu-storage-bucket",
  messagingSenderId: "seu-sender-id",
  appId: "seu-app-id"
};
```

## Como Usar

1. Acesse o sistema através do GitHub Pages: [link-do-seu-site]
2. Faça login com suas credenciais
3. Use as funcionalidades de acordo com seu perfil (Portaria ou Gate)

## Segurança

- As configurações do Firebase não estão incluídas no repositório
- Autenticação necessária para todas as operações
- Logs completos de todas as ações
- Permissões baseadas em perfil de usuário

## Contribuição

1. Faça o fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
