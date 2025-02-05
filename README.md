# Mania Beginner's Showdown 3

Built with [Svelte](svelte.dev/) on the frontend and leverages [Directus](directus.io/) for the backend.

# Note

This is not the official repository, rather a playground for myself (sinsa92) to play and mess around with the code. For the upstream repository, head over to [Paturages/mbs3](https://github.com/Paturages/mbs3).

# Installation and setup

Install dependencies with `yarn install` (npm should also work though your mileage may vary because this uses a `yarn.lock`).

## Directus

In order to support osu! OAuth on Directus, I tried [forking directus](https://github.com/Paturages/directus/tree/pat/osu-oauth-workaround)
but didn't get a workable package that way unfortunately, so there's an atrocious hotfix that patches `node_modules/directus`
endpoints directly in `atrocities`. You shouldn't need to run the patch as it's in the `postinstall` hook, but still fyi.

`cp .env.example .env` and configure it, namely the postgres database and the [osu! v2 OAuth credentials](https://osu.ppy.sh/home/account/edit#oauth).
For the OAuth redirect, use something like `http://localhost:8055/auth/oauth/osu/callback` (you can probably figure out what `http://localhost:8055` should be
if it's different for you). You can launch the thing with `yarn directus` (or `npm run directus`) after that's done.

## Frontend

Keep in mind you'll need to run Directus before launching the backend to actually fetch things.
`yarn dev` starts the frontend dev environment. `yarn build` builds the frontend package into `public/build`.

## Notes for future iterations

* Try to have players fill the Discord information of their osu! profile, have a Discord username form or try to ensure that players are in the
  tournament Discord through a bot (+ Discord OAuth?)
* If a bot is implemented, enforce osu! username in the Discord
* Probably have a referee guide for qualifiers