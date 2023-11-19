import 'dotenv/config';

import fetch from 'node-fetch';
import sleepMs from './sleep';

/**
 * Grab an access token to use in future Spotify requests
 * @returns {string} An access token
 */
async function getAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
  params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);

  const spotifyTokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
    .then((response) => response.json());

  if (!spotifyTokenResponse.access_token) {
    throw new Error('Could not create a Spotify access token');
  }

  return spotifyTokenResponse.access_token;
}

/**
 * Gets an artist's profile URL
 * @param {string} artist an artist's name
 * @param {string} token an API token to call Spotify with
 * @returns {string} A URL to the artist's profile
 */
async function getArtistProfilePageUrl(artist, token) {
  const data = await fetch(`https://api.spotify.com/v1/search?q=${artist}&type=artist&market=GB&limit=1`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .catch((err) => {
      console.log(artist);
      console.log(err);
      console.log('there was an error');
    });

  if (!data
    || data.error
    || !data.artists
    || !data.artists.items
    || data.artists.items.length !== 1
    || !data.artists.items[0].external_urls
    || !data.artists.items[0].external_urls.spotify
  ) {
    console.error('***** Failed to get a profile page for', artist);
    return '';
  }

  return data.artists.items[0].external_urls.spotify;
}

/**
 * Gets a bunch of artist profile page URLs using batching to get around Spotify rate limits
 * @param {Array<string>} artistNames an array of artist names
 * @param {string} token an API token to call Spotify with
 * @returns {object} a map of name to profile URL
 */
async function getArtistProfilePageUrls(artistNames, token) {
  const LIMIT_PER_SECOND = 30;
  const WAIT_BETWEEN_CALL = 1000 / LIMIT_PER_SECOND;

  return artistNames.reduce(async (acc, name) => {
    const localAcc = await acc;
    const url = await getArtistProfilePageUrl(name, token);

    localAcc[name] = url;

    await sleepMs(WAIT_BETWEEN_CALL);

    return localAcc;
  }, Promise.resolve({}));
}

export { getAccessToken, getArtistProfilePageUrls };
