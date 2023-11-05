import { getAccessToken, getArtistProfilePageUrls } from '../utils/spotify';

/**
 * Transforms the basic results with a profile URL for each artist
 * @param {Array<object>} data Looks like [{date, events: [{artist, venue}]}]
 * @returns {Array<object>} Looks like [{date, events: [{artist, venue, profile}]}]
 */
async function transformResults(data) {
  const token = await getAccessToken();

  const dataWithSpotifyProfileUrls = await data.reduce(async (acc, entry) => {
    const localAcc = await acc;

    const artistsForEntry = entry.events.map((item) => item.artist);

    const artistProfileMapping = await getArtistProfilePageUrls(artistsForEntry, token);

    const newEventsData = entry.events.map((item) => ({
      ...item,
      profile: artistProfileMapping[item.artist],
    }));

    localAcc.push({
      ...entry,
      events: newEventsData,
    });

    return localAcc;
  }, Promise.resolve([]));

  return dataWithSpotifyProfileUrls;
}

export default transformResults;
