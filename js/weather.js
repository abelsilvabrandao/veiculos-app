import { DotLottie } from 'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm';

// Cache para evitar chamadas desnecessárias
let lastWeatherUpdate = 0;
let weatherCache = null;
let weatherAnimation = null;
let windAnimation = null;

// Animações Lottie para diferentes condições climáticas
const weatherAnimations = {
    0: 'https://lottie.host/8df8da0d-2513-4349-83d6-53316ed956c1/KhaS3kBDSw.lottie', // Céu limpo
    1: 'https://lottie.host/7ce1b784-6726-46c8-b933-41f264ebaa96/NbwoL0xCub.lottie', // Parcialmente nublado
    2: 'https://lottie.host/7ce1b784-6726-46c8-b933-41f264ebaa96/NbwoL0xCub.lottie', // Parcialmente nublado
    3: 'https://lottie.host/c125e872-720b-4f10-bd22-ed14ea017b79/HImACbvYeB.lottie', // Nublado
    45: 'https://lottie.host/31e7000d-7de2-4755-b64d-aad51e0e6837/FEVEPdQqP3.lottie', // Neblina
    48: 'https://lottie.host/31e7000d-7de2-4755-b64d-aad51e0e6837/FEVEPdQqP3.lottie', // Neblina com geada
    51: 'https://lottie.host/2c64ac6f-53e0-493b-99c4-a9ab31f92ecd/OxeLQJWlYo.lottie', // Chuvisco leve
    53: 'https://lottie.host/2c64ac6f-53e0-493b-99c4-a9ab31f92ecd/OxeLQJWlYo.lottie', // Chuvisco moderado
    55: 'https://lottie.host/2c64ac6f-53e0-493b-99c4-a9ab31f92ecd/OxeLQJWlYo.lottie', // Chuvisco intenso
    61: 'https://lottie.host/2c64ac6f-53e0-493b-99c4-a9ab31f92ecd/OxeLQJWlYo.lottie', // Chuva leve
    65: 'https://lottie.host/2c64ac6f-53e0-493b-99c4-a9ab31f92ecd/OxeLQJWlYo.lottie', // Chuva forte
    80: 'https://lottie.host/embed/3584a041-60dc-466a-98ad-8c249e7078da/Vvuh1r69Ht.lottie',// Chuva leve com trovoada
    81: 'https://lottie.host/embed/3584a041-60dc-466a-98ad-8c249e7078da/Vvuh1r69Ht.lottie', // Chuva moderada com trovoada
    82: 'https://lottie.host/embed/3584a041-60dc-466a-98ad-8c249e7078da/Vvuh1r69Ht.lottie', // Chuva forte com trovoada
    95: 'https://lottie.host/embed/f3d78749-1358-43c6-84bc-0af905270748/hjGbm6X2it.lottie', // Trovoada
    96: 'https://lottie.host/embed/f3d78749-1358-43c6-84bc-0af905270748/hjGbm6X2it.lottie', // Trovoada com granizo
    99: 'https://lottie.host/embed/f3d78749-1358-43c6-84bc-0af905270748/hjGbm6X2it.lottie' // Trovoada forte com granizo
};

// URL da animação do vento
const windAnimationUrl = 'https://lottie.host/4214a949-0977-48aa-b2ce-15d3bef7b54b/ysO0Q4u1fW.lottie';

