// Starts the local PlantUML renderer that `bun dev` expects at http://localhost:8081
// (the renderer's default — see app/util/plantumlRenderer.ts), so diagrams draw without
// a manual `docker compose up -d plantuml` first.
//
// Deliberately never falls back to www.plantuml.com: the diagram source is deflate+base64
// encoded into the request URL, so a public server would receive every diagram verbatim.
// If no local renderer can be started we warn and let dev run without diagrams instead.

import {spawn} from 'node:child_process'

const SERVER = process.env.VITE_PLANTUML_SERVER ?? 'http://localhost:8081'
// Encoded "A -> B": proves the server can actually draw, not merely accept connections.
const PROBE = `${SERVER}/svg/SoWkIImgAStDuN9KqBLJSE9oICrB0N81`

const warn = (msg) => console.warn(`[plantuml] ${msg}`)

async function isReady() {
    try {
        const res = await fetch(PROBE, {signal: AbortSignal.timeout(2000)})
        return res.ok
    } catch {
        return false
    }
}

function run(cmd, args) {
    return new Promise((resolve) => {
        const child = spawn(cmd, args, {stdio: 'inherit'})
        child.on('error', () => resolve(false))
        child.on('close', (code) => resolve(code === 0))
    })
}

async function waitForReady(attempts) {
    for (let i = 0; i < attempts; i++) {
        if (await isReady()) return true
        await new Promise((r) => setTimeout(r, 2000))
    }
    return false
}

// A non-absolute URL (the Docker image's /plantuml) is proxied by nginx at runtime and
// has nothing to start here.
if (!/^https?:\/\//i.test(SERVER)) {
    process.exit(0)
}

if (await isReady()) {
    console.log(`[plantuml] renderer already running at ${SERVER}`)
    process.exit(0)
}

console.log('[plantuml] starting local renderer (docker compose up -d plantuml)…')

if (!await run('docker', ['compose', 'up', '-d', 'plantuml'])) {
    warn('could not start the renderer with Docker Compose.')
    warn('Diagrams will show a render error until one is listening at ' + SERVER + '.')
    warn('Start Docker, or run your own PlantUML server and set VITE_PLANTUML_SERVER.')
    process.exit(0)
}

if (await waitForReady(30)) {
    console.log(`[plantuml] renderer ready at ${SERVER}`)
} else {
    warn(`renderer started but never answered at ${SERVER}; diagrams may not draw.`)
}
