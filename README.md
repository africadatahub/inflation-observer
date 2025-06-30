# Africa Data Hub Inflation Observer
The Africa Data Hub Inflation Observer is designed to provide journalists, researchers, and civil society organizations with access to up-to-date information on inflation indicators in their respective countries while enabling comparisons with neighboring nations. This application is built with React.js and sources data from the IMF, various national agencies, and the Africa Data Hub.

## Local development

To set up the application for local development, follow these steps:

1. Install the required dependencies by running the following command within your project folder:

    ```
    yarn
    ```
2. You will need a valid CKAN API key. Add a .env file in the project root with the following content:

    ```
    REACT_API_KEY=<provided-key-here>
    ```
3. Start the local development server with the following command:
    ```
    yarn dev
    ```

# Deployment steps
To deploy the application, follow these steps:

1. Create a pull request (PR) to merge source (src) changes into the iframe branch.
2. Confirm that the changes work in the iframe branch by running `yarn dev`.
3. If needed, delete the `.parcel_cache` folder.
4. Once the changes are verified to be working, stop the development server.
5. Delete the contents of the `dist` folder.
6. Delete the `.parcel_cache` just in case.
7. Run `yarn build`.
8. Note the added class from the script output, for example, "unique-12xfxf."
9. If you want to push to the development environment (i.e., africadata.webflow.io), rename or copy the CSS and JS files to "inflation-observer.dev.css" and "inflation-observer.dev.js." Otherwise, rename or copy them to "inflation-observer.css" and "inflation-observer.js" to update the GitHub Pages.

# Links
1. [Staging Link](https://africadatahub.webflow.io/)
2. [Production Link](https://www.africadatahub.org/)