// Ícones do tempo baseados no código WMO usando Font Awesome
const weatherIcons = {
    0: '<i class="fas fa-sun text-warning"></i>', // Céu limpo -OK
    1: '<i class="fas fa-cloud-sun text-info"></i>', // Parcialmente nublado -OK
    2: '<i class="fas fa-cloud-sun text-info"></i>', // Parcialmente nublado -OK
    3: '<i class="fas fa-cloud text-secondary"></i>', // Nublado -OK
    45: '<i class="fas fa-smog text-secondary"></i>', // Neblina -OK
    48: '<i class="fas fa-smog text-secondary"></i>', // Neblina com geada -OK
    51: '<i class="fas fa-cloud-rain text-info"></i>', // Chuvisco leve -OK
    53: '<i class="fas fa-cloud-rain text-info"></i>', // Chuvisco moderado -OK
    55: '<i class="fas fa-cloud-showers-heavy text-info"></i>', // Chuvisco intenso -OK
    61: '<i class="fas fa-cloud-rain text-primary"></i>', // Chuva leve -OK
    63: '<i class="fas fa-cloud-showers-heavy text-primary"></i>', // Chuva moderada -OK
    65: '<i class="fas fa-cloud-showers-heavy text-primary"></i>', // Chuva forte -OK
    71: '<i class="fas fa-snowflake text-info"></i>', // Neve leve // N
    73: '<i class="fas fa-snowflake text-info"></i>', // Neve moderada // N
    75: '<i class="fas fa-snowflake text-info"></i>', // Neve forte // N
    77: '<i class="fas fa-snowflake text-info"></i>', // Grãos de neve // N
    80: '<i class="fas fa-bolt text-warning"></i>', // Chuva leve com trovoada - OK
    81: '<i class="fas fa-bolt text-warning"></i>', // Chuva moderada com trovoada - OK
    82: '<i class="fas fa-poo-storm text-warning"></i>', // Chuva forte com trovoada - OK
    85: '<i class="fas fa-bolt text-warning"></i>', // Neve leve com trovoada // N
    86: '<i class="fas fa-poo-storm text-warning"></i>', // Neve forte com trovoada // N
    95: '<i class="fas fa-bolt text-warning"></i>', // Trovoada - OK
    96: '<i class="fas fa-poo-storm text-warning"></i>', // Trovoada com granizo - OK
    99: '<i class="fas fa-poo-storm text-warning"></i>'  // Trovoada forte com granizo - OK
};

