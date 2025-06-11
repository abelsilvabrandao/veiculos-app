// header-profile.js
import { auth, db } from '../main.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Cache para evitar chamadas desnecessárias
let lastWeatherUpdate = 0;
let weatherCache = null;

// Ícones do tempo baseados no código WMO usando SVGs locais
const weatherIcons = {
    0: '/img/bx-sun-bright.svg', // Céu limpo
    1: '/img/bx-cloud-sun.svg', // Parcialmente nublado
    2: '/img/bx-cloud-sun.svg', // Parcialmente nublado
    3: '/img/bx-cloud-fog.svg', // Nublado
    45: '/img/bx-cloud-fog.svg', // Neblina
    48: '/img/bx-cloud-fog.svg', // Neblina com geada
    51: '/img/bx-cloud-drizzle.svg', // Chuvisco leve
    53: '/img/bx-cloud-drizzle.svg', // Chuvisco moderado
    55: '/img/bx-cloud-rain.svg', // Chuvisco intenso
    61: '/img/bx-cloud-rain.svg', // Chuva leve
    63: '/img/bx-cloud-rain.svg', // Chuva moderada
    65: '/img/bx-cloud-rain-wind.svg', // Chuva forte
    71: '/img/bx-snowflake.svg', // Neve leve
    73: '/img/bx-snowflake.svg', // Neve moderada
    75: '/img/bx-snowflake.svg', // Neve forte
    77: '/img/bx-snowflake.svg', // Grãos de neve
    80: '/img/bx-cloud-lightning.svg', // Chuva leve com trovoada
    81: '/img/bx-cloud-lightning.svg', // Chuva moderada com trovoada
    82: '/img/bx-thunder.svg', // Chuva forte com trovoada
    85: '/img/bx-thunder.svg', // Neve leve com trovoada
    86: '/img/bx-thunder.svg', // Neve forte com trovoada
    95: '/img/bx-thunder.svg', // Trovoada
    96: '/img/bx-thunder.svg', // Trovoada com granizo
    99: '/img/bx-thunder.svg'  // Trovoada forte com granizo
};

