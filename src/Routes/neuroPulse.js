// src/routes/neuroPulse.js
/* eslint-disable */
import { createBlogSectionRoutes } from './blogSectionFactory.js';

export function registerNeuroPulseRoutes(app, publicDir) {
    const register = createBlogSectionRoutes({
        sectionKey: 'neuroPulse',
        basePath: '/neuroPulse',
        dirName: 'neuroPulse',
        templateName: 'index-np',
        sectionTitle: 'NeuroPulse',
        sectionSubtitle: 'Latest updates and neuro trends',
        defaultImage: '/assets/images/neuroPulse-default.webp',
    });

    register(app, publicDir);
}
