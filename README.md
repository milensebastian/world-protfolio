# Portfolio World

Milen Sebastian’s interactive portfolio, built with React, TypeScript, Vite and Three.js. The landing page opens the district atlas. The field journal gives visitors direct access to the portfolio, and `/world` opens the playable town.

## Run locally

Use Node.js 20.19 or later.

```sh
npm ci
npm run dev
```

For a production build and local preview, run `npm run build` and `npm run preview`.

## Deploy on Vercel

Import this directory as a Vite project. Use `npm run build` for the build command and `dist` for the output directory. The included Vercel rewrite supports direct navigation to `/world`. This project runs entirely in the browser.

To retain a separate portfolio on milen.vercel.app, deploy this project on its own hostname first and link the existing portfolio’s world entrance to that deployment. Mapping the existing domain’s `/world` path to another deployment requires changes in the existing site's routing and asset paths.
