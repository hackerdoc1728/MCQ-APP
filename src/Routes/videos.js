// src/routes/videos.js
/* eslint-disable */
import axios from 'axios';
import { redisClient } from '../infra/redis.js';
import { logger } from '../infra/logger.js';

const youtubeApiKeys = process.env.YOUTUBE_API_KEYS
    ? process.env.YOUTUBE_API_KEYS.split(',').map((key) => key.trim())
    : [];

if (youtubeApiKeys.length === 0) {
    logger.error(
        'No YouTube API keys provided. Please set YOUTUBE_API_KEYS in your .env file.'
    );
    process.exit(1);
}

async function getNextYouTubeApiKey() {
    try {
        let usedIndex = await redisClient.incr('currentYouTubeApiKeyIndex');
        usedIndex = (usedIndex - 1) % youtubeApiKeys.length;
        if (usedIndex < 0) usedIndex = youtubeApiKeys.length - 1;
        const apiKey = youtubeApiKeys[usedIndex];
        return { apiKey, usedIndex };
    } catch (error) {
        logger.error('Error fetching next YouTube API key from Redis:', error);
        throw new Error('Internal server error while fetching API key.');
    }
}

export function registerVideoRoutes(app) {
    app.get('/api/videos', async (req, res) => {
        const { pageToken = '' } = req.query;
        const channelId = process.env.CHANNEL_ID;
        const maxResults = parseInt(process.env.MAX_RESULTS, 10) || 12;
        const apiUrl = 'https://www.googleapis.com/youtube/v3/search';
        const maxRetries = youtubeApiKeys.length;
        let attempt = 0;

        while (attempt < maxRetries) {
            let apiKey;
            let usedIndex;

            try {
                const keyData = await getNextYouTubeApiKey();
                apiKey = keyData.apiKey;
                usedIndex = keyData.usedIndex;
            } catch (error) {
                logger.error('Failed to retrieve YouTube API key:', error);
                return res
                    .status(500)
                    .json({ error: 'Internal server error while fetching API key.' });
            }

            const params = {
                key: apiKey,
                channelId,
                part: 'snippet,id',
                order: 'date',
                maxResults,
                pageToken,
            };

            logger.info(
                `Attempt ${attempt + 1}: Using YouTube API Key Index: ${usedIndex} for channel ID: ${channelId}`
            );

            try {
                const response = await axios.get(apiUrl, { params });
                return res.json(response.data);
            } catch (error) {
                logger.error(
                    `Attempt ${attempt + 1}: Error fetching YouTube videos with API Key Index ${usedIndex}: ${error.message}`
                );

                if (error.response && error.response.status === 403) {
                    attempt += 1;
                    logger.warn(
                        `API Key Index ${usedIndex} is invalid or quota-exhausted. Retrying with the next key...`
                    );
                    continue;
                } else if (error.response) {
                    return res
                        .status(error.response.status)
                        .json({ error: error.response.data.error.message });
                } else if (error.request) {
                    return res
                        .status(503)
                        .json({
                            error:
                                'YouTube API is unavailable. Please try again later.',
                        });
                } else {
                    return res
                        .status(500)
                        .json({ error: 'An unexpected error occurred.' });
                }
            }
        }

        logger.error(
            'All YouTube API keys are invalid or have exhausted their quotas.'
        );
        res.status(503).json({
            error: 'Service unavailable. Please try again later.',
        });
    });
}
