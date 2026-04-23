export function isSafe(cmd) {
  const blocked = ["rm", "sudo", "shutdown", "reboot", ">", "|"];
  return !blocked.some(b => cmd.includes(b));
}