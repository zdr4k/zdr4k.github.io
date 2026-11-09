# Kelvin Santos · Security Engineering Portfolio

Minimal, responsive portfolio built with **Astro**, deployed to **GitHub Pages**, and editable with **Pages CMS**.

## Publish (one-time setup)

1. Upload this project's **contents** (not the containing folder) to the root of your `zdr4k.github.io` GitHub repository, on `main`.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Open the **Actions** tab and check that **Deploy portfolio to GitHub Pages** succeeds.
4. Visit https://zdr4k.github.io/ after deployment.

## Editing content without code

1. Open https://app.pagescms.org/ and sign in with GitHub.
2. Authorize the Pages CMS GitHub app for repository `zdr4k/zdr4k.github.io`.
3. Choose the repository and `main` branch.
4. Edit **Homepage**, add a **Project**, or add a **Research & Writing** entry.
5. Save. Pages CMS commits the changes; GitHub Actions automatically rebuilds and republishes.

The content is stored in `src/data/site.json`, `src/data/projects/*.json`, and `src/data/articles/*.json`. The CMS does not provide drag-and-drop layout editing. Changing the actual site design still requires code.

**Ordering:** Project and article entries display in filename order; prefix files with `01-`, `02-`, etc. New items may be ordered after existing items. On the homepage, only projects with `featured: true` display.

## Develop locally (optional)

Install Node.js 20.19+ or 22+, run `npm install`, then `npm run dev`.
For a production build, run `npm run build`.

## Notes

- Site uses Astro with simple, self-contained CSS, no paid dependencies or server.
- Project and article descriptions are initial examples: review details before publishing.
- `site.brand` is `kelvin.dev` as a design label; it does **not** mean you own that domain.
- Pages CMS requires GitHub authorization to make commits to the repository.
# zdr4k.github.io
