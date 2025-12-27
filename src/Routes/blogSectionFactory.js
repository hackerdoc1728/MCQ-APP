// src/routes/blogSectionFactory.js
/* eslint-disable */
import path from 'path';
import fs from 'fs/promises';
import chokidar from 'chokidar';
import { JSDOM } from 'jsdom';

import { redisClient, PAGE_CACHE_TTL, deletePattern } from '../infra/redis.js';
import { logger } from '../infra/logger.js';
import { checkTemplateWhitelist } from '../middleware/checkWhitelist.js';

const POSTS_PER_PAGE = 6;
const FEATURED_POSTS_COUNT = 1;

// Generic meta extractor using <meta name="...">
function extractMetadata(htmlContent, defaultImage) {
    const document = new JSDOM(htmlContent).window.document;
    const metadata = {};
    const metaTags = document.querySelectorAll('meta');

    metaTags.forEach((tag) => {
        const name = tag.getAttribute('name');
        const content = tag.getAttribute('content');
        if (name && content) {
            metadata[name] = content;
        }
    });

    let parsedDate = new Date();
    if (metadata.date) {
        const date = new Date(metadata.date);
        if (!isNaN(date)) {
            parsedDate = date;
        } else {
            logger.warn(
                `Invalid date format found: "${metadata.date}". Defaulting to current date.`
            );
        }
    }

    return {
        date: parsedDate,
        title: metadata.title || 'Untitled',
        subtitle: metadata.subtitle || '',
        description: metadata.description || '',
        blogimage: metadata.blogimage || defaultImage,
    };
}

