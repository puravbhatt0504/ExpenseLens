const fs = require('fs');

async function main() {
  const res = await fetch('https://raw.githubusercontent.com/iconify/icon-sets/master/json/circum.json');
  const data = await res.json();

  const neededIcons = [
    'shopping-cart', 'apple', 'glass', 'power', 'mobile-1', 'monitor', 
    'temp-high', 'home', 'delivery-truck', 'read', 'hospital-1', 'face-smile',
    'calendar', 'bag-1', 'user', 'fork-knife', 'plane', 'shopping-tag',
    'receipt', 'play-1', 'credit-card-1', 'circle-more', 'heart', 'avocado'
  ];

  let dartContent = `// Generated file - circum icons
import 'package:flutter/material.dart';

const Map<String, String> circumIcons = {
`;

  for (const name of neededIcons) {
    if (data.icons[name]) {
      const body = data.icons[name].body;
      const width = data.width || 24;
      const height = data.height || 24;
      // build SVG string
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`;
      dartContent += `  'circum:${name}': '''${svg}''',\n`;
    } else {
      console.warn('Icon not found:', name);
    }
  }

  dartContent += `};
`;

  fs.mkdirSync('../app/lib/utils', { recursive: true });
  fs.writeFileSync('../app/lib/utils/circum_icons.dart', dartContent);
  console.log('Generated app/lib/utils/circum_icons.dart');
}

main().catch(console.error);
