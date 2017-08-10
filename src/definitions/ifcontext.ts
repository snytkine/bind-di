/**
 * Created by snytkind on 8/8/17.
 */
import * as cookies from "cookies"
import * as http from "http"
import * as url from 'url'
import {StringToString, StringToAny} from './types'

export interface IfCtx {

  readonly req: http.IncomingMessage
  readonly res: http.ServerResponse
  readonly startTime:number
  params: StringToString
  method: string
  path: string
  query: {[key: string]: string|string[]}

  readonly querystring:string

  /**
   * Storage of anything for the duration or request/response
   */
  readonly scope: StringToAny

  /**
   * Copied from req.url when request comes in
   * This way .url can be changed but this value should not be changed
   * Must be initialized only in Constructor when original req is passed to constructor
   * After that it should never be changed.
   */
  readonly originalUrl: string

  //appResponse: IAppResponse;
  /**
   * Get value of header, defaults to empty string if not found
   * @param field
   */
  get?(field: string): string

  cookies?: cookies.ICookies

  UriInfo:url.Url

  /**
   * @todo may be removed and replace with different way arguments are prepared.. see below
   */
  controllerArguments: Array<any>

  /**
   * @todo may be removed and replaced with different way we prepare controller arguments
   * instead of adding them to context maybe better to return then all from function
   *
   * controller(validateArguments(prepareArguments(ctx)))
   *
   * this way the arguments are never added to heap object
   */
  parsedBody: any

  /**
   * controllerName is set when controller is called from the router, this is the first
   * thing that is done when controller is called but before controller function finish running
   * This value is intended for logging purposes so logger can log
   * uri, method, params, return type, passed arguments and controller name
   *
   * @todo this will be removed as we will have something like "LogAround" decorator
   */
  controllerName: string

  /**
   * This one is used by koa router
   * @todo will remove when koa not used anymore
   */
  //matched?: Array<IMatched>

}
