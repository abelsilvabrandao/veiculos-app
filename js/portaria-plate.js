// Gerenciamento do campo de placa da carreta
document.addEventListener('DOMContentLoaded', () => {
    const addTrailerPlateBtn = document.getElementById('addTrailerPlate');
    const trailerPlateGroup = document.getElementById('trailerPlateGroup');
    
    if (addTrailerPlateBtn && trailerPlateGroup) {
        addTrailerPlateBtn.addEventListener('click', () => {
            if (trailerPlateGroup.style.display === 'none') {
                trailerPlateGroup.style.display = 'block';
                addTrailerPlateBtn.innerHTML = '<i class="fas fa-minus"></i> Remover';
            } else {
                trailerPlateGroup.style.display = 'none';
                addTrailerPlateBtn.innerHTML = '<i class="fas fa-plus"></i> Carreta';
                // Limpa o campo da placa da carreta quando esconde
                document.getElementById('trailerPlate').value = '';
            }
        });
    }
});
