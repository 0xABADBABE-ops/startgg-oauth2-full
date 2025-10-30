# Browser Demo

This example runs the Start.gg OAuth helpers in a plain browser application with no framework. It uses Vite for bundling and serves a single page that builds PKCE authorize URLs, displays the verifier/challenge pair, and exchanges the authorization code after Start.gg redirects back.

## Getting Started
```bash
cd examples/browser
npm install
npm run dev
```

The dev server opens at `http://localhost:5173`. Fill in your Start.gg OAuth client details and click **Generate Authorize URL**. Inspect the generated verifier/challenge values, open the authorize link in a new tab, and complete the Start.gg flow. When Start.gg redirects back, the page exchanges the code and prints a token summary.

## Production Build
```bash
npm run build
npm run preview
```

`npm run build` writes static assets to `dist/`, and `npm run preview` serves them locally.
