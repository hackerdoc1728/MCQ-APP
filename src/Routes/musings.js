// src/routes/musings.js
/* eslint-disable */
import { createBlogSectionRoutes } from './blogSectionFactory.js';

export function registerMusingsRoutes(app, publicDir) {
    const register = createBlogSectionRoutes({
        sectionKey: 'musings',
        basePath: '/musings',
        dirName: 'musings',
        templateName: 'index-musings',
        sectionTitle: 'Musings',
        sectionSubtitle: 'Thoughts, essays, and reflections beyond neurology',
        defaultImage: '/assets/images/musings-default.webp',
    });

    // IMPORTANT: forward publicDir here
    register(app, publicDir);
}
