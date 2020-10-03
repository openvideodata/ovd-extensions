import optionsStorage from './storage';

function isDev() {
	return process.env.NODE_ENV === 'development';
}

const API_BASE_URL = isDev() 
	? 'http://fake.localhost:8000'
	: 'https://openvideodata.org';
const API_URL = API_BASE_URL + '/api/v1';

export async function verifyKey(key) {
	try {
		console.log('fetching:', key);
		const resp = await fetch(API_URL+'/verifyKey/'+key);
		return (await resp.json()).exists;
	} catch (err) {
		console.error('fetch err:', err);
	}
}

export async function upload(site, videos) {
  const uploadKey = (await optionsStorage.getAll()).uploadKey;
  const data = {
    uploadKey,
    site,
    videos,
  };
  console.log('UPLOADING', data);
  const resp = await fetch(API_URL+'/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  console.log('api resp:', resp);
}