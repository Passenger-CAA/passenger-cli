#!/usr/bin/env bun

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { scoreFile } from "../lib/lib";

yargs(hideBin(process.argv))
  .command(
    "score [issue] [file]",
    "Score your files against an issue.",
    (yargs) => yargs,
    async (argv) => {
      const ensuredFileArray: string[] = Array.isArray(argv.file)
        ? argv.file
        : [argv.file];

      if (!argv.issue) {
        throw new Error("No issue key");
      }

      for (const file of ensuredFileArray) {
        await scoreFile({
          issue: argv.issue as string,
          file,
        });
      }
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .parse();
