"use strict";
/**
 * Created by snytkind on 8/9/17.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function TryCatch(f) {
    try {
        return {
            Success: f(),
            Failure: null
        };
    }
    catch (e) {
        return {
            Success: null,
            Failure: e
        };
    }
}
exports.TryCatch = TryCatch;
