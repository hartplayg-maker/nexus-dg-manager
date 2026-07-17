const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Corpo da requisição vazio' })
            };
        }

        let data;
        try {
            data = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'JSON inválido' })
            };
        }

        const { tamer, selected, pending, date, time, completed, total, image } = data;

        if (!tamer || !tamer.trim()) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nome do Tamer é obrigatório' })
            };
        }

        if (!selected || !Array.isArray(selected) || selected.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Selecione pelo menos uma DG' })
            };
        }

        const webhookURL = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookURL) {
            console.error('DISCORD_WEBHOOK_URL não configurada');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Webhook não configurado no servidor' })
            };
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

        // =========================================
        // 🔥 PARTE CORRIGIDA - ENVIO DA IMAGEM
        // =========================================
// 🔥 PARTE CORRIGIDA PARA ENVIAR IMAGEM
if (image) {
    try {
        // Remove o prefixo "data:image/png;base64," se existir
        let base64Data = image;
        if (image.includes('base64,')) {
            base64Data = image.split('base64,')[1];
        }
        
        // 🔥 CRIA O BUFFER CORRETAMENTE
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // 🔥 VERIFICA SE O BUFFER NÃO ESTÁ VAZIO
        if (imageBuffer.length < 100) {
            console.warn('⚠️ Buffer da imagem muito pequeno:', imageBuffer.length);
        } else {
            console.log('📸 Tamanho da imagem:', imageBuffer.length, 'bytes');
            
            // 🔥 ADICIONA AO FORMDATA
            form.append('file', imageBuffer, {
                filename: `nexus-dg-${tamer.trim()}-${Date.now()}.png`,
                contentType: 'image/png'
            });
        }
    } catch (imageError) {
        console.error('❌ Erro ao processar imagem:', imageError);
        // Continua mesmo sem imagem
    }
}

        // 3. Envia para o Discord
        console.log('📤 Enviando para o Discord...');
        console.log('📊 Dados:', { tamer, completed, total });
        
        const response = await fetch(webhookURL, {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro no Discord:', response.status, errorText);
            
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Erro no Discord: ${response.status}`,
                    details: errorText
                })
            };
        }

        console.log('✅ Enviado com sucesso!');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Relatório enviado com sucesso!' 
            })
        };

    } catch (error) {
        console.error('❌ Erro na função:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Erro interno ao processar requisição',
                details: error.message
            })
        };
    }
};