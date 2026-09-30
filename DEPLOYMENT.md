# Publish AchieveGo on Vercel or GitHub Pages

The prototype is a static website, including the local evidence chatbot. Its scripts, evidence, and styles are bundled into the page. No backend, paid AI service, API key, or runtime WWC connection is required. The AI-connected bot and selected-user authentication will be added with Supabase later; this release does not enforce educator login.

## Vercel — recommended for the current demo

1. Put the whole AchieveGo project in a GitHub repository and set Vercel Root Directory to `prototype`. Alternatively, publish a prototype-only repository using the contents of `prototype/` or the extracted `achievego-website/` source package; for those layouts, leave Root Directory at the repository root.
2. In Vercel, choose **Add New → Project**, import that repository, and choose **Other** as the framework preset. If the app is nested in a larger repository, set **Root Directory** to `prototype`; if it is standalone, keep the repository root.
3. The included `vercel.json` sets **Build Command** to `python3 scripts/check.py`, **Output Directory** to `_site`, and skips dependency installation. Keep a supported Node runtime for the JavaScript checks. No environment variables or API keys are needed.
4. Deploy. Vercel will show the resulting URL. Git-connected changes can then create deployments through Vercel's normal workflow.

The build validates the library, generates the chat index, runs checks, and publishes only the static page and curated CSVs. Source files, the raw WWC archive, system-prompt source, and future backend configuration are outside `_site/`. The prompt is not a secret, but it belongs with the future backend source rather than a browser-side provider request.

For the whole AchieveGo repository, the root `.github/workflows/pages.yml` runs checks from `prototype/` and uploads `prototype/_site/`. The workflow inside `prototype/.github/` is retained for the prototype-only source package; GitHub does not discover nested workflows. Both workflow variants run checks; GitHub Pages deployment is opt-in through `ENABLE_GITHUB_PAGES=true`, so a Vercel-only repository does not try to publish to unconfigured Pages.

This setup follows Vercel's [build configuration](https://vercel.com/docs/builds/configure-a-build), [static configuration](https://vercel.com/docs/project-configuration/vercel-json), and [build image documentation](https://vercel.com/docs/builds/build-image). The build commands have been exercised locally. No Vercel project or remote deployment has been created in this workspace.

## Fastest: upload the finished website

1. Unzip `release/achievego-static-site.zip`. Create a GitHub repository, for example `achievego`. A public repository can use GitHub Pages on GitHub Free; private repositories require a plan supporting Pages.
2. Upload the **extracted contents** to the repository's `main` branch: `index.html` and the `data` folder at the repository root. Include `.nojekyll` if your uploader shows hidden files. Do not upload the ZIP as the website or leave `index.html` inside an extra folder.
3. Open **Settings → Pages → Build and deployment**. Select **Deploy from a branch**, then **main** and **/(root)**. Save.
4. After the Pages deployment finishes, GitHub displays the site URL in Settings → Pages, normally `https://YOUR-USERNAME.github.io/achievego/`.

This publishes the working demo, including interactive scenarios, search, evidence details, and plan export. To update it, rebuild and replace the published files. The default scenario is fictional and clearly marked as such.

## Recommended for ongoing development: automatic checked deployments

1. Unzip `release/achievego-github-repository.zip` into a separate development directory. Use the **contents of `achievego-website/` as the repository root**. Alternatively, use this `prototype` directory as the root of a new repository. Its parent research directory is not part of the website repository.
2. Commit those files to a GitHub repository on branch **main**, including `.github/workflows/pages.yml`. GitHub Desktop or Git can include the hidden `.github` directory. The folder contains only the prototype, fictional scenarios, aggregate profile summaries, and public WWC evidence; the surrounding study data and manuscripts are not packaged.
3. In **Settings → Pages**, choose **GitHub Actions** as the source. GitHub Actions must be enabled for the repository. Under **Settings → Secrets and variables → Actions → Variables**, add the repository variable `ENABLE_GITHUB_PAGES` with value `true`. This is a public switch, not a secret.
4. Open **Actions → Check and deploy AchieveGo → Run workflow**, choosing `main`. Subsequent pushes to `main` build, test, and deploy automatically. If the initial push ran before Pages was enabled, rerun the workflow after setting the source.
5. Open the URL shown by the `deploy` job or Settings → Pages.

The workflow installs Python 3.12 and Node 24, builds the page, and runs the evidence-integrity, matching, export, and static-site checks. It uploads **only `_site/`**, containing the page, three curated CSVs, and `.nojekyll`. The public WWC ZIP and source/testing files remain outside the website artifact. Pull requests run checks without deploying. No personal access token or repository secret is required for the supplied workflow; it uses GitHub's built-in deployment token permissions.

If your default branch has another name, change both `branches: [main]` entries and both `refs/heads/main` deployment guards in the workflow, or rename the branch to `main`. The full AchieveGo project already includes an adapted workflow at its root `.github/workflows/`, with `working-directory: prototype` for the build step and `prototype/_site` for the artifact. Keep this root workflow and the prototype-only packaging workflow aligned when changing CI behavior. Other enclosing repository layouts require equivalent path adjustments.

## Build and preview locally

From the `prototype/` directory, or from the repository root when using the prototype-only package:

```sh
python3 scripts/check.py
python3 -m http.server 8000 --directory _site
```

Open `http://localhost:8000`. Stop the preview with Ctrl+C. You can also open `index.html` directly. The app uses relative links and no client-side routing, so it works at a GitHub project URL such as `/achievego/` as well as a domain root.

To regenerate both upload ZIPs:

```sh
python3 scripts/package_release.py
```

Python needs only its standard library. The JavaScript checks require Node or macOS JavaScriptCore. No npm packages are required.

## Deployment status and troubleshooting

The local build and interaction checks have passed. **No GitHub repository has been created or pushed by this work, and no live deployment has been performed.** Account settings and the actual GitHub Actions run still need to be exercised in your repository.

- **404:** check that Pages is enabled, a deployment completed, and `index.html` is at the published root. Use the URL GitHub displays, including the repository path.
- **Workflow absent:** `.github/workflows/pages.yml` must be at the repository root, not inside a nested `prototype` folder.
- **Pages configuration error:** choose GitHub Actions as the publishing source before rerunning the workflow. Account/organization rules may also restrict Pages or Actions.
- **Changes do not appear:** edit `src/` or `data/library.json`, rebuild, and check the most recent deployment. The generated `index.html` is not the source for automatic deployments.

The setup follows GitHub's official instructions for [branch publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), checked September 13, 2026.

The research database is regenerated locally during builds under `data/generated/`. It is excluded from the website and source ZIP; the packaged catalog, scripts, and WWC snapshot recreate it. The third website CSV is `data/research_findings.csv`.
