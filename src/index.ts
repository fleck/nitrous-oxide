import delegate from "delegate-it";
import { visit } from "@hotwired/turbo";
import type { FrameElement } from "@hotwired/turbo/dist/types/elements/frame_element";
import mem from "mem";

const inflight = new Map<string, Promise<Response>>();

export const visitFrame = (response: Response, frameId: string) =>
  document
    .querySelector<FrameElement>(`turbo-frame[id="${frameId}"]`)
    ?.controller.requestSucceededWithResponse(
      undefined as any,
      {
        get responseHTML() {
          return response.text();
        },
      } as any,
    );

export const goFast = () => {
  const eligibleForPrefetch = 'a, form:not([method="post"])';

  (["mouseover", "touchstart"] as const).forEach((event) =>
    delegate(document, eligibleForPrefetch, event, prefetch),
  );

  delegate(document, eligibleForPrefetch, "click", startVisit);

  /** IDEA: Preload images and SVG files on mouse down and touch start? */
};

const startVisit = (event: delegate.Event<Event, Element>) => {
  if (disabled(event)) return;

  const url = extractURLFrom(event.delegateTarget);

  if (!url) return;

  const inflightRequest = inflight.get(url);
  if (!inflightRequest) return;

  event.preventDefault();

  inflightRequest.then((response) => {
    const frameId = event.delegateTarget.getAttribute("data-turbo-frame");

    if (frameId) {
      visitFrame(response, frameId);
      return;
    }

    response.text().then((responseHTML) => {
      visit(url, {
        response: { statusCode: response.status, responseHTML },
        action: "replace",
      });
    });
  });
};

const memoizedFetch = mem(fetch, { maxAge: 3000, cacheKey: JSON.stringify });

export const turboFetch = (url: string, frameId: string | null) =>
  memoizedFetch(url, {
    credentials: "include",
    headers: {
      accept: "text/html; turbo-stream, text/html, application/xhtml+xml",
      ...(frameId ? { "turbo-frame": frameId } : {}),
    },
  });

const disabled = (event: Event) =>
  event.target instanceof HTMLElement &&
  event.target.dataset.nitrous === "false";

const prefetch = (event: delegate.Event<Event, HTMLElement>) => {
  if (disabled(event)) {
    return;
  }

  const fullURL = extractURLFrom(event.delegateTarget);

  if (!fullURL) return;

  const newURL = new URL(fullURL);

  if (newURL.hostname !== window.location.hostname) {
    return;
  }

  const urlWithoutHash =
    window.location.origin + newURL.pathname + newURL.search;

  if (inflight.has(urlWithoutHash)) return;

  const turboFrameId = event.delegateTarget.getAttribute("data-turbo-frame");

  const request = turboFetch(urlWithoutHash, turboFrameId);

  request.then((response) => {
    if (!response.headers.get("Cache-Control")?.includes("max-age")) {
      console.warn(
        `Pre-fetched response from ${response.url} should include max-age.`,
      );
    }
  });

  inflight.set(
    urlWithoutHash,
    request.finally(() => {
      inflight.delete(urlWithoutHash);
    }),
  );
};

export const extractURLFrom = (target: EventTarget | null) => {
  if (target instanceof HTMLAnchorElement) {
    return target.href;
  } else if (target instanceof HTMLFormElement) {
    const url = new URL(target.action);

    url.search = new URLSearchParams(new FormData(target) as any).toString();

    return url.toString();
  }
};