// Factory: returns a function that registers routes for a blog section
export function createBlogSectionRoutes({
    sectionKey,          // 'synapseSpeaks'
    basePath,            // '/synapse-speaks'
    dirName,             // 'synapse-speaks'
    templateName,        // 'index-ss'
    sectionTitle,        // 'Synapse Speaks'
    sectionSubtitle,     // 'Stories...'
    defaultImage = '/assets/images/synapse-default.webp',
}) {
    async function parseSectionFiles(sectionDir) {
        try {
            const files = (await fs.readdir(sectionDir)).filter((file) =>
                file.endsWith('.html')
            );
            logger.debug("SECTION DIR:", sectionDir);

            const parsedFiles = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(sectionDir, file);
                    const stats = await fs.stat(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    const metadata = extractMetadata(content, defaultImage);

                    const slug = path.basename(file, '.html');

                    let parsedDate = new Date(metadata.date);
                    if (isNaN(parsedDate)) {
                        logger.warn(
                            `Invalid date detected for ${sectionKey} file: ${file}. Using last modified date.`
                        );
                        parsedDate = stats.mtime;
                    }

return {
    slug,
    url: `${basePath}/${slug}`,
    filePath: `${basePath}/${slug}`,
    filename: file,
    lastModified: stats.mtime,

    // Spread metadata BEFORE overriding date
    ...metadata,

    // Ensure final date is a valid Date object
    date: parsedDate,
};



                })
            );

            parsedFiles.sort((a, b) => {
                if (b.date - a.date !== 0) return b.date - a.date;
                return b.lastModified - a.lastModified;
            });

            return parsedFiles;
        } catch (error) {
            logger.error(`Error parsing ${sectionKey} HTML files:`, error);
            return [];
        }
    }

    async function renderPage(app, sectionDir, page) {
        const cacheKey = `${sectionKey}:page:${page}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            logger.debug(`Serving ${basePath} page ${page} from cache`);
            return { cachedHtml: cached };
        }

        const allPosts = await parseSectionFiles(sectionDir);
       logger.debug(`TOTAL POSTS FOUND: ${allPosts.length}`);


        const totalPosts = allPosts.length;

        const firstPageContentCount = FEATURED_POSTS_COUNT + POSTS_PER_PAGE;
        const remainingPosts = totalPosts - firstPageContentCount;
        const additionalPages = Math.ceil(
            Math.max(0, remainingPosts) / POSTS_PER_PAGE
        );
        const totalPages = Math.max(1, 1 + Math.max(0, additionalPages));

        if (page > totalPages && totalPages > 0) {
            return { redirect: `${basePath}?page=${totalPages}` };
        }

let featured = null;
let posts = [];

if (page === 1) {
    const featuredPost = allPosts[0];

    featured = featuredPost
        ? {
              ...featuredPost,
              date: new Date(featuredPost.date),
              sectionTitle,
          }
        : null;

    posts = allPosts
        .slice(FEATURED_POSTS_COUNT, firstPageContentCount)
        .map((post) => ({
            ...post,
            date: new Date(post.date),
            sectionTitle,
        }));
} else {
    const startIndex =
        firstPageContentCount + (page - 2) * POSTS_PER_PAGE;

    posts = allPosts
        .slice(startIndex, startIndex + POSTS_PER_PAGE)
        .map((post) => ({
            ...post,
            date: new Date(post.date),
            sectionTitle,
        }));
}


        const templateData = {
            featured,
            posts,
            page,
            totalPages,
            timestamp: new Date().toISOString(),
            sectionTitle,
            sectionSubtitle,
        };
logger.debug("FEATURED POST:", featured);


        const html = await new Promise((resolve, reject) => {
            app.render(templateName, templateData, (err, rendered) => {
                if (err) return reject(err);
                resolve(rendered);
            });
        });

        await redisClient.set(cacheKey, html, { EX: PAGE_CACHE_TTL });

        return { html };
    }

    // This is the function you'll call in app.js
    return function registerSectionRoutes(app, publicDir) {
        const sectionDir = path.join(publicDir, dirName);

        // Listing route: /section
        app.get(basePath, async (req, res) => {
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);

            try {
                const { cachedHtml, html, redirect } = await renderPage(
                    app,
                    sectionDir,
                    page
                );

                if (redirect) return res.redirect(redirect);
                if (cachedHtml) return res.send(cachedHtml);

                res.send(html);
            } catch (err) {
                logger.error(`Failed to load ${sectionKey} content:`, err);
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: `Failed to load ${sectionTitle} content`,
                });
            }
        });

        // Legacy route: /section/foo.html → /section/foo
        app.get(`${basePath}/:slug.html`, (req, res) => {
            const slug = path.basename(req.params.slug);
            return res.redirect(301, `${basePath}/${encodeURIComponent(slug)}`);
        });

        // Slug route: /section/foo
        // 1) build templatePath = 'dirName/slug'
        // 2) run through checkTemplateWhitelist → validates + sanitizes
        // 3) use sanitizedTemplatePath to build final absolute file path
        app.get(
            `${basePath}/:slug`,
            (req, res, next) => {
                // Ex: 'synapse-speaks/some-post'
                req.params.templatePath = `${dirName}/${req.params.slug}`;
                next();
            },
            checkTemplateWhitelist,
            (req, res) => {
                try {
                    // Your middleware sets req.sanitizedTemplatePath
                    const relPath = `${req.sanitizedTemplatePath}.html`; // e.g. 'synapse-speaks/some-post.html'
                    const absolutePath = path.join(publicDir, relPath);

                    res.sendFile(absolutePath, (err) => {
                        if (err) {
                            if (err.code === 'ENOENT') {
                                return res.status(404).json({ error: 'File not found' });
                            }
                            logger.error(`${sectionKey} file serving error:`, err);
                            return res
                                .status(500)
                                .json({ error: 'Internal server error' });
                        }
                    });
                } catch (err) {
                    logger.error(`${sectionKey} file serving error:`, err);
                    res.status(500).json({ error: 'Internal server error' });
                }
            }
        );

        // Watcher: invalidate cache on HTML changes
        const watcher = chokidar.watch(sectionDir, {
            persistent: true,
            ignoreInitial: true,
            depth: 0,
            awaitWriteFinish: {
                stabilityThreshold: 200,
                pollInterval: 100,
            },
        });

        const invalidateCache = async () => {
            try {
                await deletePattern(`${sectionKey}:page:*`);
                logger.info(`All ${sectionKey} cached pages invalidated.`);
            } catch (err) {
                logger.error(`Error invalidating ${sectionKey} cache:`, err);
            }
        };

        const handleChange = async (filePath) => {
            if (path.extname(filePath) === '.html') {
                logger.info(
                    `${sectionKey} HTML file changed: ${filePath}. Invalidating Redis cache.`
                );
                await invalidateCache();
            }
        };

        watcher.on('add', handleChange);
        watcher.on('unlink', handleChange);
        watcher.on('change', handleChange);

        watcher.on('error', (error) => {
            logger.error(`${sectionKey} watcher error:`, error);
        });

        logger.info(`Watching for changes in ${sectionDir}`);
    };
}
