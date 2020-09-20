import optionsStorage from './storage';
import { verifyKey } from '../api.js';

optionsStorage.syncForm('#options-form');

const verifyButton = document.querySelector('#verify');
const verifyResult = document.querySelector('#verifyResult');

verifyButton.onclick = async (e) => {
	e.preventDefault();
	const currentKey = (await optionsStorage.getAll()).uploadKey;
	const exists = await verifyKey(currentKey);
	verifyResult.innerText = exists ? 'valid' : 'invalid';
}
