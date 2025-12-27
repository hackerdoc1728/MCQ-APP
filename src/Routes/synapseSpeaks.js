// src/routes/synapseSpeaks.js
/* eslint-disable */
import { createBlogSectionRoutes } from './blogSectionFactory.js';

export function registerSynapseSpeaksRoutes(app, publicDir) {
    const register = createBlogSectionRoutes({
        sectionKey: 'synapseSpeaks',
        basePath: '/synapse-speaks',
        dirName: 'synapse-speaks',
        templateName: 'index-ss',
        sectionTitle: 'Synapse Speaks',
        sectionSubtitle: 'Stories and perspectives from the world of neurology',
        defaultImage: '/assets/images/synapse-default.webp',
    });

    register(app, publicDir);
}
