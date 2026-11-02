export default defineAppConfig({
    wikiName: 'SimpleWiki',

    // Source repository for the "Edit this page on GitHub" link under each article.
    // Set `repo` to '' to hide the link.
    github: {
        repo: 'Elevenapple/simplewiki',
        branch: 'main',
        // Folder inside the repo that holds the markdown, matching content.config.ts.
        contentDir: 'content',
    },
})
