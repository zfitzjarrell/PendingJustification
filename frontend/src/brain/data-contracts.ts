/** Format */
export enum Format {
  Plain = "plain",
  Json = "json",
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** Length */
export enum Length {
  OneLiner = "one_liner",
  Short = "short",
  Medium = "medium",
}

/** Tone */
export enum Tone {
  Snarky = "snarky",
  Absurd = "absurd",
  Deadpan = "deadpan",
  CorporateParody = "corporate-parody",
  Unhinged = "unhinged",
}

/** Topic */
export enum Topic {
  ChangeRequest = "change_request",
  SecurityException = "security_exception",
  Budget = "budget",
  Priority = "priority",
  Meeting = "meeting",
  VendorRequest = "vendor_request",
  ProcessPolicy = "process_policy",
  Staffing = "staffing",
  Timeline = "timeline",
  Generic = "generic",
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export interface GetRationaleParams {
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
}

export type GetRationaleData = any;

export type GetRationaleError = HTTPValidationError;

export type HealthCheckData = any;

export type ListTopicsData = any;

export type ListTonesData = any;

export interface GetJustificationParams {
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
}

export type GetJustificationData = any;

export type GetJustificationError = HTTPValidationError;

export type HealthCheckJaasData = any;

export type ListTopicsJaasData = any;

export type ListTonesJaasData = any;

export interface ApproveRequestParams {
  /**
   * Response format: json or plain
   * @default "json"
   */
  format?: Format;
}

export type ApproveRequestData = any;

export type ApproveRequestError = HTTPValidationError;
