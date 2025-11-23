import { isValidHostName } from "./isValidHostName.js";
import { getProxyForUrl } from "proxy-from-env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import withCORS from "./withCORS.js";
import parseURL from "./parseURL.js";
import proxyM3U8 from "./proxy.js";
import { proxyTs } from "./proxyTS.js";
import proxyRequest from "./proxyRequest.js";
import { getEpisodeStreams } from "./hianimeApi.js";
import config from "./config.js";

const web_server_url = config.publicUrl;

export default function getHandler(options, proxy) {
  const corsAnywhere = {
    handleInitialRequest: null,
    getProxyForUrl: getProxyForUrl,
    maxRedirects: 5,
    originBlacklist: [],
    originWhitelist: [],
    checkRateLimit: null,
    redirectSameOrigin: false,
    requireHeader: null,
    removeHeaders: [],
    setHeaders: {},
    corsMaxAge: 0,
  };

  Object.keys(corsAnywhere).forEach(function (option) {
    if (Object.prototype.hasOwnProperty.call(options, option)) {
      corsAnywhere[option] = options[option];
    }
  });

  if (corsAnywhere.requireHeader) {
    if (typeof corsAnywhere.requireHeader === "string") {
      corsAnywhere.requireHeader = [corsAnywhere.requireHeader.toLowerCase()];
    } else if (
      !Array.isArray(corsAnywhere.requireHeader) ||
      corsAnywhere.requireHeader.length === 0
    ) {
      corsAnywhere.requireHeader = null;
    } else {
      corsAnywhere.requireHeader = corsAnywhere.requireHeader.map(function (
        headerName
      ) {
        return headerName.toLowerCase();
      });
    }
  }
  const hasRequiredHeaders = function (headers) {
    return (
      !corsAnywhere.requireHeader ||
      corsAnywhere.requireHeader.some(function (headerName) {
        return Object.hasOwnProperty.call(headers, headerName);
      })
    );
  };

  return async function (req, res) {
    req.corsAnywhereRequestState = {
      getProxyForUrl: corsAnywhere.getProxyForUrl,
      maxRedirects: corsAnywhere.maxRedirects,
      corsMaxAge: corsAnywhere.corsMaxAge,
    };

    const cors_headers = withCORS({}, req);
    if (req.method === "OPTIONS") {
      res.writeHead(200, cors_headers);
      res.end();
      return;
    }

    const location = parseURL(req.url.slice(1));

    if (
      corsAnywhere.handleInitialRequest &&
      corsAnywhere.handleInitialRequest(req, res, location)
    ) {
      return;
    }

    if (!location) {
      if (/^\/https?:\/[^/]/i.test(req.url)) {
        res.writeHead(400, "Missing slash", cors_headers);
        res.end(
          "The URL is invalid: two slashes are needed after the http(s):."
        );
        return;
      }
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);

      res.end(readFileSync(join(__dirname, "../index.html")));
      return;
    }

    if (location.host === "iscorsneeded") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("no");
      return;
    }

    if ((Number(location.port) ?? 0) > 65535) {
      res.writeHead(400, "Invalid port", cors_headers);
      res.end("Port number too large: " + location.port);
      return;
    }

    if (!/^\/https?:/.test(req.url) && !isValidHostName(location.hostname)) {
      const uri = new URL(req.url ?? web_server_url, "http://localhost:3000");
      if (uri.pathname === "/m3u8-proxy" || uri.pathname === "/proxy") {
        let headers = {};
        try {
          headers = JSON.parse(uri.searchParams.get("headers") ?? "{}");
        } catch (e) {
          res.writeHead(500);
          res.end(e.message);
          return;
        }
        const url = uri.searchParams.get("url");
        return proxyM3U8(url ?? "", headers, res);
      } else if (uri.pathname === "/ts-proxy") {
        let headers = {};
        try {
          headers = JSON.parse(uri.searchParams.get("headers") ?? "{}");
        } catch (e) {
          res.writeHead(500);
          res.end(e.message);
          return;
        }
        const url = uri.searchParams.get("url");
        return proxyTs(url ?? "", headers, req, res);
      } else if (uri.pathname === "/docs") {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        return res.end(readFileSync(join(__dirname, "../docs.html")));
      } else if (uri.pathname.startsWith("/stream/s-2/")) {
        // Player page - serves the HTML player
        // Format: /stream/s-2/{anime-slug}?ep={episode-number}/{language}
        // Example: /stream/s-2/my-hero-academia-19544?ep=136197/dub
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        return res.end(readFileSync(join(__dirname, "../player.html")));
      } else if (uri.pathname.startsWith("/api/stream/")) {
        // API endpoint to get stream data
        // Format: /api/stream/{episode-id-or-full-slug}/{language}
        // Examples:
        //   /api/stream/136197/dub
        //   /api/stream/my-hero-academia-19544?ep=136197/dub
        const pathParts = uri.pathname.split("/").filter(p => p);
        let episodeId = decodeURIComponent(pathParts.slice(2, -1).join("/")); // Decode and get everything between 'stream' and language
        const language = pathParts[pathParts.length - 1] || 'sub';
        
        console.log(`API request - Episode ID: ${episodeId}, Language: ${language}`);
        
        try {
          const streamData = await getEpisodeStreams(episodeId, language);
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*'
          });
          return res.end(JSON.stringify(streamData));
        } catch (error) {
          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          return res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
      } else if (uri.pathname === "/") {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        return res.end(readFileSync(join(__dirname, "../index.html")));
      } else {
        res.writeHead(404, "Invalid host", cors_headers);
        res.end("Invalid host: " + location.hostname);
        return;
      }
    }

    if (!hasRequiredHeaders(req.headers)) {
      res.writeHead(400, "Header required", cors_headers);
      res.end(
        "Missing required request header. Must specify one of: " +
          corsAnywhere.requireHeader
      );
      return;
    }

    const origin = req.headers.origin || "";
    if (corsAnywhere.originBlacklist.indexOf(origin) >= 0) {
      res.writeHead(403, "Forbidden", cors_headers);
      res.end(
        'The origin "' +
          origin +
          '" was blacklisted by the operator of this proxy.'
      );
      return;
    }

    if (
      corsAnywhere.originWhitelist.length &&
      corsAnywhere.originWhitelist.indexOf(origin) === -1
    ) {
      res.writeHead(403, "Forbidden", cors_headers);
      res.end(
        'The origin "' +
          origin +
          '" was not whitelisted by the operator of this proxy.'
      );
      return;
    }

    const rateLimitMessage =
      corsAnywhere.checkRateLimit && corsAnywhere.checkRateLimit(origin);
    if (rateLimitMessage) {
      res.writeHead(429, "Too Many Requests", cors_headers);
      res.end(
        'The origin "' +
          origin +
          '" has sent too many requests.\n' +
          rateLimitMessage
      );
      return;
    }

    if (
      corsAnywhere.redirectSameOrigin &&
      origin &&
      location.href[origin.length] === "/" &&
      location.href.lastIndexOf(origin, 0) === 0
    ) {
      cors_headers.vary = "origin";
      cors_headers["cache-control"] = "private";
      cors_headers.location = location.href;
      res.writeHead(301, "Please use a direct request", cors_headers);
      res.end();
      return;
    }

    const isRequestedOverHttps =
      req.connection.encrypted ||
      /^\s*https/.test(req.headers["x-forwarded-proto"]);
    const proxyBaseUrl =
      (isRequestedOverHttps ? "https://" : "http://") + req.headers.host;

    corsAnywhere.removeHeaders.forEach(function (header) {
      delete req.headers[header];
    });

    Object.keys(corsAnywhere.setHeaders).forEach(function (header) {
      req.headers[header] = corsAnywhere.setHeaders[header];
    });

    req.corsAnywhereRequestState.location = location;
    req.corsAnywhereRequestState.proxyBaseUrl = proxyBaseUrl;

    proxyRequest(req, res, proxy);
  };
}
