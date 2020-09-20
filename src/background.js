// eslint-disable-next-line import/no-unassigned-import
import './options/storage';
import { isDev } from './api.js';

console.log('loaded background.js');
console.log('isDev:', isDev());
