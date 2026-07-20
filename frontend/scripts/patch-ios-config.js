#!/usr/bin/env node
// Patches the iOS-bundled capacitor.config.json to include local (in-app-target)
// Capacitor plugins that aren't npm packages and therefore aren't auto-added by cap sync.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, '../ios/App/App/capacitor.config.json');

if (!existsSync(configPath)) {
  console.log('patch-ios-config: config not found, skipping');
  process.exit(0);
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const LOCAL_PLUGINS = ['HealthKitPlugin'];

config.packageClassList = [
  ...new Set([...(config.packageClassList || []), ...LOCAL_PLUGINS]),
];

writeFileSync(configPath, JSON.stringify(config, null, '\t') + '\n');
console.log('patch-ios-config: packageClassList =', config.packageClassList);
