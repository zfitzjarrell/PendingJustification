import {
  ApproveRequestData,
  ApproveRequestError,
  ApproveRequestParams,
  CheckHealthData,
  GetJustificationData,
  GetJustificationError,
  GetJustificationParams,
  GetRationaleData,
  GetRationaleError,
  GetRationaleParams,
  HealthCheckData,
  HealthCheckJaasData,
  ListTonesData,
  ListTonesJaasData,
  ListTopicsData,
  ListTopicsJaasData,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:raas
   * @name get_rationale
   * @summary Get Rationale
   * @request GET:/routes/raas
   */
  get_rationale = (query: GetRationaleParams, params: RequestParams = {}) =>
    this.request<GetRationaleData, GetRationaleError>({
      path: `/routes/raas`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:raas
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/raas/health
   */
  health_check = (params: RequestParams = {}) =>
    this.request<HealthCheckData, any>({
      path: `/routes/raas/health`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:raas
   * @name list_topics
   * @summary List Topics
   * @request GET:/routes/raas/topics
   */
  list_topics = (params: RequestParams = {}) =>
    this.request<ListTopicsData, any>({
      path: `/routes/raas/topics`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:raas
   * @name list_tones
   * @summary List Tones
   * @request GET:/routes/raas/tones
   */
  list_tones = (params: RequestParams = {}) =>
    this.request<ListTonesData, any>({
      path: `/routes/raas/tones`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:jaas
   * @name get_justification
   * @summary Get Justification
   * @request GET:/routes/jaas
   */
  get_justification = (query: GetJustificationParams, params: RequestParams = {}) =>
    this.request<GetJustificationData, GetJustificationError>({
      path: `/routes/jaas`,
      method: "GET",
      query: query,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:jaas
   * @name health_check_jaas
   * @summary Health Check Jaas
   * @request GET:/routes/jaas/health
   */
  health_check_jaas = (params: RequestParams = {}) =>
    this.request<HealthCheckJaasData, any>({
      path: `/routes/jaas/health`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:jaas
   * @name list_topics_jaas
   * @summary List Topics Jaas
   * @request GET:/routes/jaas/topics
   */
  list_topics_jaas = (params: RequestParams = {}) =>
    this.request<ListTopicsJaasData, any>({
      path: `/routes/jaas/topics`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:jaas
   * @name list_tones_jaas
   * @summary List Tones Jaas
   * @request GET:/routes/jaas/tones
   */
  list_tones_jaas = (params: RequestParams = {}) =>
    this.request<ListTonesJaasData, any>({
      path: `/routes/jaas/tones`,
      method: "GET",
      ...params,
    });

  /**
   * @description Easter Egg: Trying to 'approve' something will simply return a justification (rejection). This simulates the bureaucracy where 'approval' is just a myth.
   *
   * @tags dbtn/module:jaas
   * @name approve_request
   * @summary Approve Request
   * @request POST:/routes/approve
   */
  approve_request = (query: ApproveRequestParams, params: RequestParams = {}) =>
    this.request<ApproveRequestData, ApproveRequestError>({
      path: `/routes/approve`,
      method: "POST",
      query: query,
      ...params,
    });
}
