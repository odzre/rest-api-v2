const fs = require('fs');
const path = require('path');

const SITE_CONFIG_PATH = path.join(__dirname, 'site.json');

function getSiteConfig() {
    try {
        return JSON.parse(fs.readFileSync(SITE_CONFIG_PATH, 'utf8'));
    } catch {
        return { title: 'Odzreshop API', siteName: 'Odzreshop API', author: 'Odzreshop', favicon: '', whatsapp: '' };
    }
}

function saveSiteConfig(config) {
    fs.writeFileSync(SITE_CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');
}

module.exports = { getSiteConfig, saveSiteConfig };
