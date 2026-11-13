"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportsAsyncLocalStorage = void 0;
const async_hooks_1 = require("async_hooks");
exports.SupportsAsyncLocalStorage = typeof async_hooks_1.AsyncLocalStorage !== 'undefined';
//# sourceMappingURL=platform.js.map