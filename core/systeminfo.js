import os from "os";

export function getSystemInfo() {
  return {
    os: os.platform(),
    version: os.release(),
    cpu: os.cpus()[0].model,
    cores: os.cpus().length,
    ram: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
    hostname: os.hostname(),
    uptime: os.uptime()
  };
}