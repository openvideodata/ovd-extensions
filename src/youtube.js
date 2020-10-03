import jp from 'jsonpath';

import { upload } from './api.js';
import { isEnabled } from './util.js';

log('loaded youtube.js');

(async () => {
  if (!(await isEnabled())) {
    log('anonymous data collection disabled, exiting');
    return;
  }
	try {
		injectXhrProxy();
		for (;;) {
			let initialData = window.wrappedJSObject.ytInitialData;
      // sanitize xray
      initialData = JSON.parse(JSON.stringify(initialData));
			if (initialData) {
				log('initialData:', initialData);
        extractAllAndUpload(initialData);
				return;
			}
			await sleep(100);
		}
	} catch (err) {
		log('err:', err);
	}
})()

function injectXhrProxy() {
	const realOpen = XMLHttpRequest.prototype.open;
	const fakeOpen = function() {
		const url = arguments[1];
		log('intercepting', url);
		if (url.startsWith('https://www.youtube.com/watch')) {
			log('proxying watch xhr', url);
			this.addEventListener('load', () => {
				log('loaded watch xhr', url, this.responseText.length);
				const parsed = JSON.parse(this.responseText)
          .map(item => item.response)
          .filter(item => item !== undefined);
				log('watch xhr:', parsed);
        extractAllAndUpload(parsed);
			});
		}
		realOpen.apply(this, arguments);
	};
	exportFunction(fakeOpen, 
		window.wrappedJSObject.XMLHttpRequest.prototype, 
		{ defineAs: 'open' });
	log('exported');
}

async function extractAllAndUpload(data) {
  const extractors = {
    '$..videoRenderer': extractVideoRenderer,
    '$..compactVideoRenderer': extractVideoRenderer,
  };
  const results = [];
  for (const [query, extractor] of Object.entries(extractors)) {
    jp.query(data, query).forEach(item => {
      try {
        results.push(extractor(item));
      } catch (err) {
        log('extraction err:', err);
      }
    })
  }
  await upload('yt', results);
  try {
    let { numUploads } = await browser.storage.local.get('numUploads');
    await browser.storage.local.set({ numUploads: (numUploads || 0) + results.length });
  } catch (e) {
    log('err:', e);
  }
}

function extractVideoRenderer(vr) {
  log('extracting from', vr);
  const videoId = vr.videoId;
  const title = extractText(vr.title);
  let channelId = vr.channelId;

  const channelLinks = jp.query(vr, 
    '$..runs[?(@.navigationEndpoint.commandMetadata.webCommandMetadata.webPageType=="WEB_PAGE_TYPE_CHANNEL")]');
  // todo: can get different urls?
  const channelLink = channelLinks[0];
  const channelUrl = channelLink.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
  const channelTitle = channelLink.text;

  const viewCount = extractViewCount(vr.viewCountText);
  const descriptionSnippet = extractText(vr.descriptionSnippet);
  return {
    videoId,
    title,
    channelId,
    channelUrl,
    channelTitle,
    viewCount,
    descriptionSnippet,
  };
}

function extractViewCount(s) {
  return parseInt(extractText(s).split(' ')[0].replace(/,/g, ''));
}

function extractText(item) {
  if (!item) return null;
  if (item.simpleText) {
    return item.simpleText;
  }
  if (item.runs) {
    return item.runs[0].text;
  }
  return null;
}

function log() {
	const prefix = ['%cOpenVideoData:', 'background: green; color: white;'];
	console.log.apply(null, prefix.concat(Array.from(arguments)));
}