import createServer from "./createServer.js";
import config from "./config.js";
import colors from "colors";

const host = config.host;
const port = config.port;
const web_server_url = config.publicUrl;

export default function server() {
  createServer({
    originBlacklist: [],
    originWhitelist: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [],
    requireHeader: [],
    removeHeaders: [
      "cookie",
      "cookie2",
      "x-request-start",
      "x-request-id",
      "via",
      "connect-time",
      "total-route-time",
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
      xfwd: false,
    },
  }).listen(port, host, function () {
    console.log(
      colors.green("Server running on ") + colors.blue(`${web_server_url}`)
    );
  });
}
