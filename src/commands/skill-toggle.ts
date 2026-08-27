import path from "node:path";
import type { AgentId } from "../lib/agents.js";
import {
  getSkillToggleConfigPath,
  resolveAgentSharedSkillsDirs,
  resolveAgentSkillsDir,
  resolveAgentsForMutation,
} from "../lib/agents.js";
import { pathExists } from "../lib/fs.js";
import { normalizeNameList } from "../lib/path.js";
import { isSkillDisabled, removeSkillToggle, setSkillEnabled } from "../lib/skill-toggles.js";
import { skillExists } from "../lib/skills.js";
import type { ActivationType, RuntimeContext } from "../types.js";

/**
 * Codex-only visibility toggles. `agent disable skill` writes a managed
 * `[[skills.config]] name=<skill> enabled=false` entry into the agent's user
 * config, hiding the skill from that agent no matter which skill root it was
 * discovered in (own directory, shared ~/.agents/skills, repo .agents/skills).
 * `agent enable skill` removes the toggle again. Projections are untouched;
 * other agents sharing those roots are unaffected.
 *
 * Codex reads these rules from the user config layer only, so project scope is
 * rejected explicitly instead of silently writing a config that never applies.
 */

function agentsWithoutToggleSupport(agents: AgentId[], homeDir: string): AgentId[] {
  return agents.filter((agentId) => getSkillToggleConfigPath(agentId, homeDir) === undefined);
}

async function skillVisibleToAgent(
  agentId: AgentId,
  scope: "global" | "project",
  baseDir: string,
  skillName: string,
): Promise<boolean> {
  const ownDir = resolveAgentSkillsDir(agentId, scope, baseDir);
  if (await pathExists(path.join(ownDir, skillName, "SKILL.md"))) {
    return true;
  }
  for (const sharedDir of resolveAgentSharedSkillsDirs(agentId, scope, baseDir)) {
    if (await pathExists(path.join(sharedDir, skillName, "SKILL.md"))) {
      return true;
    }
  }
  return false;
}

async function validateSkillNames(
  context: RuntimeContext,
  agents: AgentId[],
  scope: "global" | "project",
  baseDir: string,
  skillNames: string[],
): Promise<string[]> {
  const missing: string[] = [];
  for (const skillName of skillNames) {
    const inStore = await skillExists(context.homeDir, skillName);
    if (inStore) {
      continue;
    }
    let visible = false;
    for (const agentId of agents) {
      if (await skillVisibleToAgent(agentId, scope, baseDir, skillName)) {
        visible = true;
        break;
      }
    }
    if (!visible) {
      missing.push(skillName);
    }
  }
  return missing;
}

function assertSkillType(type: ActivationType): void {
  if (type !== "skill") {
    throw new Error('Config toggles only apply to skills. Use "aweskill agent disable skill <name>".');
  }
}

export async function runSkillDisable(
  context: RuntimeContext,
  options: {
    type: ActivationType;
    name: string | string[];
    agents: string[];
  },
) {
  assertSkillType(options.type);
  const agents = await resolveAgentsForMutation({
    requestedAgents: options.agents,
    scope: "global",
    homeDir: context.homeDir,
  });
  const skillNames = normalizeNameList(options.name);
  const missing = await validateSkillNames(context, agents, "global", context.homeDir, skillNames);
  if (missing.length > 0) {
    throw new Error(
      `Unknown skill(s): ${missing.join(", ")}. Toggles only apply to skills in the aweskill store or already visible to the target agents.`,
    );
  }

  const unsupported = agentsWithoutToggleSupport(agents, context.homeDir);
  const supported = agents.filter((agentId) => !unsupported.includes(agentId));

  const toggled: string[] = [];
  for (const agentId of supported) {
    const configPath = getSkillToggleConfigPath(agentId, context.homeDir)!;
    for (const skillName of skillNames) {
      const result = await setSkillEnabled(configPath, skillName, false);
      if (result !== "noop") {
        toggled.push(`${agentId}:${skillName}`);
      }
    }
  }

  if (toggled.length > 0) {
    context.write(
      `Disabled skill ${skillNames.join(", ")} for ${supported.join(", ")} (config toggle; projections kept).`,
    );
  } else {
    context.write(`Skill ${skillNames.join(", ")} already disabled for ${supported.join(", ")}.`);
  }
  if (unsupported.length > 0) {
    context.write(
      `Skipped ${unsupported.join(", ")}: no config-based skill toggle support. Remove their projections with "aweskill agent remove skill" instead.`,
    );
  }
  return { agents: supported, skillNames, toggled, skipped: unsupported };
}

export async function runSkillEnable(
  context: RuntimeContext,
  options: {
    type: ActivationType;
    name: string | string[];
    agents: string[];
  },
) {
  assertSkillType(options.type);
  const agents = await resolveAgentsForMutation({
    requestedAgents: options.agents,
    scope: "global",
    homeDir: context.homeDir,
  });
  const skillNames = normalizeNameList(options.name);

  const unsupported = agentsWithoutToggleSupport(agents, context.homeDir);
  const supported = agents.filter((agentId) => !unsupported.includes(agentId));

  const cleared: string[] = [];
  const withoutProjection: string[] = [];
  for (const agentId of supported) {
    const configPath = getSkillToggleConfigPath(agentId, context.homeDir)!;
    for (const skillName of skillNames) {
      if (await isSkillDisabled(configPath, skillName)) {
        await removeSkillToggle(configPath, skillName);
        cleared.push(`${agentId}:${skillName}`);
      }
    }
    for (const skillName of skillNames) {
      if (!(await skillVisibleToAgent(agentId, "global", context.homeDir, skillName))) {
        withoutProjection.push(`${agentId}:${skillName}`);
      }
    }
  }

  if (cleared.length > 0) {
    context.write(`Enabled skill ${skillNames.join(", ")} for ${supported.join(", ")} (config toggle removed).`);
  } else {
    context.write(`No config toggle found for ${skillNames.join(", ")} on ${supported.join(", ")}; nothing to clear.`);
  }
  if (withoutProjection.length > 0) {
    context.write(
      `Still not visible to: ${withoutProjection.join(", ")}. Create projections with "aweskill agent add skill ${skillNames.join(" ")}".`,
    );
  }
  if (unsupported.length > 0) {
    context.write(
      `Skipped ${unsupported.join(", ")}: no config-based skill toggle support. Use "aweskill agent add skill" to create projections.`,
    );
  }
  return { agents: supported, skillNames, cleared, withoutProjection, skipped: unsupported };
}
