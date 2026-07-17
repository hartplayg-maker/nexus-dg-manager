// DOM Elements
const DOM = {
    tamer: document.getElementById('tamer'),
    date: document.getElementById('date'),
    time: document.getElementById('time'),
    checkboxes: document.querySelectorAll('.dg-item input[type="checkbox"]'),
    dgItems: document.querySelectorAll('.dg-item'),
    completedCount: document.getElementById('completed-count'),
    pendingCount: document.getElementById('pending-count'),
    completedProgress: document.getElementById('completed-progress'),
    pendingProgress: document.getElementById('pending-progress'),
    submitBtn: document.getElementById('submit-btn'),
    resetBtn: document.getElementById('reset-btn'),
    message: document.getElementById('message'),
    connectionStatus: document.getElementById('connection-status'),
    cardTamer: document.getElementById('card-tamer'),
    cardDate: document.getElementById('card-date'),
    cardTime: document.getElementById('card-time'),
    cardCompleted: document.getElementById('card-completed-list'),
    cardPending: document.getElementById('card-pending-list'),
    cardDoneCount: document.getElementById('card-done-count'),
    cardPendingCount: document.getElementById('card-pending-count'),
    cardProgress: document.getElementById('card-progress')
};

const ALL_DGS = ['RBH', 'SDGHE', 'MDG', 'DW', 'CDGNE', 'NEVERLAND'];
const DG_ICONS = {
    'RBH': '🔥',
    'SDGHE': '⚡',
    'MDG': '🌊',
    'DW': '🗡️',
    'CDGNE': '🌀',
    'NEVERLAND': '✨'
};

function updateDateTime() {
    const now = new Date();
    DOM.date.textContent = now.toLocaleDateString('pt-BR');
    DOM.time.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function showMessage(text, type = 'success') {
    DOM.message.textContent = text;
    DOM.message.className = `message ${type}`;
    DOM.message.style.display = 'block';
    setTimeout(() => { DOM.message.style.display = 'none'; }, 5000);
}

function setLoading(isLoading) {
    DOM.submitBtn.disabled = isLoading;
    const btnText = DOM.submitBtn.querySelector('.btn-text');
    const btnLoader = DOM.submitBtn.querySelector('.btn-loader');
    const btnIcon = DOM.submitBtn.querySelector('.btn-icon');
    if (isLoading) {
        btnText.style.display = 'none';
        btnIcon.style.display = 'none';
        btnLoader.style.display = 'block';
    } else {
        btnText.style.display = 'inline';
        btnIcon.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function updateStats() {
    const checked = document.querySelectorAll('.dg-item input[type="checkbox"]:checked');
    const total = ALL_DGS.length;
    const completed = checked.length;
    const pending = total - completed;
    
    DOM.completedCount.textContent = completed;
    DOM.pendingCount.textContent = pending;
    DOM.completedProgress.style.width = `${(completed / total) * 100}%`;
    DOM.pendingProgress.style.width = `${(pending / total) * 100}%`;
    
    DOM.dgItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox.checked) {
            item.classList.add('checked');
        } else {
            item.classList.remove('checked');
        }
    });
}

function updateCardPreview(data) {
    DOM.cardTamer.textContent = data.tamer;
    DOM.cardDate.textContent = data.date;
    DOM.cardTime.textContent = data.time;
    
    if (data.selected.length > 0) {
        DOM.cardCompleted.innerHTML = data.selected.map(dg => `<span>${DG_ICONS[dg] || '✓'} ${dg}</span>`).join('');
    } else {
        DOM.cardCompleted.innerHTML = '<span class="card-empty">Nenhuma DG concluída</span>';
    }
    
    if (data.pending.length > 0) {
        DOM.cardPending.innerHTML = data.pending.map(dg => `<span>${DG_ICONS[dg] || '✗'} ${dg}</span>`).join('');
    } else {
        DOM.cardPending.innerHTML = '<span class="card-empty">🎉 Todas concluídas!</span>';
    }
    
    DOM.cardDoneCount.textContent = data.completed;
    DOM.cardPendingCount.textContent = data.pendingCount;
    DOM.cardProgress.textContent = `${Math.round((data.completed / data.total) * 100)}%`;
}

