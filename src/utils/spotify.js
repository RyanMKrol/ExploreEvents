import 'dotenv/config';

import fetch from 'node-fetch';

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

export default getAccessToken;
