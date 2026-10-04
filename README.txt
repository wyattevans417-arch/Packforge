PackForge v4.4.22 MAX-OPT Vercel build

Goal: identical gameplay/UI with minimum Vercel usage and Chromebook-friendly rendering.

Cold visit: exactly 3 game files: index.html + one CSS + one code-pack.
Within the 1-hour browser cache window: refreshes can use 0 network requests.
After that: normally only index.html revalidates; CSS/code-pack are immutable for 1 year.
No APIs, functions, middleware, analytics, remote fonts, remote images, or runtime network calls.

Performance changes are rendering/packaging only: CSS/HTML are compacted, off-screen repeated cards use Chrome content-visibility, and the existing 13-stage engine loader remains intact so initialization yields between chunks. Shop-fast persistent DOM behavior is retained.

After replacing an older deployment, use Ctrl+Shift+R once if an old cached build appears.
