// src/middleware/checkWhitelist.js
import path from 'path';
import config from '../../config/config.js';

const sanitizePath = (requestedPath) => {
    let clean = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');

    if (clean.includes('..')) throw new Error('Invalid path');

    return clean.replace(/^\/+/, ''); // remove leading /
};

// Reusable function
const checkWhitelistGeneric = (req, res, next, param, whitelist) => {
    try {
        const requestedPath = req.params[param];
        const sanitized = sanitizePath(requestedPath);

        // extract FIRST folder before any nesting
        const rootFolder = sanitized.split(path.sep)[0];

        if (!whitelist.includes(rootFolder)) {
            return res.status(403).send(`Access denied: ${rootFolder} is not allowed`);
        }

        req[param] = sanitized; // store sanitized path back to req
        next();

    } catch (e) {
        console.error("Whitelist validation blocked:", e.message);
        return res.status(400).send('Invalid or unsafe path');
    }
};

export const checkWhitelist = (req, res, next) =>
    checkWhitelistGeneric(req, res, next, 'filePath', config.whitelistedFolders);

export const checkStaticWhitelist = (req, res, next) =>
    checkWhitelistGeneric(req, res, next, 'filePath', config.whitelistedStaticFolders);

export const checkTemplateWhitelist = (req, res, next) =>
    checkWhitelistGeneric(req, res, next, 'templatePath', config.whitelistedTemplateFolders);
