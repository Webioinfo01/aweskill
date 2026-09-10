import {
  addSkillToBundle,
  bundleSkillNames,
  createBundle,
  deleteBundle,
  groupSkillsBySource,
  readBundle,
  readBundleFromDirectory,
  removeSkillFromBundle,
  writeBundle,
} from "../lib/bundles.js";
import { normalizeNameList } from "../lib/path.js";
import { skillExists } from "../lib/skills.js";
import { getTemplateBundlesDir } from "../lib/templates.js";
import type { BundleDefinition, RuntimeContext } from "../types.js";
import { runDownload } from "./download.js";

function formatBundle(bundle: BundleDefinition): string {
  const skills = bundle.skills.map((skill) => (skill.source ? `${skill.name} [${skill.source}]` : skill.name));
  return `${bundle.name}: ${skills.join(", ") || "(empty)"}`;
}

export async function runBundleTemplateShow(context: RuntimeContext, bundleName: string) {
  const templateBundlesDir = await getTemplateBundlesDir();
  const bundles = await Promise.all(
    parseNames(bundleName).map((name) => readBundleFromDirectory(templateBundlesDir, name)),
  );
  context.write(bundles.map(formatBundle).join("\n"));
  return bundles;
}

function parseNames(value: string | string[]): string[] {
  return normalizeNameList(value);
}

export async function runBundleCreate(context: RuntimeContext, bundleName: string) {
  const bundles = await Promise.all(parseNames(bundleName).map((name) => createBundle(context.homeDir, name)));
  context.write(bundles.map((bundle) => `Created bundle ${bundle.name}`).join("\n"));
  return bundles;
}

export async function runBundleShow(context: RuntimeContext, bundleName: string) {
  const bundles = await Promise.all(parseNames(bundleName).map((name) => readBundle(context.homeDir, name)));
  context.write(bundles.map(formatBundle).join("\n"));
  return bundles;
}

export async function runBundleAddSkill(
  context: RuntimeContext,
  bundleName: string | string[],
  skillName: string | string[],
) {
  const bundleNames = parseNames(bundleName);
  const skillNames = parseNames(skillName);
  const bundles = [];
  for (const currentBundleName of bundleNames) {
    let bundle = await readBundle(context.homeDir, currentBundleName);
    for (const currentSkillName of skillNames) {
      bundle = await addSkillToBundle(context.homeDir, bundle.name, currentSkillName);
    }
    bundles.push(bundle);
  }
  context.write(
    bundles.map((bundle) => `Bundle ${bundle.name}: ${bundleSkillNames(bundle).join(", ") || "(empty)"}`).join("\n"),
  );
  return bundles;
}

export async function runBundleRemoveSkill(
  context: RuntimeContext,
  bundleName: string | string[],
  skillName: string | string[],
) {
  const bundleNames = parseNames(bundleName);
  const skillNames = parseNames(skillName);
  const bundles = [];
  for (const currentBundleName of bundleNames) {
    let bundle = await readBundle(context.homeDir, currentBundleName);
    for (const currentSkillName of skillNames) {
      bundle = await removeSkillFromBundle(context.homeDir, bundle.name, currentSkillName);
    }
    bundles.push(bundle);
  }
  context.write(
    bundles.map((bundle) => `Bundle ${bundle.name}: ${bundleSkillNames(bundle).join(", ") || "(empty)"}`).join("\n"),
  );
  return bundles;
}

export async function runBundleDelete(context: RuntimeContext, bundleName: string) {
  const deletedNames: string[] = [];
  for (const currentBundleName of parseNames(bundleName)) {
    const deleted = await deleteBundle(context.homeDir, currentBundleName);
    if (!deleted) {
      throw new Error(`Bundle not found: ${currentBundleName}`);
    }
    deletedNames.push(currentBundleName);
  }

  context.write(deletedNames.map((name) => `Deleted bundle ${name}`).join("\n"));
  return deletedNames;
}

export async function runBundleAddTemplate(
  context: RuntimeContext,
  bundleName: string,
  options: { override?: boolean } = {},
) {
  const templateBundlesDir = await getTemplateBundlesDir();
  const override = options.override ?? false;
  const bundles: { name: string; overwritten: boolean }[] = [];

  for (const currentBundleName of parseNames(bundleName)) {
    const templateBundle = await readBundleFromDirectory(templateBundlesDir, currentBundleName);

    try {
      await readBundle(context.homeDir, templateBundle.name);
      if (!override) {
        throw new Error(`Bundle already exists: ${templateBundle.name}. Re-run with --override to replace it.`);
      }
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("ENOENT")) {
        if (error instanceof Error && error.message.startsWith("Bundle already exists:")) {
          throw error;
        }
        throw error;
      }
    }

    await writeBundle(context.homeDir, templateBundle);
    bundles.push({ name: templateBundle.name, overwritten: override });
  }

  context.write(
    bundles
      .map((bundle) =>
        bundle.overwritten
          ? `Overwrote bundle ${bundle.name} from template`
          : `Added bundle ${bundle.name} from template`,
      )
      .join("\n"),
  );
  return bundles;
}

export async function runBundleTemplateInstall(
  context: RuntimeContext,
  bundleName: string,
  options: { override?: boolean } = {},
) {
  const override = options.override ?? false;
  const templateBundlesDir = await getTemplateBundlesDir();
  const templates = await Promise.all(
    parseNames(bundleName).map((name) => readBundleFromDirectory(templateBundlesDir, name)),
  );

  for (const template of templates) {
    for (const [source, skills] of groupSkillsBySource(template.skills)) {
      await runDownload(context, source, { skill: skills, override });
    }
    for (const skill of template.skills) {
      if (!skill.source && !(await skillExists(context.homeDir, skill.name))) {
        context.write(
          `Warning: ${skill.name} has no template source and is not installed; install it before projecting.`,
        );
      }
    }
  }

  return runBundleAddTemplate(context, bundleName, { override });
}
