# Sistema de Controle de Entrada - Porto

## Melhorias no Perfil do Usuário e Interface

### 1. Componente Header Profile
Criamos um componente web personalizado (`<header-profile>`) para unificar a experiência do usuário em todas as páginas:

- **Arquivo**: `js/components/header-profile.js`
- **Funcionalidades**:
  - Avatar do usuário com borda pulsante verde (status online)
  - Menu dropdown com opções do usuário
  - Título dinâmico da página
  - Widget de clima e data/hora
  - Ícones específicos para cada página

### 2. Gerenciador de Perfil
Implementamos um gerenciador centralizado para as funcionalidades do perfil:

- **Arquivo**: `js/components/profile-manager.js`
- **Funcionalidades**:
  - Troca de avatar com recorte de imagem (Cropper.js)
  - Edição do nome do usuário
  - Logout com confirmação
  - Modais estilizados com SweetAlert2

### 3. Estilos CSS
Organizamos os estilos em arquivos separados para melhor manutenção:

- **profile-menu.css**:
  - Estilo do menu dropdown
  - Animações e transições
  - Modal do cropper de imagem
  - Efeito glass-effect

### 4. Ícones e Identidade Visual
Padronizamos os ícones e estilos em todas as páginas:

- **GATE**: `fas fa-door-open`
- **PORTARIA**: `fas fa-clipboard-list`
- **REGISTROS**: `fas fa-list-alt`

### 5. Melhorias Visuais
- Gradientes verdes consistentes
- Animações suaves
- Efeito de elevação nos botões
- Feedback visual nas interações
- Layout responsivo

### 6. Estrutura de Arquivos
```
├── js/
│   ├── components/
│   │   ├── header-profile.js
│   │   └── profile-manager.js
│   ├── auth.js
│   └── main.js
├── css/
│   ├── profile-menu.css
│   ├── components.css
│   └── styles.css
└── *.html
```

### 7. Dependências
- Font Awesome 6.4.0
- Cropper.js 1.5.13
- SweetAlert2
- Firebase (Auth e Firestore)

### 8. Próximos Passos
- [ ] Implementar cache offline para imagens
- [ ] Adicionar mais animações de feedback
- [ ] Otimizar performance do carregamento
- [ ] Implementar testes automatizados

## Como Usar
1. O componente `<header-profile>` é automaticamente injetado em todas as páginas
2. O menu de perfil é acessado clicando no avatar
3. As alterações de foto e nome são salvas no Firestore e localStorage
4. O logout requer confirmação e limpa os dados locais
