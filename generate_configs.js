/**
 * 从 proxy_raw.md 解析代理列表并生成 Clash 配置
 */

const fs = require('fs');

const COUNTRY_FLAGS = {
    '阿根廷': '🇦🇷', '阿拉伯联合酋长国': '🇦🇪', '阿联酋': '🇦🇪',
    '澳大利亚': '🇦🇺', '奥地利': '🇦🇹', '保加利亚': '🇧🇬',
    '比利时': '🇧🇪', '巴西': '🇧🇷', '白俄罗斯': '🇧🇾',
    '玻利维亚': '🇧🇴', '加拿大': '🇨🇦', '智利': '🇨🇱',
    '瑞士': '🇨🇭', '科特迪瓦': '🇨🇮', '中国': '🇨🇳',
    '哥伦比亚': '🇨🇴', '哥斯达黎加': '🇨🇷', '塞浦路斯': '🇨🇾',
    '德国': '🇩🇪', '丹麦': '🇩🇰', '多米尼加': '🇩🇴',
    '西班牙': '🇪🇸', '法国': '🇫🇷', '英国': '🇬🇧',
    '希腊': '🇬🇷', '香港': '🇭🇰', '匈牙利': '🇭🇺',
    '印度尼西亚': '🇮🇩', '印度': '🇮🇳', '爱尔兰': '🇮🇪',
    '以色列': '🇮🇱', '意大利': '🇮🇹', '日本': '🇯🇵',
    '韩国': '🇰🇷', '墨西哥': '🇲🇽', '马来西亚': '🇲🇾',
    '荷兰': '🇳🇱', '挪威': '🇳🇴', '新西兰': '🇳🇿',
    '巴拿马': '🇵🇦', '秘鲁': '🇵🇪', '菲律宾': '🇵🇭',
    '波兰': '🇵🇱', '葡萄牙': '🇵🇹', '罗马尼亚': '🇷🇴',
    '俄罗斯': '🇷🇺', '沙特阿拉伯': '🇸🇦', '新加坡': '🇸🇬',
    '瑞典': '🇸🇪', '泰国': '🇹🇭', '台湾': '🇹🇼',
    '土耳其': '🇹🇷', '乌克兰': '🇺🇦', '美国': '🇺🇸',
    '越南': '🇻🇳', '南非': '🇿🇦'
};

function parseProxies(content) {
    const lines = content.split('\n');
    const proxies = [];
    for (const line of lines) {
        const match = line.match(/\|\s*(\d+\.\d+\.\d+\.\d+):(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
        if (match) {
            const [, ip, port, country, username] = match;
            proxies.push({ ip: ip.trim(), port: parseInt(port.trim()), country: country.trim(), username: username.trim(), password: '1' });
        }
    }
    return proxies;
}

function generateClashConfig(proxies) {
    const countryMap = {};
    for (const proxy of proxies) {
        if (!countryMap[proxy.country]) countryMap[proxy.country] = [];
        countryMap[proxy.country].push(proxy);
    }
    const sortedCountries = Object.keys(countryMap).sort((a, b) => countryMap[b].length - countryMap[a].length);
    const proxyList = [], proxyNames = [];
    for (const country of sortedCountries) {
        countryMap[country].forEach((proxy, index) => {
            const name = `${COUNTRY_FLAGS[country] || '🌍'}${country}-${index + 1}`;
            proxyNames.push(name);
            proxyList.push({ name, type: 'http', server: proxy.ip, port: proxy.port, username: proxy.username, password: proxy.password });
        });
    }
    let yaml = `# Clash 配置 - 自动更新\n# 时间: ${new Date().toISOString().slice(0,19).replace('T',' ')}\n# 节点: ${proxyList.length}\n\nport: 7890\nsocks-port: 7891\nallow-lan: true\nmode: rule\nlog-level: info\n\nproxies:\n`;
    for (const p of proxyList) yaml += `  - name: "${p.name}"\n    type: ${p.type}\n    server: ${p.server}\n    port: ${p.port}\n    username: "${p.username}"\n    password: "${p.password}"\n`;
    yaml += `\nproxy-groups:\n  - name: "🚀节点选择"\n    type: select\n    proxies:\n      - "♻️自动选择"\n`;
    for (const n of proxyNames) yaml += `      - "${n}"\n`;
    yaml += `      - DIRECT\n\n  - name: "♻️自动选择"\n    type: url-test\n    proxies:\n`;
    for (const n of proxyNames.slice(0,50)) yaml += `      - "${n}"\n`;
    yaml += `    url: "http://www.gstatic.com/generate_204"\n    interval: 300\n    tolerance: 50\n\nrules:\n  - GEOIP,CN,DIRECT\n  - MATCH,🚀节点选择\n`;
    return yaml;
}

function main() {
    const content = fs.readFileSync('proxy_raw.md', 'utf-8');
    const proxies = parseProxies(content);
    console.log(`解析到 ${proxies.length} 个代理`);
    if (proxies.length === 0) { console.error('未找到代理'); process.exit(1); }
    fs.writeFileSync('clash_sub.yaml', generateClashConfig(proxies));
    console.log('✅ 已生成 clash_sub.yaml');
}

main();
