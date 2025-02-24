# Tiptap templates

This repository provides UI templates for those looking to get a head start with the Tiptap Editor in a React environment… Who said headless can't be helpful?

With these templates, you can quickly bootstrap your project with a well-designed, functional user interface for your Tiptap Editor.

> [!Important]
> Do note that these templates are free to access only for evaluation purposes. If you wish to use Tiptap's paid features, you will need to comply with the [Tiptap Pro License](https://tiptap.dev/pro-license). To summarize, you can use the Tiptap Pro extensions for free in development or for personal reasons, but you will need to purchase a license to use them in production or commercially.
> All code in this repository is licensed under the [Tiptap Pro License](https://tiptap.dev/pro-license) and may not be be distributed or used in production without a valid license.

## Installation & Usage

This is not your typical setup, so please follow the instructions carefully to get started.

### 1. Clone the repository

To begin, clone the tiptap-templates repository from GitHub, using the following command:

```bash
git clone git@github.com:ueberdosis/tiptap-templates.git
```

### 2. Setup the Tiptap registry

Once you've cloned the repository, you'll need to setup a `.npmrc` file to authenticate with the Tiptap registry. This is necessary to access the Tiptap Pro extensions which are included in the `package.json`, if this step is skipped you will not be able to install dependencies.

You can create a free account, no credit card required, at [Tiptap Cloud](https://cloud.tiptap.dev/register) to get your toke [here](https://cloud.tiptap.dev/pro-extensions).

```bash
# Create a new .npmrc file in the root of the repo
touch .npmrc
# Add the Tiptap registry to the .npmrc file
echo "@tiptap-pro:registry=https://registry.tiptap.dev/" >> .npmrc
# You can retrieve your token from the Tiptap dashboard at https://cloud.tiptap.dev/pro-extensions
# This requires a free account which can be created at https://cloud.tiptap.dev/register
echo "//registry.tiptap.dev/:_authToken=TIPTAP_AUTH_TOKEN_HERE" >> .npmrc
```

### 3. Convert the template to the free version (required if you are on the free plan)

If you are paying for Tiptap's [Content AI](https://tiptap.dev/product/content-ai) features, you can skip this step.

If you are not paying for Tiptap's [Content AI](https://tiptap.dev/product/content-ai) features, you will need to disable the Content AI extension, and convert the template to the free version, run the following command:

> [!Important]
> If this is not done, you will not be able to `npm install` the project dependencies. Because the `@tiptap-pro/extension-ai` is restricted to paying customers, and needs to be removed from the `package.json` file. The script below will do this for you.

```bash
# Convert the template to the free version
./convert-to-free-version.sh

# This script will remove the @tiptap-pro/extension-ai from the package.json and install stubs for the missing extensions
# AI features will be disabled and will result in errors if used
```

### 4. Install the project dependencies

Now that the NPM token and packages are set up, you can now install the Tiptap Pro extensions and the project dependencies.

```bash
# Install the project dependencies
npm install
```

### 5. Enable collaboration with Tiptap Cloud (optional)

To have collaboration with Tiptap Cloud enabled, you'll need to duplicate the example environment file and adjust the necessary settings in the `.env` file. Ensure the inclusion of your Tiptap cloud token and application IDs in the `.env` file.

```bash
# Duplicate the example environment file and adjust the necessary settings in the .env file
# Ensure the inclusion of your Tiptap cloud token and application IDs in the .env file
cp ./templates/next-block-editor-app/.env.example ./templates/next-block-editor-app/.env

# Edit the .env file with your Tiptap cloud token and application IDs
```

### 6. Launch the development server

Finally, you can start the development server.

```bash
# Launch the development server
npm run dev
```

## Available templates

- React Block Editor Template: [README](./templates/next-block-editor-app/README.md) | [DEMO](https://templates.tiptap.dev/)

## Maintainers

- [bdbch](https://github.com/bdbch)
- [svenadlung](https://github.com/svenadlung)
