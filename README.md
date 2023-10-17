# ADH Covid Observer

## Local development

Install dependencies by running yarn in the folder:

```
yarn
```
You will need a valid CKAN API key.

Add a `.env` file in the project route with:

```
REACT_API_KEY=<provided-key-here>
```

Then start the local development server with:
```
yarn dev
```

# Deployment steps

1. PR src changes to iframe Branch
2. Confirm they are working in iframe branch with yarn dev
3. Delete .parcel_cache if need be
4. When working. Quit dev server.
5. Delete contents of dist folder.
6. Delete .parcel_cache just in case
7. yarn build
8. Note the added class fro the script output. ie. unique-12xfxf
9.
If you are wanting to push to DEV (ie. africadata.webflow.io)
Rename or copy css and js files to inflation-observer.dev.css and inflation-observer.dev.js
else
Rename or copy css and js files to inflation-observer.css and inflation-observer.js
This will update the github pages.