import optionsStorage from './storage';

export async function isEnabled() {
	const opts = await optionsStorage.getAll();
	console.log('options:', opts);
	return opts.enable;
}