async function generateCardImage() {
    const cardElement = document.getElementById('card-content');
    
    try {
        // 🔥 CONFIGURAÇÃO CORRIGIDA
        const canvas = await html2canvas(cardElement, {
            scale: 2,
            backgroundColor: '#0a0a1a',
            allowTaint: false,
            useCORS: true,
            logging: false,
            width: 500,
            height: cardElement.scrollHeight,
            windowWidth: 500,
            onclone: function(document) {
                // Garante que o card tenha o fundo correto
                const card = document.getElementById('card-content');
                if (card) {
                    card.style.background = '#0a0a1a';
                }
            }
        });
        
        // 🔥 CONVERTE PARA PNG COM QUALIDADE
        const imageData = canvas.toDataURL('image/png', 1.0);
        
        // 🔥 VERIFICA SE A IMAGEM FOI GERADA
        if (!imageData || imageData.length < 1000) {
            throw new Error('Imagem gerada está vazia');
        }
        
        console.log('✅ Imagem gerada com sucesso! Tamanho:', imageData.length);
        return imageData;
        
    } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        throw new Error('Falha ao gerar imagem do card. Tente novamente.');
    }
}

function getSelectedDGs() {
    const checked = document.querySelectorAll('.dg-item input[type="checkbox"]:checked');
    return Array.from(checked).map(cb => cb.value);
}

function getPendingDGs(selected) {
    return ALL_DGS.filter(dg => !selected.includes(dg));
}

function buildCardData() {
    const tamer = DOM.tamer.value.trim();
    const selected = getSelectedDGs();
    const pending = getPendingDGs(selected);
    const now = new Date();
    return {
        tamer,
        selected,
        pending,
        date: now.toLocaleDateString('pt-BR'),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        completed: selected.length,
        total: ALL_DGS.length,
        pendingCount: pending.length
    };
}

function validateForm() {
    const tamer = DOM.tamer.value.trim();
    if (!tamer) {
        showMessage('⚠️ Por favor, informe o nome do seu Tamer.', 'error');
        DOM.tamer.focus();
        return false;
    }
    if (tamer.length < 2) {
        showMessage('⚠️ O nome do Tamer deve ter pelo menos 2 caracteres.', 'error');
        DOM.tamer.focus();
        return false;
    }
    const checked = document.querySelectorAll('.dg-item input[type="checkbox"]:checked');
    if (checked.length === 0) {
        showMessage('⚠️ Selecione pelo menos uma DG concluída.', 'error');
        return false;
    }
    return true;
}

function resetForm() {
    DOM.tamer.value = '';
    DOM.checkboxes.forEach(cb => cb.checked = false);
    updateStats();
    DOM.message.style.display = 'none';
    DOM.tamer.focus();
}

async function sendToDiscord(data, imageData) {
    // 🔥 VERIFICA SE A IMAGEM É VÁLIDA
    if (!imageData || imageData.length < 1000) {
        console.warn('⚠️ Imagem muito pequena ou vazia:', imageData?.length);
        // Continua mesmo sem imagem
    }
    
    const response = await fetch('/.netlify/functions/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tamer: data.tamer,
            selected: data.selected,
            pending: data.pending,
            date: data.date,
            time: data.time,
            completed: data.completed,
            total: data.total,
            image: imageData // 🔥 ENVIA A IMAGEM
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar para o Discord.');
    }
    
    return await response.json();
}

async function handleSubmit() {
    if (!validateForm()) return;
    setLoading(true);
    try {
        const data = buildCardData();
        updateCardPreview(data);
        const imageData = await generateCardImage();
        await sendToDiscord(data, imageData);
        showMessage('✅ Relatório enviado com sucesso para o Discord!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showMessage(`❌ ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

// Event Listeners
DOM.checkboxes.forEach(cb => cb.addEventListener('change', updateStats));
DOM.submitBtn.addEventListener('click', handleSubmit);
DOM.resetBtn.addEventListener('click', resetForm);
DOM.tamer.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSubmit(); });

// Init
updateDateTime();
updateStats();
setInterval(updateDateTime, 60000);
console.log('🚀 Nexus DG Manager loaded successfully!');