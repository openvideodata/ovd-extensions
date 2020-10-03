import optionsStorage from '../storage';
import { verifyKey } from '../api.js';

optionsStorage.syncForm('#options-form');

const verifyButton = document.querySelector('#verify');
const verifyResult = document.querySelector('#verifyResult');
const donated = document.querySelector('#donated');

verifyButton.onclick = async (e) => {
	e.preventDefault();
	const currentKey = (await optionsStorage.getAll()).uploadKey;
	const exists = await verifyKey(currentKey);
	verifyResult.style.color = exists ? 'green' : 'red';
	verifyResult.style.fontWeight = 'bold';
	verifyResult.innerText = exists ? 'valid' : 'invalid';
}

(async () => {
	let { numUploads } = await browser.storage.local.get('numUploads');
	donated.innerText = numUploads || 0;
})();