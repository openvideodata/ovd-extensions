import OptionsSync from 'webext-options-sync';

export default new OptionsSync({
	defaults: {
    	uploadKey: '',
    	enable: true,
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	],
	logging: true
});
