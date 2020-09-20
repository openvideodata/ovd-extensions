import { upload } from './api.js';

log('loaded youtube.js');

(async () => {
	try {
		injectXhrProxy();
		for (;;) {
			let initialData = window.wrappedJSObject.ytInitialData;
      // sanitize xray
      initialData = JSON.parse(JSON.stringify(initialData));
			if (initialData) {
				log('initialData:', initialData);
				extractYoutubeResponse(initialData);
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
		log('fakeopening', url);
		if (url.startsWith('https://www.youtube.com/watch')) {
			log('proxying watch xhr', url);
			this.addEventListener('load', () => {
				log('loaded watch xhr', url, this.responseText.length);
				const parsed = JSON.parse(this.responseText);
				log('watch xhr:', parsed);
				parsed.forEach(item => {
					if (item.response) {
						log('resp:', item.response);
						// extractYoutubeResponse(item.response);
					}
				});
			});
		}
		realOpen.apply(this, arguments);
	};
	exportFunction(fakeOpen, 
		window.wrappedJSObject.XMLHttpRequest.prototype, 
		{ defineAs: 'open' });
	log('exported');
}

async function extractYoutubeResponse(resp) {
  const videoId = resp.currentVideoEndpoint.watchEndpoint.videoId;
  const vidInfos = [];

  const videoInfoRenderers = resp.contents.twoColumnWatchNextResults.results.results.contents;
  const currentVideoInfo = extractVideoInfoRenderer(videoId, videoInfoRenderers);
  log('currentVideoInfo:', currentVideoInfo);
  vidInfos.push(currentVideoInfo);

  const sidebarContents = resp.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results; 
  log('sidebarContents:', sidebarContents);
  sidebarContents.forEach(c => {
    let cvr = null;
    if (c.compactVideoRenderer) {
      cvr = c.compactVideoRenderer;
    } else if (c.compactAutoplayRenderer) {
      cvr = c.compactAutoplayRenderer.contents[0].compactVideoRenderer;
    }
    if (cvr) {
      try {
        vidInfos.push(extractCompactVideoRenderer(cvr));
      } catch (e) {
        log('err:', e);
      }
    }
  });

  log('vidInfos:', vidInfos);
  upload('yt', vidInfos);
}

function extractVideoInfoRenderer(videoId, rens) {
  const primaryInfo = rens[0].videoPrimaryInfoRenderer;
  const secondInfo = rens[1].videoSecondaryInfoRenderer;
  const ownerRen = secondInfo.owner.videoOwnerRenderer;
  const ownerChannelUrl = ownerRen.title.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url;
  return {
    videoId,
    title: primaryInfo.title.runs[0].text,
    channelId: ownerChannelUrl.split('/')[2],
    channelTitle: ownerRen.title.runs[0].text,
    viewCount: parseViewCountText(primaryInfo.viewCount.videoViewCountRenderer.viewCount.simpleText),
    desc: secondInfo.description.runs[0].text,
    uploadDate: new Date(primaryInfo.dateText.simpleText),
  };
}

function extractCompactVideoRenderer(ren) {
  return {
    videoId: ren.videoId,
    title: ren.title.simpleText,
    channelId: ren.channelId,
    channelTitle: ren.longBylineText.runs[0].text,
    viewCount: parseViewCountText(ren.viewCountText.simpleText),
  };
}

function parseViewCountText(s) {
  return parseInt(s.split(' ')[0].replace(/,/g, ''));
}

function log() {
	const prefix = ['%cOpenVideoData:', 'background: green; color: white;'];
	console.log.apply(null, prefix.concat(Array.from(arguments)));
}