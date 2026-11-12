# PocketPass

A responsive website that reads an existing QR image locally, previews a personalized pass, downloads a QR PNG, and requests a signed Apple Wallet `.pkpass` when the signing server is configured.

## Current capabilities

- PNG/JPEG/WebP QR decoding in the browser, or exact QR text input.
- Fuel, membership and general QR passes with four colors.
- No database, accounts, image uploads, analytics or browser storage. Pass details exist only in the current tab.
- Optional Node signing server. Only QR content and pass details are sent when a visitor requests a signed pass. The application does not persist or log them; hosting providers may retain request metadata. Fonts are fetched from Google Fonts.
- Clear setup notice when signing is unavailable. Downloading a QR image does not add a Wallet pass.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

The frontend runs at the address Vite prints. To run the optional signing server, use another terminal:

```sh
npm start
```

For a single production server, run `npm run build` and then `npm start`. Test with `npm test`.

## Publish the frontend on GitHub Pages

1. Create a repository named `pocketpass`, then push these files to its `main` branch. Never include `.env`, certificates, private keys, user QR images or documents.
2. In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Run the **Publish PocketPass** workflow (or push to `main`). It tests, builds and deploys the `dist` directory.
4. GitHub shows the actual deployed URL in the Pages settings and workflow. A repository named `pocketpass` owned by `aaidh` normally uses `https://aaidh.github.io/pocketpass/`.

GitHub Pages serves the frontend. It cannot run the signing server. Without a signing server, QR upload, preview and PNG download still work.

## Enable Apple Wallet

You need an Apple Developer account able to issue Wallet passes. Do not send private keys through chat or upload them to GitHub.

1. In Apple's developer portal, register a **Pass Type ID** (for example `pass.com.yourcompany.pocketpass`). Create a Pass Type ID certificate using a certificate signing request whose private key you retain.
2. Obtain the matching signer certificate, its private key, and the current matching Apple Worldwide Developer Relations intermediate certificate in PEM format. Follow Apple's certificate documentation; the intermediate must match the issuer of your pass certificate.
3. Copy `.env.example` to `.env` locally. Set your real pass identifier, Apple team identifier, certificate file paths, organization and optional private-key passphrase. Put files in the ignored `certs` directory or use your host's private file-secret storage.
4. Deploy this Node application to a Node-capable HTTPS host. Build command: `npm ci && npm run build`; start command: `npm start`. Set environment variables and certificate files through that host's private settings. Node 22+ is required. Hosting registration, pricing and production certificate management remain your responsibility.
5. When frontend and API are hosted together, leave `VITE_API_URL` empty and set `ALLOWED_ORIGIN` to your website's HTTPS origin. For GitHub Pages, set `ALLOWED_ORIGIN=https://aaidh.github.io` on the server, and set the GitHub Actions repository variable `VITE_API_URL` to your API's HTTPS origin. Rebuild the frontend after changing this variable.
6. Verify `/api/status` returns `walletReady: true`, then create a pass in Safari on a real iPhone and open the downloaded `.pkpass`. Validate scanning with the original issuer's scanner before relying on it.

The server rate-limits pass requests to 10 per minute per IP in each process. For multiple instances or a reverse proxy, configure trusted proxy hops and a shared limiter appropriate to the host; do not blindly trust client-supplied forwarding headers. Use host-level request limits and monitoring before a large public rollout. CORS is a browser boundary, not authentication. The API intentionally allows visitors to issue personal QR passes under your pass identity; review this issuance model before activating your certificate for public use.

## What the side button can do

On supported iPhones with Wallet and the double-click option enabled, double-clicking the side button opens Wallet. The visitor may need to select their QR pass. This website cannot intercept the button or force its pass to appear first. Apple controls eligibility and the final pass layout. A pass does not require a native iPhone app.

This does not provision payment cards, issue official IDs, store documents, verify fuel entitlement, or refresh expiring/dynamic QR codes. Fuel-system acceptance is determined by its issuer. Keep the original available. Only convert codes you own or have permission to use.

## Verification limits

Automated tests cover payload preservation, input validation, missing signing configuration and API behavior. Actual signed pass creation, installation, side-button access and fuel-scanner acceptance require your Apple credentials and a real device; these must be tested after configuration.

## References

- [Apple Wallet getting started](https://developer.apple.com/wallet/get-started/)
- [Create Wallet identifiers and certificates](https://developer.apple.com/help/account/capabilities/create-wallet-identifiers-and-certificates)
- [Wallet settings on iPhone](https://support.apple.com/en-euro/guide/iphone/iphf8b1fc01e/ios)
- [GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [passkit-generator](https://github.com/alexandercerutti/passkit-generator)
