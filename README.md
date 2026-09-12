# nuqs + TanStack Router: a write adds a second query string

Reproduction for [47ng/nuqs#1590](https://github.com/47ng/nuqs/issues/1590).

Open it on StackBlitz:
https://stackblitz.com/github/selemondev/nuqs-tanstack-double-query-repro

## What to do

1. Click **broken: route with a dynamic segment** (`/database/$table`).
2. Click **set view=structure**.
3. Look at the URL box.

You get:

```
/database/customers?schema=public&limit=25&view=structure?schema=public&limit=50&view=data
```

Two query strings. `validateSearch` then reads the tail, so `view` goes back to
`data` and the toggle does not stick. Note `limit=50` in the tail is the route
default, not the `limit=25` that was on screen, so the tail comes from route
resolution.

Now click **fine: route without one** (`/customers`) and press the same button.
That one works. The glued path matches no route, the appended search is empty,
and the browser splits the pathname back correctly. This is why the bug is easy
to miss.

## Cause

`nuqs/adapters/tanstack-router` calls:

```js
navigate({ to: pathname + renderQueryString(search), ... })
```

`to` is a path. `buildLocation` in `router-core` only splits a query string out
of `href`, never out of `to`, so the whole string becomes the pathname and the
router appends its own search on top.

## Possible fix

Pass a search object:

```ts
navigate({
  to: pathname,
  search: objectFromSearchParams(next),
  replace: options.history === "replace",
  resetScroll: options.scroll,
})
```

`objectFromSearchParams` should turn repeated keys into an array, or routers
with a custom `parseSearch` that supports `?filter=a&filter=b` lose all but the
last value.

## What is in here

- `src/main.jsx` is the whole app: two routes, one `useQueryState` toggle, and a
  box printing `router.state.location.href`.
- No custom `parseSearch` or `stringifySearch`. Library defaults only.
- `nuqs` 2.10.1, `@tanstack/react-router` 1.170.35, React 19, Vite 6.

## Run it locally

```bash
npm install
npm run dev
```