// Função para formatar a data
function formatDate() {
    const date = new Date();
    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${weekDays[date.getDay()]}, ${day}/${month}/${year} ${hours}:${minutes}`;
}

// Função para buscar a previsão do tempo
async function fetchWeather() {
    try {
        // Atualizar data e hora
        document.getElementById('currentDateTime').textContent = formatDate();

        // Verificar cache (atualizar a cada 30 minutos)
        const now = Date.now();
        if (weatherCache && (now - lastWeatherUpdate < 30 * 60 * 1000)) {
            return weatherCache;
        }

        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        // Buscar nome da cidade usando API de geocoding
        const geocodingResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`);
        const geocodingData = await geocodingResponse.json();
        const cityName = geocodingData.city || geocodingData.locality || 'Local não identificado';

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=America%2FSao_Paulo`);
        const data = await response.json();

        // Adicionar nome da cidade aos dados do tempo
        data.city = cityName;

        // Atualizar cache
        weatherCache = data;
        lastWeatherUpdate = now;

        return data;
    } catch (error) {
        console.error('Erro ao buscar dados do clima:', error);
        console.error('Erro ao buscar previsão do tempo:', error);
        throw error;
    }
}

// Função para obter localização atual
async function getCurrentPosition() {
    try {
        // Primeiro, verifica se o navegador suporta geolocalização
        if (!navigator.geolocation) {
            throw new Error('Seu navegador não suporta geolocalização');
        }

        // Função para verificar se é dispositivo móvel
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Tenta obter a localização primeiro, sem mostrar mensagem
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    pos => resolve(pos),
                    error => reject(error),
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    }
                );
            });
            return position;
        } catch (error) {
            // Se for erro de permissão negada, mostra mensagem apropriada
            if (error.code === error.PERMISSION_DENIED) {
                if (isMobile) {
                    await Swal.fire({
                        title: 'Localização Necessária',
                        html: `Para ver o clima local no seu celular:<br><br>
                              1. Abra as configurações do seu celular<br>
                              2. Vá em Configurações do Navegador<br>
                              3. Procure por "Permissões" ou "Localização"<br>
                              4. Ative a localização para este site<br>
                              5. Volte e recarregue a página`,
                        icon: 'warning',
                        confirmButtonText: 'Recarregar',
                        showCancelButton: true,
                        cancelButtonText: 'Depois'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.reload();
                        }
                    });
                } else {
                    await Swal.fire({
                        title: 'Localização Necessária',
                        html: `Para ver o clima local:<br>
                              1. Clique no ícone de cadeado/info na barra de endereço<br>
                              2. Encontre "Localização" nas permissões<br>
                              3. Selecione "Permitir"<br>
                              4. Recarregue a página`,
                        icon: 'warning',
                        confirmButtonText: 'Entendi'
                    });
                }
            }
            throw error;
        }


    } catch (error) {
        console.error('Erro ao obter localização:', error);
        throw error;
    }
}

// Função para atualizar a interface
async function updateWeatherUI() {
    const currentDateTimeElement = document.getElementById('currentDateTime');
    const tempElement = document.getElementById('temperature');
    const weatherDescription = document.getElementById('weatherDescription');
    const windSpeedElement = document.getElementById('windSpeed');
    const animationCanvas = document.getElementById('weatherAnimation');
    const windCanvas = document.getElementById('windAnimation');
    const cityNameElement = document.getElementById('cityName');

    // Mostrar estado de carregamento
    if (tempElement) tempElement.textContent = 'Carregando...';
    if (windSpeedElement) windSpeedElement.textContent = 'Carregando...';
    if (cityNameElement) cityNameElement.textContent = 'Carregando...';
    if (weatherDescription) weatherDescription.textContent = 'Carregando dados do clima...';

    try {
        // Atualizar data e hora
        if (currentDateTimeElement) {
            currentDateTimeElement.textContent = formatDate();
        }

        const data = await fetchWeather();
        const temperature = Math.round(data.current_weather.temperature);
        const windSpeed = Math.round(data.current_weather.windspeed);
        const weatherCode = data.current_weather.weathercode;
        const icon = weatherIcons[weatherCode] || '<i class="fas fa-question-circle text-warning"></i>';

        // Atualizar nome da cidade
        if (cityNameElement && data.city) {
            cityNameElement.textContent = data.city;
        }

        // Atualizar temperatura e ícone/animação
        if (tempElement && animationCanvas) {
            // Verificar se existe animação para o código do tempo atual
            if (weatherAnimations[weatherCode]) {
                tempElement.innerHTML = `${temperature}°C`;
                animationCanvas.style.display = 'block';
                
                // Destruir animação anterior se existir
                if (weatherAnimation) {
                    weatherAnimation.destroy();
                    weatherAnimation = null;
                }

                // Criar nova animação
                weatherAnimation = new DotLottie({
                    autoplay: true,
                    loop: true,
                    canvas: animationCanvas,
                    src: weatherAnimations[weatherCode]
                });
            } else {
                // Para climas sem animação, mostrar ícone Font Awesome
                tempElement.innerHTML = `${temperature}°C ${icon}`;
                animationCanvas.style.display = 'none';
            }
        }

        // Limpar descrição do tempo (agora está junto com a temperatura)
        if (weatherDescription) {
            weatherDescription.innerHTML = '';
        }

        if (windSpeedElement && windCanvas) {
            windSpeedElement.textContent = `${windSpeed} km/h`;

            // Destruir animação anterior do vento se existir
            if (windAnimation) {
                windAnimation.destroy();
            }

            // Criar nova animação do vento
            windAnimation = new DotLottie({
                canvas: windCanvas,
                autoplay: true,
                loop: true,
                src: windAnimationUrl
            });
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

// Atualizar a cada 30 minutos
setInterval(updateWeatherUI, 30 * 60 * 1000);

// Primeira atualização
document.addEventListener('DOMContentLoaded', updateWeatherUI);
