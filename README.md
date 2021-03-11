# Nitrous Oxide ![Nitrous Oxide Bottle](./nitrous-oxide.svg)

Don't let turbo lag get you down! Add a shot of nitrous to make your sites blazing fast!

A companion library for https://github.com/hotwired/turbo.

```bash
yarn add nitrous-oxide
# or
npm i nitrous-oxide
```

```js
import { start } from "@hotwired/turbo";
import { goFast } from "nitrous-oxide";
start();
goFast();
```

## Why?
Even fetches to well tuned origin servers have a decent amount of latency. Pre-fetching is a simple way to overcome this. You'll want to make sure your HTML responses have a `max-age=30` or similar cache control header set for this to work properly.
