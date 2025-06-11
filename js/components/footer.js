// footer.js
class Footer extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.updateYear();
    }

    updateYear() {
        const yearElement = this.querySelector('#currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    render() {
        this.innerHTML = `
            <footer class="footer glass-effect">
                <div class="container">
                    <p>© <span id="currentYear">2025</span> Intermarítima. Todos os direitos reservados.</p>
                    <p class="text-muted">Desenvolvido por Abel Silva Brandão | Versão 1.0.0</p>
                </div>
            </footer>
        `;
    }
}

// Registra o componente
customElements.define('app-footer', Footer);
