import OptionsSync from 'webext-options-sync';

export default new OptionsSync({
	defaults: {
    uploadKey: '',
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	],
	logging: true
});
