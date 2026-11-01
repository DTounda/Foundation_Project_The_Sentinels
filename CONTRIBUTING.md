# Contributing to MediCheck

Team 5 "The Sentinels", ALU Foundations Project. Contributions are graded on **code commits**, so everyone commits to their own branch.

## Rules

1. **Never push to `main`.** All work goes through a pull request. Stephane (Lead Developer) reviews and merges.
2. Branch name: `feature/<yourname>-<task>`, for example `feature/olivier-search`.
3. Commit small and often. Use clear messages: `feat: ...`, `fix: ...`, `test: ...`, `docs: ...`, `chore: ...`.
4. Your `git config user.email` must match your GitHub account email, otherwise the commits are not linked to you.
5. Open the pull request using the template. One Trello card = one owner = one branch.
6. Backend: run `npm run lint` and `npm test` in `backend/` before opening the PR. CI runs the same checks.

## Workflow

```bash
git checkout main
git pull
git checkout -b feature/<yourname>-<task>
# ... work, then:
git add <files>
git commit -m "feat: short description"
git push -u origin feature/<yourname>-<task>
# open a Pull Request into main on GitHub
```

## Who owns what

| Area | Owner |
| --- | --- |
| Repo structure and README, Express server and DB connection, verify with allergy check, auth, PR review | Stephane |
| `database/schema.sql` (7 tables, from the proposal section 3.5) and `database/seed.sql`, then `GET /medicines/search` | Olivier |
| `POST /reports`, `GET /medicines/:id`, tests of the approved messages file (`backend/src/messages/resultMessages.js`), Postman collection | Ephraim |
| Expo app setup, navigation, result screen; Trello, Teamwork Report, slides, participation sheet | Dorcase |
| Search/scan screen, Figma (share the link) | Tasnim |
| Allergy profile screen, report screen | Annabel |

## Code standards (backend)

- Layers: `routes` (HTTP wiring) -> `controllers` (request/response) -> `services` (business rules) -> `repositories` (SQL only).
- SQL is always parameterised (`?` placeholders). Never build SQL with string concatenation.
- Validate every input at the edge. Return errors using `AppError`, never leak stack traces.
- Passwords are hashed, secrets live in `.env` (see `.env.example`), allergy data is only readable by its owner.
- MediCheck gives **information only**. Results never tell a person to take or stop a medicine.
