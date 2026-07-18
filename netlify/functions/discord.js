const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
    }

    try {
        if (!event.body) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Corpo da requisição vazio' }) };
        }

        const data = JSON.parse(event.body);
        const { tamer, selected, pending, date, time, completed, total } = data;

        if (!tamer || !tamer.trim()) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nome do Tamer é obrigatório' }) };
        }

// ✅ AGORA ACEITA ZERO DGS
// Remove essa validação ou deixa assim:
if (!selected) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Dados inválidos' }) };
}
// selected pode ser um array vazio, tudo bem!

        const webhookURL = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookURL) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Webhook não configurado' }) };
        }

        const progress = Math.round((completed / total) * 100);

        const embed = {
            title: `📊 Relatório de DGs - ${tamer.trim()}`,
            color: 0x00d4ff,
            fields: [
                {
                    name: '✅ DGs Concluídas',
                    value: selected.length > 0 ? selected.map(dg => `• ${dg}`).join('\n') : 'Nenhuma',
                    inline: true
                },
                {
                    name: '❌ DGs Pendentes',
                    value: pending && pending.length > 0 ? pending.map(dg => `• ${dg}`).join('\n') : '🎉 Todas concluídas!',
                    inline: true
                },
                {
                    name: '📈 Progresso',
                    value: `${completed}/${total} DGs (${progress}%)`,
                    inline: false
                },
                {
                    name: '🕐 Data/Hora',
                    value: `${date} • ${time}`,
                    inline: false
                }
            ],
            footer: {
                text: 'Nexus Guild • Digimon Masters Online'
            },
            timestamp: new Date().toISOString()
        };

        const payload = {
            content: `📢 **${tamer.trim()}** registrou suas DGs diárias!`,
            embeds: [embed]
        };

        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro no Discord:', errorText);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ error: `Erro no Discord: ${response.status}` })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Relatório enviado com sucesso!' })
        };

    } catch (error) {
        console.error('Erro:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno', details: error.message })
        };
    }
};