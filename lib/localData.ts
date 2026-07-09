import type { HeroStats } from './types';

export const localHeroes: HeroStats[] = [
  { id: 1, name: 'Pudge', winrate: '52.4%', winrateNum: 52.4, pickrate: 250000, roles: ['Durable', 'Disabler'], image: '', attack_type: 'Melee' },
  { id: 2, name: 'Anti-Mage', winrate: '48.9%', winrateNum: 48.9, pickrate: 125000, roles: ['Carry', 'Escape'], image: '', attack_type: 'Melee' },
  { id: 3, name: 'Juggernaut', winrate: '51.7%', winrateNum: 51.7, pickrate: 182000, roles: ['Carry', 'Pusher'], image: '', attack_type: 'Melee' },
  { id: 4, name: 'Crystal Maiden', winrate: '50.1%', winrateNum: 50.1, pickrate: 142000, roles: ['Support', 'Disabler'], image: '', attack_type: 'Ranged' },
  { id: 5, name: 'Shadow Fiend', winrate: '50.2%', winrateNum: 50.2, pickrate: 158000, roles: ['Carry', 'Nuker'], image: '', attack_type: 'Ranged' },
  { id: 6, name: 'Phantom Assassin', winrate: '49.5%', winrateNum: 49.5, pickrate: 164000, roles: ['Carry', 'Escape'], image: '', attack_type: 'Melee' },
  { id: 7, name: 'Invoker', winrate: '48.2%', winrateNum: 48.2, pickrate: 139000, roles: ['Nuker', 'Disabler'], image: '', attack_type: 'Ranged' },
  { id: 8, name: 'Slark', winrate: '51.0%', winrateNum: 51.0, pickrate: 117000, roles: ['Carry', 'Escape'], image: '', attack_type: 'Melee' },
];