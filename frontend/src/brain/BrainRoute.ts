import {
  ApproveRequestData,
  CheckHealthData,
  Format,
  GetJustificationData,
  GetRationaleData,
  HealthCheckData,
  HealthCheckJaasData,
  Length,
  ListTonesData,
  ListTonesJaasData,
  ListTopicsData,
  ListTopicsJaasData,
  Tone,
  Topic,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * No description
   * @tags dbtn/module:raas
   * @name get_rationale
   * @summary Get Rationale
   * @request GET:/routes/raas
   */
  export namespace get_rationale {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Topic
       * Preset topic category
       */
      topic?: Topic | null;
      /**
       * Context
       * Specific context (e.g. 'DB migration', 'Q4 budget')
       */
      context?: string | null;
      /**
       * Tone
       * Tone of the response
       */
      tone?: Tone | null;
      /**
       * Intensity
       * Intensity level 1-5
       */
      intensity?: number | null;
      /**
       * Length
       * Length of the rationale
       */
      length?: Length | null;
      /**
       * Response format: json or plain
       * @default "json"
       */
      format?: Format;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetRationaleData;
  }

  /**
   * No description
   * @tags dbtn/module:raas
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/raas/health
   */
  export namespace health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HealthCheckData;
  }

  /**
   * No description
   * @tags dbtn/module:raas
   * @name list_topics
   * @summary List Topics
   * @request GET:/routes/raas/topics
   */
  export namespace list_topics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTopicsData;
  }

  /**
   * No description
   * @tags dbtn/module:raas
   * @name list_tones
   * @summary List Tones
   * @request GET:/routes/raas/tones
   */
  export namespace list_tones {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTonesData;
  }

  /**
   * No description
   * @tags dbtn/module:jaas
   * @name get_justification
   * @summary Get Justification
   * @request GET:/routes/jaas
   */
  export namespace get_justification {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Topic
       * Preset topic category
       */
      topic?: Topic | null;
      /**
       * Context
       * Specific context (e.g. 'DB migration', 'Q4 budget')
       */
      context?: string | null;
      /**
       * Tone
       * Tone of the response
       */
      tone?: Tone | null;
      /**
       * Intensity
       * Intensity level 1-5
       */
      intensity?: number | null;
      /**
       * Length
       * Length of the justification
       */
      length?: Length | null;
      /**
       * Response format: json or plain
       * @default "json"
       */
      format?: Format;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetJustificationData;
  }

  /**
   * No description
   * @tags dbtn/module:jaas
   * @name health_check_jaas
   * @summary Health Check Jaas
   * @request GET:/routes/jaas/health
   */
  export namespace health_check_jaas {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HealthCheckJaasData;
  }

  /**
   * No description
   * @tags dbtn/module:jaas
   * @name list_topics_jaas
   * @summary List Topics Jaas
   * @request GET:/routes/jaas/topics
   */
  export namespace list_topics_jaas {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTopicsJaasData;
  }

  /**
   * No description
   * @tags dbtn/module:jaas
   * @name list_tones_jaas
   * @summary List Tones Jaas
   * @request GET:/routes/jaas/tones
   */
  export namespace list_tones_jaas {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTonesJaasData;
  }

  /**
   * @description Easter Egg: Trying to 'approve' something will simply return a justification (rejection). This simulates the bureaucracy where 'approval' is just a myth.
   * @tags dbtn/module:jaas
   * @name approve_request
   * @summary Approve Request
   * @request POST:/routes/approve
   */
  export namespace approve_request {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Response format: json or plain
       * @default "json"
       */
      format?: Format;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ApproveRequestData;
  }
}
