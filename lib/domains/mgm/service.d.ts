import type HttpClient from "../../http-client";
import { MgmDetails } from "./types";
export declare class MgmService {
    private http;
    constructor(http: HttpClient);
    /**
     * Returns the MGM (member-get-member) details — the friends discount data.
     */
    getMgmDetails(): Promise<MgmDetails>;
}
//# sourceMappingURL=service.d.ts.map