export class HeaderProfile extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const currentPath = window.location.pathname;
        const pageName = this.getPageTitle(currentPath);
        
        this.innerHTML = `
             <header class="app-header glass-effect">
                <div class="profile-wrapper">
                    <div id="profileContainer" class="profile-container">
                        <img src="img/avatar-inicial.png" alt="Foto de Perfil" id="profilePic" class="profile-pic">
                    </div>
                    <div id="profileMenu" class="profile-menu glass-effect">
                        <div class="user-info">
                            <img src="img/avatar-inicial.png" alt="Foto de Perfil" class="profile-pic-menu">
                            <span class="user-name-menu">Usuário</span>
                        </div>
                        <div class="menu-buttons">
                            <button id="changeAvatarBtn" class="menu-button btn-primary">
                                <i class="fas fa-camera"></i>
                                Trocar o avatar
                            </button>
                            <button id="editNameBtn" class="menu-button btn-primary">
                                <i class="fas fa-edit"></i>
                                Editar Nome
                            </button>
                            <button id="logoutBtn" class="menu-button btn-primary">
                                <i class="fas fa-sign-out-alt"></i>
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
                <div class="datetime-weather">
                    <div id="weather" class="weather-widget">
                        <div id="currentDateTime"></div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-map-marker-alt" style="color: #666666;"></i>
                            <div id="cityName" style="font-weight: bold; color: #666666;"></div>
                            <canvas id="weatherAnimation" style="width: 40px; height: 40px; display: none;"></canvas>
                            <div id="temperature" style="font-weight: bold; color: #2E7D32; font-size: 1.1em;">--°C</div>
                        </div>
                        <div id="weatherDescription">Carregando...</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <canvas id="windAnimation" style="width: 40px; height: 40px;"></canvas>
                            <div id="windSpeed" style="font-weight: bold; color: #666666;">-- km/h</div>
                        </div>
                    </div>
                    <div class="title-with-button" style="width: 100%; display: flex; justify-content: center; align-items: center; margin-top: 10px;">
                        <h1 style="color: #10B981; font-size: 2rem; font-weight: bold; display: flex; align-items: center; gap: 10px; margin: 0;">
                            <i class="${this.getPageIcon(currentPath)}"></i> ${pageName}
                        </h1>
                    </div>
                </div>
            </header>
        `;

        // Listener para mudanças no estado da autenticação
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.loadProfilePicture();
            } else {
                // Usuário deslogado, usar avatar padrão
                const profilePic = this.querySelector('.profile-pic');
                if (profilePic) profilePic.src = 'img/avatar-inicial.png';

                const menuPic = this.querySelector('.profile-pic-menu');
                if (menuPic) menuPic.src = 'img/avatar-inicial.png';

                const userNameElement = this.querySelector('.user-name-menu');
                if (userNameElement) userNameElement.textContent = 'Usuário';
            }
        });

        // Inicializa o relógio e o clima
        this.updateDateTime();
        setTimeout(() => this.updateWeatherUI(), 500);

        // Configura a atualização automática do relógio a cada segundo
        setInterval(() => this.updateDateTime(), 1000);

        // Adiciona event listeners
        const profileContainer = this.querySelector('#profileContainer');
        const profileMenu = this.querySelector('#profileMenu');
        const changeAvatarBtn = this.querySelector('#changeAvatarBtn');
        const editNameBtn = this.querySelector('#editNameBtn');
        const logoutBtn = this.querySelector('#logoutBtn');

        // Toggle do menu ao clicar no avatar
        if (profileContainer) {
            profileContainer.addEventListener('click', () => {
                profileMenu?.classList.toggle('visible');
            });
        }

        // Fecha o menu ao clicar fora
        document.addEventListener('click', (event) => {
            if (profileMenu && !profileMenu.contains(event.target) && !profileContainer?.contains(event.target)) {
                profileMenu.classList.remove('visible');
            }
        });

        // Botão de trocar avatar
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', () => {
                profileMenu?.classList.remove('visible');
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const modal = document.getElementById('cropperModal');
                        const cropperImage = document.getElementById('cropperImage');
                        modal.classList.remove('hidden');
                        cropperImage.src = URL.createObjectURL(file);
                        
                        // Inicializa o cropper
                        if (window.cropper) {
                            window.cropper.destroy();
                        }
                        window.cropper = new Cropper(cropperImage, {
                            aspectRatio: 1,
                            viewMode: 1,
                            autoCropArea: 0.8
                        });
                    }
                };
                input.click();
            });
        }

        // Botão de editar nome
        if (editNameBtn) {
            editNameBtn.addEventListener('click', async () => {
                profileMenu?.classList.remove('visible');
                const user = auth.currentUser;
                if (!user) return;

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const data = userDoc.data();
                const currentName = data?.displayName || user.email;

                const result = await Swal.fire({
                    title: 'Editar Nome',
                    html: `
                        <style>
                            @keyframes pulse {
                                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); }
                                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(46, 125, 50, 0); }
                                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); }
                            }
                            .swal2-input { 
                                margin-top: 15px !important;
                                border: 2px solid #e0e0e0;
                                border-radius: 8px;
                                padding: 10px;
                                font-size: 16px;
                                transition: border-color 0.3s;
                                color: #666 !important;
                                background: white !important;
                                z-index: 1;
                            }
                            .swal2-input-label {
                                color: #666 !important;
                                z-index: 1;
                            }
                            .swal2-title {
                                color: #666 !important;
                            }
                            .swal2-input:focus {
                                border-color: #2E7D32;
                                box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
                                outline: none;
                            }
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
                        <div style="position: relative; display: inline-block; margin-bottom: 10px;">
                            <img src="${data?.photoURL || 'img/avatar-inicial.png'}" alt="Foto de Perfil" 
                                style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #fff; 
                                       box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1;">
                            <div style="position: absolute; bottom: 5px; right: 5px; width: 12px; height: 12px; 
                                         background: #2E7D32; border-radius: 50%; border: 2px solid #fff; 
                                         animation: pulse 1.5s infinite;"></div>
                        </div>
                        <div style="margin: 10px 0; font-weight: bold; color: #666;">${currentName}</div>
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

                    // Modal de confirmação
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

                    // Atualiza o nome no menu
                    const userNameElement = this.querySelector('.user-name-menu');
                    if (userNameElement) {
                        userNameElement.textContent = newName;
                    }
                }
            });
        }

        // Botão de logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                profileMenu?.classList.remove('visible');
                
                // Confirmação antes do logout
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                const userData = userDoc.data();
                const displayName = userData?.displayName || auth.currentUser.email;

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
                    try {
                        await signOut(auth);
                        
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

                        localStorage.clear();
                        window.location.href = 'index.html';
                    } catch (error) {
                        console.error('Erro ao fazer logout:', error);
                        Swal.fire({
                            title: 'Erro ao fazer logout',
                            text: 'Por favor, tente novamente.',
                            icon: 'error',
                            confirmButtonColor: '#2E7D32'
                        });
                    }
                }
            });
        }
    }

    getPageTitle(path) {
        const titles = {
            '/gate.html': 'GATE',
            '/portaria.html': 'PORTARIA',
            '/registros-portaria.html': 'REGISTROS PORTARIA'
        };
        
        // Remove qualquer caminho base se existir
        const fileName = path.split('/').pop();
        return titles[`/${fileName}`] || 'GATE';
    }

    getPageIcon(path) {
        const icons = {
            '/gate.html': 'fas fa-door-open',
            '/portaria.html': 'fas fa-clipboard-list',
            '/registros-portaria.html': 'fas fa-list-alt'
        };
        
        const fileName = path.split('/').pop();
        return icons[`/${fileName}`] || 'fas fa-door-open';
    }

    async loadProfilePicture() {
        const user = auth.currentUser;
        if (!user) {
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data();
            
            const newSrc = userData?.photoURL || localStorage.getItem('userProfilePic') || 'img/avatar-inicial.png';
        
            // Atualizar avatar no botão do perfil
            const profilePic = this.querySelector('.profile-pic');
            if (profilePic) {
                profilePic.src = newSrc;
            }

            // Atualizar avatar no menu
            const menuPic = this.querySelector('.profile-pic-menu');
            if (menuPic) {
                menuPic.src = newSrc;
            }

            // Atualizar nome no menu
            const userName = userData?.displayName || user.email;
            const userNameElement = this.querySelector('.user-name-menu');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
            
            localStorage.setItem('userProfilePic', newSrc);
        } catch (error) {
            // Em caso de erro, usar avatar padrão
            const profilePic = this.querySelector('.profile-pic');
            if (profilePic) profilePic.src = 'img/avatar-inicial.png';

            const menuPic = this.querySelector('.profile-pic-menu');
            if (menuPic) menuPic.src = 'img/avatar-inicial.png';

            const userNameElement = this.querySelector('.user-name-menu');
            if (userNameElement) userNameElement.textContent = 'Erro ao carregar';
        }
    }

        // Atualiza a data e hora no elemento
    updateDateTime() {
        const dateTimeElement = this.querySelector('#currentDateTime');
        if (dateTimeElement) {
            dateTimeElement.textContent = this.formatDate();
        }
    }

    // Formata a data e hora no padrão brasileiro
    formatDate() {
        const now = new Date();
        const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0];
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // Primeira letra maiúscula do dia da semana
        const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        
        return `${capitalizedWeekday}, ${day}/${month}/${year} ${hours}:${minutes}`;
    }

    async fetchWeather() {
        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;

            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=America/Bahia`);
            const data = await response.json();

            return {
                temperature: Math.round(data.current.temperature_2m),
                weatherCode: data.current.weather_code,
                windSpeed: Math.round(data.current.wind_speed_10m),
                latitude,
                longitude
            };
        } catch (error) {
            console.error('Erro ao buscar dados do clima:', error);
            throw error;
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalização não é suportada pelo seu navegador'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                position => resolve(position),
                error => {
                    console.error('Erro ao obter localização:', error);
                    reject(error);
                },
                options
            );
        });
    }

    async updateWeatherUI() {
        try {
            const currentTime = Date.now();
            const dateTimeElement = this.querySelector('#currentDateTime');
            const tempElement = this.querySelector('#temperature');
            const cityNameElement = this.querySelector('#cityName');
            const weatherDescription = this.querySelector('#weatherDescription');
            const windSpeedElement = this.querySelector('#windSpeed');

            // Atualizar data/hora
            if (dateTimeElement) {
                dateTimeElement.textContent = this.formatDate();
            }

            // Verificar se precisa atualizar o clima (a cada 30 minutos)
            if (!weatherCache || currentTime - lastWeatherUpdate > 30 * 60 * 1000) {
                weatherCache = await this.fetchWeather();
                lastWeatherUpdate = currentTime;
            }

            const { temperature, weatherCode, windSpeed, latitude, longitude } = weatherCache;

            // Buscar nome da cidade
            if (cityNameElement) {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const city = data.address.city || data.address.town || data.address.village || 'Cidade não encontrada';
                    cityNameElement.innerHTML = `${city}`;
                } catch (error) {
                    console.error('Erro ao buscar nome da cidade:', error);
                    cityNameElement.textContent = 'Salvador - BA';
                }
            }

            // Atualizar temperatura e ícone
            if (tempElement) {
                const iconPath = weatherIcons[weatherCode] || '/img/bx-sun-bright.svg';
                
                // Carregar o SVG do clima
                try {
                    const response = await fetch(iconPath);
                    const svgContent = await response.text();
                    
                    const iconContainer = document.createElement('div');
                    iconContainer.style.width = '24px';
                    iconContainer.style.height = '24px';
                    iconContainer.style.marginLeft = '4px';
                    iconContainer.style.display = 'inline-flex';
                    iconContainer.style.alignItems = 'center';
                    iconContainer.innerHTML = svgContent;
                    
                    const svgElement = iconContainer.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.fill = '#2E7D32';
                        svgElement.style.width = '100%';
                        svgElement.style.height = '100%';
                        
                        // Adicionar classes de animação baseadas no código do tempo
                        if (weatherCode >= 51 && weatherCode <= 65) { // Chuva
                            svgElement.classList.add('weather-rain');
                        } else if (weatherCode >= 80 && weatherCode <= 99) { // Trovoada
                            svgElement.classList.add('weather-thunder');
                        } else if (weatherCode === 0) { // Céu limpo
                            svgElement.classList.add('weather-sun');
                        }
                    }
                    
                    const weatherContainer = document.createElement('div');
                    weatherContainer.style.display = 'flex';
                    weatherContainer.style.alignItems = 'center';
                    weatherContainer.style.justifyContent = 'flex-end';
                    weatherContainer.style.gap = '4px';
                    
                    const tempText = document.createElement('span');
                    tempText.textContent = `${temperature}°C`;
                    weatherContainer.appendChild(tempText);
                    weatherContainer.appendChild(iconContainer);
                    
                    tempElement.innerHTML = '';
                    tempElement.appendChild(weatherContainer);
                } catch (error) {
                    console.error('Erro ao carregar SVG do clima:', error);
                    tempElement.textContent = `${temperature}°C`;
                }
            }

            // Limpar descrição do tempo (agora está junto com a temperatura)
            if (weatherDescription) {
                weatherDescription.innerHTML = '';
            }

            // Atualizar velocidade do vento com ícone estático
            if (windSpeedElement) {
                try {
                    const response = await fetch('/img/bx-wind.svg');
                    const svgContent = await response.text();
                    
                    const windContainer = document.createElement('div');
                    windContainer.style.display = 'flex';
                    windContainer.style.alignItems = 'center';
                    windContainer.style.justifyContent = 'flex-end';
                    windContainer.style.gap = '4px';
                    
                    const iconContainer = document.createElement('div');
                    iconContainer.style.width = '24px';
                    iconContainer.style.height = '24px';
                    iconContainer.style.display = 'inline-flex';
                    iconContainer.style.alignItems = 'center';
                    iconContainer.style.marginRight = '4px';
                    iconContainer.innerHTML = svgContent;
                    
                    const svgElement = iconContainer.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.fill = '#666666';
                        svgElement.style.width = '100%';
                        svgElement.style.height = '100%';
                    }
                    
                    const speedText = document.createElement('span');
                    speedText.textContent = `${windSpeed} km/h`;
                    windContainer.appendChild(iconContainer);
                    windContainer.appendChild(speedText);
                    
                    windSpeedElement.innerHTML = '';
                    windSpeedElement.appendChild(windContainer);
                } catch (error) {
                    console.error('Erro ao carregar SVG do vento:', error);
                    windSpeedElement.textContent = `${windSpeed} km/h`;
                }
            }

        } catch (error) {
            console.error('Erro ao atualizar interface:', error);
            
            // Mostrar mensagem de erro amigável
            Swal.fire({
                title: 'Ops! Algo deu errado',
                text: 'Não foi possível carregar os dados do clima. Por favor, verifique se permitiu o acesso à localização.',
                icon: 'error',
                confirmButtonText: 'Tentar Novamente'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Recarrega a página quando clicar em Tentar Novamente
                    window.location.reload();
                }
            });

            // Atualizar interface com mensagem de erro
            if (tempElement) tempElement.textContent = '--°C';
            if (windSpeedElement) windSpeedElement.textContent = '-- km/h';
            if (cityNameElement) cityNameElement.textContent = 'Local não disponível';
            if (weatherDescription) weatherDescription.textContent = 'Não foi possível carregar o clima';
        }
    }
}

// Registra o componente
customElements.define('header-profile', HeaderProfile);

// Removido o intervalo global pois agora é gerenciado dentro do componente

// Atualizar clima a cada 30 minutos
setInterval(() => {
    const headerProfile = document.querySelector('header-profile');
    if (headerProfile) {
        headerProfile.updateWeatherUI();
    }
}, 30 * 60 * 1000);

// Primeira atualização
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que todos os elementos estejam carregados
    setTimeout(() => {
        const headerProfile = document.querySelector('header-profile');
        if (headerProfile) {
            headerProfile.updateWeatherUI();
        }
    }, 500);
});

// Atualizar UI quando a página voltar do cache
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        const headerProfile = document.querySelector('header-profile');
        if (headerProfile) {
            headerProfile.updateWeatherUI();
        }
    }
});
