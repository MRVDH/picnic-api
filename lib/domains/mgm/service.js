"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MgmService = void 0;
class MgmService {
    constructor(http) {
        this.http = http;
    }
    /**
     * Returns the MGM (member-get-member) details — the friends discount data.
     */
    getMgmDetails() {
        return this.http.sendRequest("GET", `/mgm`);
    }
}
exports.MgmService = MgmService;
//# sourceMappingURL=service.js.map