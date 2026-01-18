# metadata-game

A tiny party game: guess when a photo was taken.

## Install deps

You need `node` and `npm` to run this project. Make sure that you have that first by running:

```bash
node -v
npm -v
```

After making sure node is installed, run:

```bash
npm install
```

## Setup

Start by "importing" a folder of images you want to create a game from.

```bash
node scripts/import-images.cjs --images /path/to/your/images
```

Fill out and edit the generated `answers.template.json` file. Default path is generating at `/staging/game`.

Then generate the final game files used by the UI by running this script:

```bash
node scripts/build-game.cjs --images staging/game/images --answers staging/game/answers.template.json --screen-name "My Game" --password SECRET
```

Change `--screen-name` and `--password` to your liking.

## Run

That's it. Now, you can serve the UI on your local network with:

```bash
npm run serve
```
