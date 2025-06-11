// Cache para evitar chamadas desnecessárias
let lastWeatherUpdate = 0;
let weatherCache = null;

// Ícones do tempo baseados no código WMO usando SVGs locais
const weatherIcons = {
    0: '/assets/icons/bx-sun-bright.svg', // Céu limpo
    1: '/assets/icons/bx-cloud-sun.svg', // Parcialmente nublado
    2: '/assets/icons/bx-cloud-sun.svg', // Parcialmente nublado
    3: '/assets/icons/bx-cloud-fog.svg', // Nublado
    45: '/assets/icons/bx-cloud-fog.svg', // Neblina
    48: '/assets/icons/bx-cloud-fog.svg', // Neblina com geada
    51: '/assets/icons/bx-cloud-drizzle.svg', // Chuvisco leve
    53: '/assets/icons/bx-cloud-drizzle.svg', // Chuvisco moderado
    55: '/assets/icons/bx-cloud-rain.svg', // Chuvisco intenso
    61: '/assets/icons/bx-cloud-rain.svg', // Chuva leve
    63: '/assets/icons/bx-cloud-rain-wind.svg', // Chuva moderada
    65: '/assets/icons/bx-cloud-rain-wind.svg', // Chuva forte
    71: '/assets/icons/bx-cloud-snow.svg', // Neve leve
    73: '/assets/icons/bx-cloud-snow.svg', // Neve moderada
    75: '/assets/icons/bx-snowflake.svg', // Neve forte
    77: '/assets/icons/bx-snowflake.svg', // Grãos de neve
    80: '/assets/icons/bx-thunder.svg', // Chuva leve com trovoada
    81: '/assets/icons/bx-thunder.svg', // Chuva moderada com trovoada
    82: '/assets/icons/bx-thunder.svg', // Chuva forte com trovoada
    85: '/assets/icons/bx-sun-snow.svg', // Neve leve com trovoada
    86: '/assets/icons/bx-sun-snow.svg', // Neve forte com trovoada
    95: '/assets/icons/bx-thunder.svg', // Trovoada
    96: '/assets/icons/bx-thunder.svg', // Trovoada com granizo
    99: '/assets/icons/bx-thunder.svg'  // Trovoada forte com granizo
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
            cityNameElement.innerHTML = `<i class="fas fa-location-dot text-secondary color: #666666;"></i> ${data.city}`;
        }

        // Atualizar temperatura e ícone
        if (tempElement) {
            const iconPath = weatherIcons[weatherCode];
            if (iconPath) {
                // Carregar o SVG
                try {
                    const response = await fetch(iconPath);
                    const svgContent = await response.text();
                    
                    // Criar container para o ícone
                    const iconContainer = document.createElement('div');
                    iconContainer.style.display = 'inline-block';
                    iconContainer.style.width = '24px';
                    iconContainer.style.height = '24px';
                    iconContainer.style.verticalAlign = 'middle';
                    iconContainer.style.marginLeft = '8px';
                    iconContainer.innerHTML = svgContent;
                    
                    // Ajustar cor e animação do SVG
                    const svgElement = iconContainer.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.fill = '#2E7D32';
                        svgElement.style.width = '100%';
                        svgElement.style.height = '100%';
                        
                        // Adicionar classe de animação baseada no clima
                        if (weatherCode >= 51 && weatherCode <= 65) {
                            svgElement.classList.add('weather-rain');
                        } else if (weatherCode >= 80 && weatherCode <= 99) {
                            svgElement.classList.add('weather-thunder');
                        } else if (weatherCode === 0) {
                            svgElement.classList.add('weather-sun');
                        }
                    }
                    
                    tempElement.innerHTML = `${temperature}°C`;
                    tempElement.appendChild(iconContainer);
                } catch (error) {
                    console.error('Erro ao carregar SVG:', error);
                    tempElement.innerHTML = `${temperature}°C`;
                }
            } else {
                tempElement.innerHTML = `${temperature}°C`;
            }
        }

        // Limpar descrição do tempo
        if (weatherDescription) {
            weatherDescription.innerHTML = '';
        }

        if (windSpeedElement) {
            // Carregar o SVG do vento
            fetch('/assets/icons/bx-wind.svg')
                .then(response => response.text())
                .then(svgContent => {
                    const windContainer = document.createElement('div');
                    windContainer.style.display = 'flex';
                    windContainer.style.alignItems = 'center';
                    windContainer.style.gap = '8px';
                    
                    const iconContainer = document.createElement('div');
                    iconContainer.style.width = '24px';
                    iconContainer.style.height = '24px';
                    iconContainer.innerHTML = svgContent;
                    
                    const svgElement = iconContainer.querySelector('svg');
                    if (svgElement) {
                        svgElement.style.fill = '#666666';
                        svgElement.style.width = '100%';
                        svgElement.style.height = '100%';
                    }
                    
                    windContainer.appendChild(iconContainer);
                    windContainer.insertAdjacentHTML('beforeend', `${windSpeed} km/h`);
                    windSpeedElement.innerHTML = '';
                    windSpeedElement.appendChild(windContainer);
                })
                .catch(error => {
                    console.error('Erro ao carregar SVG do vento:', error);
                    windSpeedElement.textContent = `${windSpeed} km/h`;
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

// Função para atualizar o relógio
function updateDateTime() {
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = formatDate();
    }
}

// Atualizar o relógio a cada segundo
setInterval(updateDateTime, 1000);

// Atualizar o clima a cada 30 minutos
setInterval(updateWeatherUI, 30 * 60 * 1000);

// Primeira atualização
document.addEventListener('DOMContentLoaded', () => {
    // Atualizar relógio e clima imediatamente
    updateDateTime();
    setTimeout(updateWeatherUI, 500);
});

// Garantir que as animações sejam recriadas quando a página voltar do cache
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Destruir animações existentes
        if (weatherAnimation) {
            weatherAnimation.destroy();
            weatherAnimation = null;
        }
        if (windAnimation) {
            windAnimation.destroy();
            windAnimation = null;
        }
        // Atualizar UI
        updateWeatherUI();
    }
});
