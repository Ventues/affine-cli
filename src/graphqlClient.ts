import { fetch } from "undici";
import { execSync } from "child_process";

export class GraphQLClient {
  private headers: Record<string, string>;
  private authenticated: boolean = false;
  private useCurlFallback: boolean = false;
  
  constructor(private opts: { endpoint: string; headers?: Record<string, string>; bearer?: string }) {
    this.headers = { ...(opts.headers || {}) };
    
    // Set authentication in priority order
    if (opts.bearer) {
      this.headers["Authorization"] = `Bearer ${opts.bearer}`;
      this.authenticated = true;
      console.error("Using Bearer token authentication");
    } else if (this.headers.Cookie) {
      this.authenticated = true;
      console.error("Using Cookie authentication");
    }
  }

  setHeaders(next: Record<string, string>) {
    this.headers = { ...this.headers, ...next };
  }

  setCookie(cookieHeader: string) {
    this.headers["Cookie"] = cookieHeader;
    this.authenticated = true;
    console.error("Session cookies set from email/password login");
  }
  
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  get endpoint(): string {
    return this.opts.endpoint;
  }

  getAuthHeaders(): Record<string, string> {
    const h: Record<string, string> = {};
    if (this.headers["Authorization"]) h["Authorization"] = this.headers["Authorization"];
    if (this.headers["Cookie"]) h["Cookie"] = this.headers["Cookie"];
    return h;
  }

  private curlRequest<T>(query: string, variables?: Record<string, any>): T {
    const body = JSON.stringify({ query, variables });
    const headerArgs = Object.entries({ "Content-Type": "application/json", ...this.headers })
      .map(([k, v]) => `-H '${k}: ${v}'`)
      .join(" ");
    const escaped = body.replace(/'/g, "'\\''");
    const cmd = `curl -s ${headerArgs} -d '${escaped}' '${this.opts.endpoint}'`;
    const result = execSync(cmd, { timeout: 30000, encoding: "utf-8" });
    const json = JSON.parse(result) as any;
    if (json.errors) {
      const msg = json.errors.map((e: any) => e.message).join("; ");
      throw new Error(`GraphQL error: ${msg}`);
    }
    return json.data as T;
  }

  async request<T>(query: string, variables?: Record<string, any>): Promise<T> {
    if (this.useCurlFallback) {
      return this.curlRequest<T>(query, variables);
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json", ...this.headers };
      const res = await fetch(this.opts.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables })
      });
      const json = await res.json() as any;
      if (!res.ok || json.errors) {
        const msg = json.errors?.map((e: any) => e.message).join("; ") || res.statusText;
        throw new Error(`GraphQL error: ${msg}`);
      }
      return json.data as T;
    } catch (e: any) {
      if (e.message === "fetch failed" || e.cause?.code === "EHOSTUNREACH") {
        console.error("fetch failed, switching to curl fallback");
        this.useCurlFallback = true;
        return this.curlRequest<T>(query, variables);
      }
      throw e;
    }
  }
}
