# Vue Component Debug

Adds HTML comments to the start and end of each Vue component, so you can more easily keep track of what's being used.

> **Why not just use Vue Devtools?** This makes it easier to debug in the DOM without needing to context-switch to Vue devtools.

[Inspired by the `laravel-view-debug` package by my colleague Jason Varga](https://github.com/pixelfear/laravel-view-debug)

## Example

You may have a Vue component which looks like this:

```vue
<div>
	My component file!

	<SubComponent>Click me!</SubComponent>

	More stuff
</div>
```

It will be rendered like this:

```html
<!-- Start component: src/components/MyComponent.vue -->
<div>
    My component file
    
    <!-- Start component: src/components/SubComponent.vue -->
    <div>Sub component</div>
    <!-- End component: src/components/SubComponent.vue -->

    More stuff
</div>
<!-- End component: src/components/MyComponent.vue -->
```

Of course, since they are HTML comments, it will look no different unless you view the source.

## Installation

You can install the package via npm:

```bash
npm install vue-component-debug --save-dev
```

## Usage

To enable it, add the `VueComponentDebug` plugin to your Vue application. This can be done in your main entry file (e.g., `main.js` or `main.ts`):

```javascript
import { createApp } from 'vue'
import VueComponentDebug from 'vue-component-debug'
import App from './App.vue'

const app = createApp(App)

app.use(VueComponentDebug)

app.mount('#app')
```

Comments will only be added in development mode.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```