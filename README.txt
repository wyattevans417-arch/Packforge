PackForge v4.4.22 LOW-CDN / LOW-LAG build

Runtime network layout on a cold first visit:
1. index.html
2. exact working primary CSS
3. ONE streamed code-pack containing 13 execution chunks
4. tiny service worker (registered after game startup)

The code pack is one network response, but the browser executes it as 13 smaller strict chunks and yields an animation frame between chunks. This avoids the giant one-script initialization freeze without turning every chunk into a Vercel request.

All responses use aggressive one-year browser caching. CacheStorage + the service worker make normal repeat launches cache-first. No Functions, middleware, APIs, DB, analytics, remote images, or remote fonts.

IMPORTANT: This is intentionally aggressive caching. After deploying a NEW version, existing users may need one hard refresh (Ctrl+Shift+R) to force the new deployment.
