import delegate from "delegate-it";
import { visit, navigator } from "@hotwired/turbo";
import mem from "mem";
import debounce from "lodash/debounce";
import type { Visit } from "@hotwired/turbo/dist/types/core/drive/visit";
import type { FetchRequest } from "@hotwired/turbo/dist/types/http/fetch_request";
import type { FetchResponse } from "@hotwired/turbo/dist/types/http/fetch_response";
import type { FrameController } from "@hotwired/turbo/dist/types/core/frames/frame_controller";

export type FrameElement = { delegate: FrameController } & Element;

const inflight = new Map<string, Promise<Response>>();

export const visitFrame = (response: Response, frame: FrameElement) =>
  frame.delegate.requestSucceededWithResponse(
    {} as FetchRequest,
    {
      get responseHTML() {
        return response.text();
      },
    } as FetchResponse,
  );

export const goFast = ({
  keyupDebounce = 150,
  onkeyup = true,
  idempotentFormSelector = 'form:not([method="post"])',
  anchorSelector = "a",
} = {}) => {
  (["mouseover", "touchstart"] as const).forEach((event) =>
    delegate(
      document,
      `${anchorSelector}, ${idempotentFormSelector}`,
      event,
      prefetch,
    ),
  );

  delegate(document, anchorSelector, "click", startVisit);

  delegate(document, idempotentFormSelector, "submit", startVisit);

  if (onkeyup) {
    delegate(
      document,
      idempotentFormSelector,
      "keyup",
      debounce(prefetch, keyupDebounce),
    );
  }

  /** IDEA: Preload images and SVG files on mouse down and touch start? */
};

const startVisit = (event: delegate.Event<Event, Element>) => {
  if (disabled(event)) return;

  const url = extractURLFrom(event.delegateTarget);
  if (!url) return;

  const inflightRequest = inflight.get(url);
  if (!inflightRequest) return;

  event.preventDefault();

  const turboFrame = document.querySelector<FrameElement>(
    `turbo-frame[id="${event.delegateTarget.getAttribute(
      "data-turbo-frame",
    )}"]`,
  );

  if (turboFrame) {
    turboFrame.delegate.requestStarted({} as FetchRequest);
  } else {
    navigator.adapter.visitRequestStarted({
      hasCachedSnapshot: () => false,
    } as Visit);
  }

  inflightRequest.then((response) => {
    if (turboFrame) {
      visitFrame(response, turboFrame);
      turboFrame.delegate.requestFinished({} as FetchRequest);

      return;
    }

    navigator.adapter.visitRequestFinished({} as Visit);

    response.text().then((responseHTML) => {
      visit(url, {
        response: { statusCode: response.status, responseHTML },
      });
    });
  });
};

const memoizedFetch = mem(fetch, { maxAge: 3000, cacheKey: JSON.stringify });

export const turboFetch = (url: string, frameId: string | null) =>
  memoizedFetch(url, {
    credentials: "include",
    headers: {
      accept: "text/html, application/xhtml+xml",
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
