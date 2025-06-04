// Formatação do telefone
function formatPhoneNumber(phone) {
    // Remove tudo que não é número
    let cleaned = phone.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    cleaned = cleaned.substring(0, 11);
    
    // Aplica a máscara conforme vai digitando
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 3) return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
    if (cleaned.length <= 7) return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 3)} ${cleaned.substring(3)}`;
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 3)} ${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
}

// Formatação e validação da placa
function formatLicensePlate(plate) {
    // Remove espaços e caracteres especiais
    let cleaned = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Limita a 7 caracteres
    cleaned = cleaned.substring(0, 7);
    
    // Valida o formato
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    const isValid = plateRegex.test(cleaned);
    
    return {
        formattedValue: cleaned,
        isValid: isValid
    };
}

// Eventos de formatação
document.addEventListener('DOMContentLoaded', () => {
    // Formatação do telefone
    const phoneInput = document.getElementById('driverPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const cursorPosition = e.target.selectionStart;
            const oldValue = e.target.value;
            const newValue = formatPhoneNumber(oldValue);
            e.target.value = newValue;

            // Ajusta a posição do cursor
            if (cursorPosition !== oldValue.length) {
                if (newValue.charAt(cursorPosition - 1) === ' ' || 
                    newValue.charAt(cursorPosition - 1) === '-' || 
                    newValue.charAt(cursorPosition - 1) === ')') {
                    e.target.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
                } else {
                    e.target.setSelectionRange(cursorPosition, cursorPosition);
                }
            }
        });
    }

    // Formatação da placa
    const plateInput = document.getElementById('plate');
    if (plateInput) {
        plateInput.addEventListener('input', function(e) {
            const result = formatLicensePlate(e.target.value);
            e.target.value = result.formattedValue;
            
            // Feedback visual
            if (result.formattedValue.length === 7) {
                if (result.isValid) {
                    e.target.classList.remove('invalid');
                    e.target.classList.add('valid');
                } else {
                    e.target.classList.remove('valid');
                    e.target.classList.add('invalid');
                }
            } else {
                e.target.classList.remove('valid', 'invalid');
            }
        });
    }
});

// Exportar funções para uso global
window.formatPhoneNumber = formatPhoneNumber;
window.formatLicensePlate = formatLicensePlate;
