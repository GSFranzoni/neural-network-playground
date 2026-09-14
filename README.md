# Neural Network Playground

> Shape a small neural network. Train it in the browser. Watch its weights, activations, and decision boundary evolve.

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=white)](https://bun.sh)

[Live demo →](https://gsfranzoni.github.io/neural-network-playground/)

Neural Network Playground is a small, interactive binary-classification experiment inspired by [TensorFlow Playground](https://playground.tensorflow.org/). Choose a synthetic dataset, select input features, shape the hidden layers, and train a network while its graph and output heatmap update live. Its neural-network engine is implemented from scratch for this project.

## Support

If you enjoyed this little neural-network experiment, you can support its creator here:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-FFDD00?logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/gsfranzoni)

<a href="https://buymeacoffee.com/gsfranzoni">
  <img src="public/assets/buymeacoffee.png" width="220" alt="Buy Me a Coffee QR code for gsfranzoni" />
</a>

## What it does

- Generates Circle, XOR, Gaussian, Two Moons, and Spiral datasets directly in the browser.
- Lets you select and combine input features such as coordinates, squared terms, products, and sine transforms.
- Configures the hidden layers, activation function, learning rate, and dataset noise.
- Trains a small fully connected network locally and exposes start, pause, and reset controls.
- Visualizes nodes, weighted connections, activation fields, a classification heatmap, and training metrics.
- Keeps the playground configuration in the URL so an experiment can be shared or revisited.

## Quick start

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

## Datasets

The playground uses generated, two-dimensional datasets; there is no external dataset to download. Pick a dataset in the UI, optionally add noise, and start training. Changing the dataset, features, or network structure resets the current training run so the visualization matches the new configuration.

> [!NOTE]
> Training, inference, and visualization run in the browser. Nothing is uploaded or persisted by the app.

## Commands

| Command             | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `bun run dev`       | Start the Vite development server.        |
| `bun run build`     | Type-check and create a production build. |
| `bun run preview`   | Serve the production build locally.       |
| `bun run lint`      | Lint the project with Oxlint.             |
| `bun run lint:fix`  | Apply lint fixes where available.         |
| `bun run fmt`       | Format the project with Oxfmt.            |
| `bun run fmt:check` | Check formatting without writing changes. |
| `bun run test`      | Run the Vitest test suite.                |

## Project structure

```text
src/components/playground  Playground controls and visualizations
src/hooks                  Training, form, and visualization state
src/lib                    Network implementation, features, and URL schema
src/mocks                  Synthetic dataset generators
public/icons               Dataset icons used by the selector
```

The neural-network math and dataset generation are browser-safe. React renders the interface and initial graph topology, while connection styles and canvas-based output visualization are updated efficiently during training.

## Deployment

Pushing to `main` deploys the web app to GitHub Pages through the included workflow. In the GitHub repository settings, set **Pages → Source** to **GitHub Actions** once.

The Vite base path is derived from the repository name in GitHub Actions, so the public assets also work when the app is served from a project page such as `https://<owner>.github.io/<repository>/`.
