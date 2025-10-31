import { simpleGit, SimpleGit, DiffResult } from 'simple-git';
import { watch, FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';

export type GitChange = {
  files: string[];
  diff: string;
  message?: string;
  timestamp: Date;
};

/**
 * GitWatcher monitors git repository for changes and emits events
 * Works in two modes:
 * 1. Commit mode: Watches for new commits
 * 2. Unstaged mode: Watches for file changes (even before commit)
 */
export class GitWatcher extends EventEmitter {
  private git: SimpleGit;
  private watcher?: FSWatcher;
  private lastCommitHash?: string;
  private watchPath: string;
  private isWatching = false;

  constructor(repoPath: string = process.cwd()) {
    super();
    this.watchPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  /**
   * Start watching for git changes
   */
  async start(): Promise<void> {
    if (this.isWatching) {
      return;
    }

    this.isWatching = true;

    // Get initial commit hash
    try {
      const log = await this.git.log({ maxCount: 1 });
      this.lastCommitHash = log.latest?.hash;
    } catch (error) {
      console.error('Not a git repository or no commits yet');
    }

    // Watch for file changes using chokidar
    this.watcher = watch(this.watchPath, {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.cache/**',
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    // Debounce file changes
    let changeTimeout: NodeJS.Timeout | null = null;
    this.watcher.on('change', (path) => {
      if (changeTimeout) {
        clearTimeout(changeTimeout);
      }
      changeTimeout = setTimeout(() => this.checkForChanges(), 3000);
    });

    this.watcher.on('add', (path) => {
      if (changeTimeout) {
        clearTimeout(changeTimeout);
      }
      changeTimeout = setTimeout(() => this.checkForChanges(), 3000);
    });

    console.log('🐦 Pigeon perched, watching for changes...');
  }

  /**
   * Check for new commits or unstaged changes
   */
  private async checkForChanges(): Promise<void> {
    try {
      // Check for new commits first
      const log = await this.git.log({ maxCount: 1 });
      const currentHash = log.latest?.hash;

      if (currentHash && currentHash !== this.lastCommitHash) {
        // New commit detected
        const diff = await this.git.diffSummary([`${this.lastCommitHash}..${currentHash}`]);
        const fullDiff = await this.git.diff([`${this.lastCommitHash}..${currentHash}`]);

        const change: GitChange = {
          files: diff.files.map((f) => f.file),
          diff: fullDiff,
          message: log.latest?.message,
          timestamp: new Date(),
        };

        this.lastCommitHash = currentHash;
        this.emit('commit', change);
        return;
      }

      // Check for unstaged changes
      const status = await this.git.status();
      if (status.modified.length > 0 || status.not_added.length > 0) {
        const diff = await this.git.diff();

        const change: GitChange = {
          files: [...status.modified, ...status.not_added],
          diff: diff,
          timestamp: new Date(),
        };

        this.emit('change', change);
      }
    } catch (error: any) {
      console.error('Error checking for changes:', error.message);
    }
  }

  /**
   * Get the current git diff (unstaged changes)
   */
  async getCurrentDiff(): Promise<string> {
    try {
      return await this.git.diff();
    } catch (error) {
      return '';
    }
  }

  /**
   * Get diff between two commits or refs
   */
  async getDiffBetween(from: string, to: string): Promise<string> {
    try {
      return await this.git.diff([`${from}..${to}`]);
    } catch (error) {
      return '';
    }
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
    this.isWatching = false;
    console.log('🪺 Pigeon has flown back to the nest');
  }
}
