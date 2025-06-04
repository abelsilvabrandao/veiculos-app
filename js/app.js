import { app } from './main.js';

// Função para atualizar data e hora
function updateDateTime() {
    const now = new Date();
    
    // Formatar o dia da semana
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' })
        .replace('-feira', '')
        .charAt(0)
        .toUpperCase() + 
        now.toLocaleDateString('pt-BR', { weekday: 'long' })
        .replace('-feira', '')
        .slice(1);
    
    // Formatar a data
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    // Formatar a hora
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Montar a string final
    const dateTimeStr = `${weekday}, ${day}/${month}/${year} <strong>${hours}:${minutes}</strong>`;
    document.getElementById('currentDateTime').innerHTML = dateTimeStr;
}

// Atualiza a cada minuto
setInterval(updateDateTime, 60000);
updateDateTime(); // Primeira atualização

// Função para buscar previsão do tempo usando Open-Meteo
async function updateWeather() {
    try {
        // Coordenadas de Santos, SP
        const latitude = -23.9618;
        const longitude = -46.3322;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        
        if (!response.ok) throw new Error('Erro ao buscar dados do clima');
        
        const data = await response.json();
        const temp = Math.round(data.current_weather.temperature);
        const windSpeed = Math.round(data.current_weather.windspeed);
        
        document.getElementById('temperature').textContent = `${temp}°C`;
        document.getElementById('weatherDescription').textContent = `Vento: ${windSpeed} km/h`;
    } catch (error) {
        console.error('Erro ao buscar previsão do tempo:', error);
        document.getElementById('temperature').textContent = '--°C';
        document.getElementById('weatherDescription').textContent = 'Indisponível';
    }
}

// Atualiza a previsão do tempo a cada hora
setInterval(updateWeather, 3600000);
updateWeather(); // Primeira atualização
