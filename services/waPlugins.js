const { getPluginData, savePluginData, redisKey, getCommands, getWaSettings } = require('./waGateway');
const moment = require('moment-timezone');

/**
 * Handle incoming messages for plugins
 */
async function handlePluginMessage(sock, msg, userId) {
    if (!msg.message) return false;
    
    // Extract text
    const textMessage = msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || 
                        msg.message.imageMessage?.caption || 
                        msg.message.videoMessage?.caption || '';
    
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant || msg.key.remoteJid;

    // Check dynamic lists first (without dot)
    if (isGroup && textMessage && !textMessage.startsWith('.')) {
        const lists = await getPluginData(redisKey.pluginList(userId, from)) || {};
        const trigger = textMessage.trim().toLowerCase();
        if (lists[trigger]) {
            await sock.sendMessage(from, { text: lists[trigger] }, { quoted: msg });
            return true;
        }
    }
    
    if (!textMessage.startsWith('.')) return false;

    // Parse command
    const args = textMessage.trim().split(/ +/);
    const cmd = args[0].toLowerCase();
    const q = args.slice(1).join(' ');

    // Get group metadata if needed
    let groupMetadata = null;
    let groupAdmins = [];
    let isBotAdmin = false;
    let isSenderAdmin = false;
    let isOwner = false;

    // Fetch settings
    const settings = await getWaSettings(userId);
    const ownerNumber = settings.ownerNumber ? settings.ownerNumber + '@s.whatsapp.net' : '';
    if (sender === ownerNumber || msg.key.fromMe) isOwner = true;

    if (isGroup) {
        try {
            groupMetadata = await sock.groupMetadata(from);
            groupAdmins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
            isBotAdmin = groupAdmins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net');
            isSenderAdmin = groupAdmins.includes(sender);
        } catch (e) {}
    }

    const reply = async (text) => {
        await sock.sendMessage(from, { text }, { quoted: msg });
    };

    // Helper variables replacer
    const replaceVars = async (template) => {
        if (!template) return '';
        let res = template;
        res = res.replace(/@user/g, `@${sender.split('@')[0]}`);
        res = res.replace(/@jam/g, moment().tz('Asia/Jakarta').format('HH:mm:ss'));
        res = res.replace(/@tanggal1/g, moment().tz('Asia/Jakarta').format('MM/DD/YYYY'));
        res = res.replace(/@tanggal2/g, moment().tz('Asia/Jakarta').format('D MMMM YYYY'));
        res = res.replace(/@namagroup/g, groupMetadata ? groupMetadata.subject : 'Grup');
        res = res.replace(/@botname/g, settings.botName || 'Bot');
        res = res.replace(/@storename/g, settings.storeName || 'Store');
        res = res.replace(/@ownername/g, settings.ownerName || 'Owner');
        res = res.replace(/@noowner/g, settings.ownerNumber || '');
        
        if (res.includes('@cmdmenu')) {
            const cmds = await getCommands(userId);
            const cmdText = cmds.map(c => `=> ${c.trigger}`).join('\n');
            res = res.replace(/@cmdmenu/g, cmdText);
        }
        if (res.includes('@groupjoin')) {
            const groups = Object.keys(sock.chats || {}).filter(c => c.endsWith('@g.us'));
            res = res.replace(/@groupjoin/g, groups.length.toString());
        }
        if (res.includes('@list')) {
            const lists = await getPluginData(redisKey.pluginList(userId, from));
            const listNames = Object.keys(lists||{});
            if (listNames.length > 0) {
                res = res.replace(/@list/g, listNames.map((l, i) => `${i+1}. ${l}`).join('\n'));
            } else {
                res = res.replace(/@list/g, 'Belum ada list di grup ini.');
            }
        }
        return res;
    };

    const mentions = [sender];

    // 1. PING
    if (cmd === '.ping') {
        const start = Date.now();
        await reply('Pong!');
        const end = Date.now();
        await sock.sendMessage(from, { text: `Response time: ${end - start}ms` }, { quoted: msg });
        return true;
    }

    // 2. MENU / ALLMENU
    if (cmd === '.menu' || cmd === '.allmenu') {
        let template = settings.menuTemplate || 'Halo @user, ini menu dari @botname:\n@cmdmenu\n\nList Grup:\n@list';
        const parsed = await replaceVars(template);
        await sock.sendMessage(from, { text: parsed, mentions }, { quoted: msg });
        return true;
    }

    // 3. HIDETAG
    if (cmd === '.hidetag' || cmd === '.ht') {
        if (!isGroup) return await reply('Command ini hanya bisa digunakan di dalam grup.');
        if (!isOwner && !isSenderAdmin) return await reply('Akses ditolak! Hanya Admin/Owner yang bisa menggunakan command ini.');
        if (!q) return await reply('Penggunaan: .hidetag [pesan]');
        
        await sock.sendMessage(from, { text: q, mentions: groupMetadata.participants.map(a => a.id) });
        return true;
    }

    // 4. KICK
    if (cmd === '.kick') {
        if (!isGroup) return await reply('Hanya bisa di grup.');
        if (!isBotAdmin) return await reply('Bot harus menjadi admin.');
        if (!isOwner && !isSenderAdmin) return await reply('Hanya Admin/Owner.');
        
        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentionedJid.length === 0) return await reply('Tag member yang mau di-kick.');
        
        await sock.groupParticipantsUpdate(from, mentionedJid, 'remove');
        await reply('Berhasil mengeluarkan member.');
        return true;
    }

    // 5. PROSES / DONE
    if (cmd === '.proses') {
        if (!isGroup) return await reply('Hanya bisa di grup.');
        if (!isOwner && !isSenderAdmin) return await reply('Hanya Admin/Owner.');
        if (!q) return await reply('Masukkan pesanan, contoh: .proses 100 Diamond ML');

        const k = redisKey.pluginProses(userId, from);
        let prosesData = await getPluginData(k) || [];
        const prosesId = Date.now().toString(36);
        prosesData.push({ id: prosesId, order: q, time: new Date().toISOString() });
        await savePluginData(k, prosesData);

        let template = settings.prosesTemplate || '✅ Pesanan sedang diproses!\n\nOrder: ${order}';
        template = template.replace('${order}', q);
        const parsed = await replaceVars(template);
        await sock.sendMessage(from, { text: parsed, mentions }, { quoted: msg });
        return true;
    }

    if (cmd === '.done') {
        if (!isGroup) return await reply('Hanya bisa di grup.');
        if (!isOwner && !isSenderAdmin) return await reply('Hanya Admin/Owner.');
        if (!q) return await reply('Masukkan nomor atau pesanan, contoh: .done 100 Diamond');

        const k = redisKey.pluginProses(userId, from);
        let prosesData = await getPluginData(k) || [];
        
        const idx = prosesData.findIndex(p => p.order.toLowerCase() === q.toLowerCase());
        if (idx !== -1) {
            prosesData.splice(idx, 1);
            await savePluginData(k, prosesData);
        }

        let template = settings.doneTemplate || '🎉 Pesanan telah selesai!\n\nOrder: ${order}';
        template = template.replace('${order}', q);
        const parsed = await replaceVars(template);
        await sock.sendMessage(from, { text: parsed, mentions }, { quoted: msg });
        return true;
    }

    if (cmd === '.listproses') {
        if (!isGroup) return await reply('Hanya bisa di grup.');
        const k = redisKey.pluginProses(userId, from);
        let prosesData = await getPluginData(k) || [];
        if (prosesData.length === 0) return await reply('Tidak ada antrean pesanan yang sedang diproses.');
        
        let text = '*DAFTAR PROSES PESANAN*\n\n';
        prosesData.forEach((p, i) => {
            text += `${i+1}. ${p.order}\n`;
        });
        await reply(text);
        return true;
    }

    // 6. ADDLIST / DELLIST
    if (cmd === '.addlist') {
        if (!isGroup) return await reply('Hanya bisa di grup.');
        if (!isOwner && !isSenderAdmin) return await reply('Hanya Admin/Owner.');
        const [key, ...valArr] = q.split('|');
        if (!key || valArr.length === 0) return await reply('Format salah. Gunakan: .addlist kunci | teks balasan');
        
        const listKey = key.trim().toLowerCase();
        const listVal = valArr.join('|').trim();
        
        const k = redisKey.pluginList(userId, from);
        let lists = await getPluginData(k) || {};
        lists[listKey] = listVal;
        await savePluginData(k, lists);
        
        await reply(`Berhasil menambahkan list: ${listKey}`);
        return true;
    }

    if (cmd === '.dellist') {
        if (!isGroup) return await reply('Hanya bisa di grup.');
        if (!isOwner && !isSenderAdmin) return await reply('Hanya Admin/Owner.');
        if (!q) return await reply('Gunakan: .dellist kunci');
        
        const listKey = q.trim().toLowerCase();
        const k = redisKey.pluginList(userId, from);
        let lists = await getPluginData(k) || {};
        
        if (lists[listKey]) {
            delete lists[listKey];
            await savePluginData(k, lists);
            await reply(`Berhasil menghapus list: ${listKey}`);
        } else {
            await reply('Kunci list tidak ditemukan.');
        }
        return true;
    }

    // 7. GROUP SETTINGS (.group close/open)
    if (cmd === '.group') {
        if (!isGroup) return await reply('Hanya bisa di grup.');
        if (!isBotAdmin) return await reply('Bot harus menjadi admin.');
        if (!isOwner && !isSenderAdmin) return await reply('Hanya Admin/Owner.');
        
        if (q === 'close') {
            await sock.groupSettingUpdate(from, 'announcement');
            await reply('Grup ditutup. Hanya admin yang bisa mengirim pesan.');
        } else if (q === 'open') {
            await sock.groupSettingUpdate(from, 'not_announcement');
            await reply('Grup dibuka. Semua member bisa mengirim pesan.');
        } else {
            await reply('Penggunaan: .group open / .group close');
        }
        return true;
    }

    return false;
}

/**
 * Handle Welcome/Goodbye events
 */
async function handleGroupParticipantsUpdate(sock, { id, participants, action }, userId) {
    const settings = await getWaSettings(userId);
    
    for (const jid of participants) {
        let template = '';
        if (action === 'add') {
            template = settings.welcomeTemplate || '';
        } else if (action === 'remove') {
            template = settings.goodbyeTemplate || '';
        }
        
        if (!template) continue;

        let groupMetadata = { subject: 'Grup' };
        try { groupMetadata = await sock.groupMetadata(id); } catch(e){}

        let parsed = template;
        parsed = parsed.replace(/@user/g, `@${jid.split('@')[0]}`);
        parsed = parsed.replace(/@namagroup/g, groupMetadata.subject);
        parsed = parsed.replace(/@jam/g, moment().tz('Asia/Jakarta').format('HH:mm:ss'));

        await sock.sendMessage(id, { text: parsed, mentions: [jid] });
    }
}

module.exports = {
    handlePluginMessage,
    handleGroupParticipantsUpdate
};
