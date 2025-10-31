# Passenger Watch Command - BDD on Steroids

The `watch` command gives you Passenger - real-time feedback as you work on an issue, keeping requirements as your north star.

## What It Does

Passenger acts like **BDD on steroids** - it keeps the issue requirements as your "north star" and provides continuous feedback as you code, ensuring you stay focused on the actual behavior and outcomes required.

## How It Works

```bash
# Start watching for changes on an issue
passenger watch <issue-id>

# Examples
passenger watch 123           # Github issue #123
passenger watch PROJ-456      # Jira ticket PROJ-456
passenger watch abc123def     # Linear issue
```

## The Development Loop

```
┌─────────────────────────────────────────────────────────┐
│  1. You start watching an issue                         │
│     $ passenger watch 123                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. Passenger fetches the issue details                 │
│     - Title & Description                               │
│     - Acceptance Criteria (if available)                │
│     - User Stories (if analyzed)                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. You code and make changes                           │
│     - Edit files                                        │
│     - Passenger watches silently                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. You commit (or save changes)                        │
│     $ git commit -m "Add login form"                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  5. Passenger analyzes your changes                     │
│     - Reads git diff                                    │
│     - Compares to issue requirements                    │
│     - Sends to LLM for analysis                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  6. You get conversational feedback                     │
│     "Good start on the login form! I notice you're      │
│      handling password validation. The acceptance       │
│      criteria mentions 'remember me' - want to plan     │
│      for that now?"                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
                   (Loop back to step 3)
```

## Example Session

```bash
$ export ISSUE_TRACKER_SYSTEM=github
$ export LLM_SYSTEM=gemini
$ passenger watch 123

🎯 Fetching issue details...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NORTH STAR: Issue #123
📋 Add user authentication
📊 Status: open
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Description:
Users should be able to log in with email and password...

✅ Acceptance Criteria:
   1. Users can log in with email/password
   2. Password must be hashed
   3. "Remember me" functionality
   4. OAuth support (Google, GitHub)

🤖 Using gemini for feedback
📁 Watching: /Users/you/project

👀 Watching for changes...

[You code and commit]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 New commit detected
💬 "Add login form with email/password fields"
📝 Files changed: src/components/LoginForm.tsx, src/api/auth.ts

🤖 Passenger's feedback:

Great start! I see you've added the login form with email and password
fields, which directly addresses the first acceptance criterion. I notice
you're sending the password as plain text in the API call - the second
criterion requires password hashing. Also, I don't see the "remember me"
checkbox yet from criterion #3. Want to tackle the hashing first or add
the checkbox?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👂 Waiting for your next move...

[You add bcrypt and commit]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 New commit detected
💬 "Add bcrypt hashing for passwords"
📝 Files changed: src/api/auth.ts

🤖 Passenger's feedback:

Perfect! Now you're hashing passwords with bcrypt, which satisfies
criterion #2. The implementation looks solid. Still missing the
"remember me" functionality and OAuth support from the requirements.
Since OAuth is a bigger lift, maybe tackle the remember me checkbox next?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👂 Waiting for your next move...

[Ctrl+C to stop]

👋 Stopping Passenger...

📊 Session Summary for Issue #123

Total interactions: 2
- Commits: 2
- Changes: 0

Keep up the great work! 🚀
```

## Features

### 1. **Real-Time Feedback**
- Detects both commits AND file changes (even before you commit)
- Provides feedback within seconds

### 2. **BDD-Focused Analysis**
- Compares your changes to acceptance criteria
- Reminds you about user stories
- Keeps you focused on behavior, not implementation

### 3. **Conversational Tone**
- Feels like pair programming
- Friendly, not critical
- Positive reinforcement when things look good

### 4. **Context Retention**
- Remembers previous feedback
- Won't repeat itself
- Builds on the conversation

### 5. **Works with Any Issue Tracker**
- Github, Jira, Linear, Asana, Trello
- Uses the normalized issue format

### 6. **Choose Your LLM**
- Gemini (default)
- Claude
- OpenAI

## Configuration

Set your preferences:

