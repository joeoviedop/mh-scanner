/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as channelActions from "../channelActions.js";
import type * as channels from "../channels.js";
import type * as episodes from "../episodes.js";
import type * as fragments from "../fragments.js";
import type * as mentionActions from "../mentionActions.js";
import type * as scanJobs from "../scanJobs.js";
import type * as transcriptionActions from "../transcriptionActions.js";
import type * as transcriptions from "../transcriptions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  channelActions: typeof channelActions;
  channels: typeof channels;
  episodes: typeof episodes;
  fragments: typeof fragments;
  mentionActions: typeof mentionActions;
  scanJobs: typeof scanJobs;
  transcriptionActions: typeof transcriptionActions;
  transcriptions: typeof transcriptions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
