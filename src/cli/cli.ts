#!/usr/bin/env bun

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { initializeIssueTracker, scoreFile } from "../lib/lib";

const issueTrackerSystemSelection = process.env.ISSUE_TRACKER_SYSTEM;
const issueTrackingSystem = initializeIssueTracker(issueTrackerSystemSelection as ('jira' | 'github' | 'linear' | 'asana' | 'trello'));

yargs(hideBin(process.argv))
  .command(
    "score [issue] [file]",
    "Score a file against an issue.",
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
          issueTrackingSystem,
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
