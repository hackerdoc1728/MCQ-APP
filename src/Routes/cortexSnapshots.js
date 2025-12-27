// src/routes/cortexSnapshots.js
/* eslint-disable */
import { createBlogSectionRoutes } from './blogSectionFactory.js';

export function registerCortexSnapshotsRoutes(app, publicDir) {
    const register = createBlogSectionRoutes({
        sectionKey: 'cortexSnapshots',
        basePath: '/cortex-snapshots',
        dirName: 'cortex-snapshots',
        templateName: 'index-cs',
        sectionTitle: 'Cortex Snapshots',
        sectionSubtitle: 'Quick neuro insights and pearls',
        defaultImage: '/assets/images/cortex-default.webp',
    });

    register(app, publicDir);
}