```bash
# Required: Choose your issue tracker
export ISSUE_TRACKER_SYSTEM=github  # or jira, linear, asana, trello

# Required: Choose your LLM
export LLM_SYSTEM=gemini  # or claude, openai

# Required: Set the appropriate API keys
export GEMINI_API_KEY=your-key      # if using gemini
export ANTHROPIC_API_KEY=your-key   # if using claude
export OPENAI_API_KEY=your-key      # if using openai

# Issue tracker specific (example for Github)
export GITHUB_OWNER=your-username
export GITHUB_REPO=your-repo
export GITHUB_PRIVATE_KEY_PATH=/path/to/key.pem
```

Or use the init command:
```bash
passenger init
```

## Advanced Usage

### Watch a specific directory
```bash
passenger watch 123 --path /path/to/project
```

### Use with different LLMs
```bash
# Try Claude for more nuanced feedback
LLM_SYSTEM=claude passenger watch 123

# Try OpenAI
LLM_SYSTEM=openai passenger watch 123
```

## What Passenger Watches

**Triggers feedback on:**
- ✅ Git commits
- ✅ File changes (after 3 seconds of no activity)

**Ignores:**
- ❌ `node_modules/`
- ❌ `.git/`
- ❌ `dist/` and `build/`
- ❌ `.cache/`
- ❌ Dotfiles

## Tips for Best Results

### 1. **Use Good Issue Descriptions**
The better your issue description, the better Passenger's feedback:

```
✅ Good:
"Add user login with email/password. Must hash passwords with bcrypt.
Include 'remember me' checkbox that sets a 30-day cookie."

❌ Bad:
"login stuff"
```

### 2. **Enable Issue Analysis**
When Passenger fetches the issue, if you're using Github, it will automatically analyze the issue with your LLM to extract:
- Acceptance criteria
- User stories
- Missing information

This makes feedback much more specific!

### 3. **Commit Frequently**
Smaller, more frequent commits = more frequent feedback = better guidance

### 4. **Use Descriptive Commit Messages**
Passenger reads your commit messages:
```
✅ Good: "Add password hashing with bcrypt"
❌ Bad: "wip"
```

### 5. **Let Passenger Guide You**
Passenger's strength is pointing out things you might have missed:
- Edge cases
- Security concerns
- Incomplete requirements
- Potential bugs

## Stopping the Watch

Press `Ctrl+C` to stop watching. Passenger will show you a session summary.

## What Makes This "BDD on Steroids"?

Traditional BDD:
- Write tests first
- Implement to make tests pass
- Tests define behavior

**Passenger's BDD on Steroids:**
- Issue requirements are the "north star"
- LLM continuously checks alignment with requirements
- Focuses on **behavior and outcomes**, not code style
- Catches missed requirements in real-time
- Like having Passenger guide you through the journey

## Troubleshooting

### "Not a git repository"
Passenger requires a git repository. Initialize one:
```bash
git init
```

### "Issue not found"
Check your issue tracker configuration:
```bash
echo $ISSUE_TRACKER_SYSTEM
echo $GITHUB_OWNER  # or other tracker vars
```

### "LLM API error"
Check your API key:
```bash
echo $GEMINI_API_KEY  # or ANTHROPIC_API_KEY, OPENAI_API_KEY
```

### Feedback is too slow
LLM responses can take a few seconds. If it's too slow:
- Try a faster LLM (Gemini is usually fastest)
- Check your internet connection
- Reduce the size of your commits (smaller diffs = faster analysis)

## Future Enhancements

Planned features:
- 🔮 Detect when tickets have issues (missing info, edge cases)
- 🔮 Suggest breaking down large issues
- 🔮 Integration with CI/CD
- 🔮 Team collaboration features
- 🔮 Custom feedback styles/personas

## Philosophy

Passenger is built on the belief that:

1. **Context is everything** - Keeping the issue in mind prevents scope creep
2. **Real-time feedback works** - Catching issues early saves time
3. **BDD should be continuous** - Not just at test-writing time
4. **AI can guide development** - Passenger keeps you on track
5. **Behavior > Implementation** - Focus on what the code should do, not how

---

Happy coding with Passenger! 🚀
