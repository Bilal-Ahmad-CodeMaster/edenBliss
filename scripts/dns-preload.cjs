const dns = require("dns");

function isLoopback(server) {
  const host = String(server).replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return host === "127.0.0.1" || host === "::1" || host === "0.0.0.0";
}

function usePublicDnsWhenLoopback() {
  const servers = dns.getServers();
  if (servers.length === 0 || servers.every(isLoopback)) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
}

usePublicDnsWhenLoopback();
module.exports = { usePublicDnsWhenLoopback };
