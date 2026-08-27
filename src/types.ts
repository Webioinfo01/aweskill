export type ActivationType = "bundle" | "skill";
export type ProjectionMode = "symlink" | "copy";
export type Scope = "global" | "project";

export interface BundleDefinition {
  name: string;
  skills: string[];
}

export interface AweskillPaths {
  homeDir: string;
  rootDir: string;
  skillsDir: string;
  dupSkillsDir: string;
  backupDir: string;
  dedupBackupDir: string;
  fixSkillsBackupDir: string;
  bundlesDir: string;
  updateCheckFile: string;
}

export interface AgentDefinition {
  id: string;
  displayName: string;
  defaultProjectionMode: ProjectionMode;
  supportsGlobal: boolean;
  supportsProject: boolean;
  rootDir: (homeDir: string) => string;
  globalSkillsDir?: (homeDir: string) => string;
  projectSkillsDir?: (projectDir: string) => string;
  /**
   * Extra skill directories the agent also reads in addition to its own
   * skills directory (e.g. Codex reads ~/.agents/skills at user scope and
   * .agents/skills at repo scope). Projections there are owned by another
   * agent, so aweskill only reads them for visibility checks.
   */
  sharedSkillsDirs?: (scope: Scope, baseDir: string) => string[];
  /**
   * Config file whose [[skills.config]] entries can hide a skill from the
   * agent by name, regardless of which root it was discovered in. Undefined
   * when the agent has no config-based skill toggle.
   */
  skillToggleConfigPath?: (homeDir: string) => string;
}

export interface RuntimeContext {
  cwd: string;
  homeDir: string;
  write: (message: string) => void;
  writeRaw?: (message: string) => void;
  error: (message: string) => void;
}

export interface ScanCandidate {
  agentId: string;
  name: string;
  path: string;
  scope: Scope;
  projectDir?: string;
  isSymlink: boolean;
  symlinkSourcePath?: string;
  isBrokenSymlink?: boolean;
}

export interface ImportResult {
  name: string;
  destination: string;
  warnings: string[];
  linkedSourcePath?: string;
}

export interface SkillEntry {
  name: string;
  path: string;
  hasSKILLMd: boolean;
}
