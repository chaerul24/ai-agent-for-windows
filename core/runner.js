import { Agent } from "./agent.js";

export async function runAgent(goal, cwd, memory) {
  const agent = new Agent(cwd);

  agent.memory.failed = memory.failed || [];
  agent.memory.success = memory.success || [];

  await agent.run(goal);

  return {
    failed: agent.memory.failed,
    success: agent.memory.success,
    lastMessage: agent.lastMessage || null
  };
}