import { API_PATH } from "../constants";
import { Brain } from "./Brain";
import type { RequestParams } from "./http-client";

const isLocalhost = /localhost:\d{4}/i.test(window.location.origin);

const constructBaseUrl = (): string => {
  if (isLocalhost) {
    return `${window.location.origin}${API_PATH}`;
  }

const base =
  (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "https://pendingjustification-proxy.djxodus.workers.dev";

return `${base}${API_PATH}`;

};

type BaseApiParams = Omit<RequestParams, "signal" | "baseUrl" | "cancelToken">;

const constructBaseApiParams = (): BaseApiParams => {
  return {
    credentials: "include",
  };
};

const constructClient = () => {
  const baseUrl = constructBaseUrl();
  const baseApiParams = constructBaseApiParams();

  return new Brain({
    baseUrl,
    baseApiParams,
  });
};

const brain = constructClient();

export default brain;
