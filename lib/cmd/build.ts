import "allcorns/env.ts";

import { Handlebars } from "https://deno.land/x/handlebars@v0.10.0/mod.ts";
import { join } from "https://deno.land/std@0.204.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.204.0/fs/exists.ts";
import { AcornConfigBuilder } from "allcorns/contracts/config.ts";

const scope =
  Deno.args.find((arg) => arg.startsWith("--scope="))?.split("=", 2)[1] ||
  "index.docker.io/allcorns";

const filter =
  Deno.args.find((arg) => arg.startsWith("--acorn="))?.split("=", 2)[1] ||
  false;

async function acornJson(context: string, ...args: string[]) {
  args = [args[0], "--output", "json", ...args.slice(1)];

  const cmd = new Deno.Command("acorn", {
    args,
    cwd: context,
    stdout: "piped",
    stderr: "piped",
    stdin: "piped",
  });

  const process = cmd.spawn();
  const { stdout, stderr, success, code } = await process
    .output()
    .then((output) => {
      return {
        success: output.success,
        code: output.code,
        stdout: new TextDecoder().decode(output.stdout),
        stderr: new TextDecoder().decode(output.stderr),
      };
    });

  try {
    if (success) {
      return JSON.parse(stdout.trim());
    } else {
      throw new Error(`Command failed with code ${code}`);
    }
  } catch (e) {
    throw new Error(
      `Error parsing render output: ${e.message}\n\nSTDERR: \n\n${stderr}\n\nSTDOUT:\n\n${stdout}`
    );
  }
}

async function acornRun(context: string, ...args: string[]) {
  const cmd = new Deno.Command("acorn", {
    args,
    cwd: context,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const process = cmd.spawn();
  return (await process.output()).success;
}

for await (const dir of Deno.readDir("./acorns")) {
  if (filter) {
    if (dir.name != filter) {
      continue;
    }
  }

  const rootPath = join("./acorns", dir.name);
  const configPath = `../../${join(rootPath, "config.ts").replace(/\\/g, "/")}`;

  const configBuilder = (await import(configPath))
    .default as AcornConfigBuilder;

  const config = await configBuilder();

  for await (const build of config.builds) {
    const context = join(Deno.cwd(), rootPath, build.root!);

    const args = Object.entries(build.args!).flatMap(([key, value]) => {
      if (typeof value == "object") {
        value = `@${JSON.stringify(value)}`;
      }
      return [`--${key}=${value}`];
    });

    const config = await acornJson(
      context,
      "render",
      "--file",
      build.acornfile!,
      "."
    );

    if (!config.name) {
      throw new Error(
        `Missing name for Acorn ${dir.name}, build ${build.name}`
      );
    }

    if (build.acornfile) {
      if (!exists(join(context, build.acornfile))) {
        throw new Error(`Missing Acornfile: ${config.acornfile}`);
      }
    }

    if (config.readme) {
      if (!exists(join(context, config.readme))) {
        throw new Error(`Missing readme: ${config.readme}`);
      }
    }

    if (config.icon) {
      if (!exists(join(context, config.icon))) {
        throw new Error(`Missing icon: ${config.icon}`);
      }
    }

    const tempAcornfile = await Deno.makeTempFile();

    const hb = new Handlebars();
    const acornfile = await hb.render(
      join(context, build.acornfile!),
      build.args
    );

    Deno.writeFileSync(tempAcornfile, new TextEncoder().encode(acornfile));

    const tags = build.tags.map((tag) => `--tag=${scope}/${dir.name}:${tag}`);

    await acornRun(context, "fmt", build.acornfile!);
    await acornRun(
      context,
      "--file",
      tempAcornfile,
      ...tags,
      "build",
      "--push",
      "."
    );
  }
}
