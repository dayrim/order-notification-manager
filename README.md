# Order notification manager

A plugin to manage order notifications in POS.

# Overview

A Berlin POS plugin to manage incoming orders.

# Working principles

[Documentation can be found here](./docs/index.md)

# Application structure

*- `build/` - Webpack configuration files*

*- `deploy/` - Erply plugins manfiest and description*

*- `dist/` - Build output*

*- `src/` - Application source code*

# Requirements

* node.js >= 8
* npm >= 5

# Development environment

Install dependecies using `npm install`. Run `npm run build` to build the plugin.

# Staging environment

Install dependencies using `npm install`. Run `npm run build-staging` to build
the plugin. **order-notification-manager.js** will be generated to the *dist/*
directory.

# Production environment

Install dependencies using `npm install`. Run `npm run build-production` to
build the plugin. **order-notification-manager.js** will be generated to the *dist/*
directory.

## Authors

* **Hendrik Nõgene** - *Initial work*
