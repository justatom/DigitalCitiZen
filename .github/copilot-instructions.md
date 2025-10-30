## Purpose
This file gives concise, actionable guidance for AI coding agents working on the DigitalCitiZen static site.

## Big-picture
- Project is a small static front-end site (no bundler). Entry point: `index.html`.
- Core JavaScript modules (load order matters): `js/lessons.js` -> `js/quiz.js` -> `js/app.js`.
- `LESSONS_DATA` (defined in `js/lessons.js`) is the single source of lesson content and quizzing data.
- Progress is persisted in `localStorage` under key `digitalCitizenProgress` and used by `DigitalCitizenApp` in `js/app.js`.

## Key globals & integration points
- `LESSONS_DATA` — array of lesson objects (see `js/lessons.js`).
- `app` — instance of `DigitalCitizenApp` (defined in `js/app.js`). Methods: `init()`, `updateProgress(lessonId, score)`, `renderLessons()`.
- `quizManager` — instance of `QuizManager` (defined in `js/quiz.js`). Use `quizManager.renderQuiz(...)` and `quizManager.submitQuiz()`.
- `passwordBallGame` — mini-game used by some lessons (see `js/quiz.js`).
- DOM anchors: `#lessonsGrid`, `#modal`, `#modalContent`, `#progressFill`, `#progressStats`, `#totalScore`, `#certificateModal`.

## How data and flows work (practical notes for edits)
- Lessons: `LESSONS_DATA` entries are rendered as cards by `app.renderLessons()`; clicking a card calls `app.openLesson(lessonId)` which injects `lesson.content` HTML into `#modalContent` and appends the quiz via `quizManager.renderQuiz(lesson.quiz, lessonId)`.
- Quizzes: supported question `type` values: `single`, `multiple`, `matching`, `fill`. The quiz evaluator is in `quiz.js` — it updates visuals and calls `app.updateProgress(lessonId, percentage)`.
- Passing threshold: quizzes consider >= 80% a pass; the app grants a certificate when all lessons are completed and `totalScore >= 80`.

## Conventions and patterns to follow (do not change lightly)
- File/script order must remain: `lessons.js` provides `LESSONS_DATA` required by `quiz.js` and `app.js`.
- Lesson IDs are numeric and used as stable identifiers; keep them unique and sequential to avoid UI inconsistencies.
- Lesson `content` is HTML string (template literal). Keep markup self-contained and avoid adding external script tags inside `content`.
- Quizzes:
  - `single`: `correct` is an integer index
  - `multiple`: `correct` is an array of integer indices
  - `matching`: `pairs` is an array of { left, right } objects; the renderer shuffles right-side text and uses element dataset values to evaluate
  - `fill`: question must include `___________` placeholder; `answer` is used for validation (case-insensitive, substring match allowed)

Example: to add a new single-choice question to a lesson quiz:

```js
// inside LESSONS_DATA lesson object
quiz: [ { type: 'single', question: 'This is?', options: ['A','B','C'], correct: 0 } ]
```

## Developer workflows (what is discoverable here)
- There is no `package.json` or build pipeline. To preview locally open `index.html` in a browser or serve the folder with a static server (e.g. `python -m http.server 8000`).
- Persistence: to reset user state in development, clear localStorage key `digitalCitizenProgress` or call `localStorage.removeItem('digitalCitizenProgress')` in DevTools console.

## Safe edit checklist for lessons / quizzes
1. Add new `LESSONS_DATA` entry with a unique `id`.
2. Ensure `quiz` entries use supported `type` and correct answer shapes (see above).
3. Keep `content` localized (this project contains Thai content) and avoid adding external JS inside `content` strings.
4. Keep script order unchanged in `index.html`.
5. Manually open the site and run through the lesson + quiz to verify behaviour (modal, scoring, certificate).

## Quick debugging tips
- If lessons don't render: confirm `LESSONS_DATA` exists and `js/lessons.js` is loaded before `app.js`.
- If quizzes don't score correctly: look at `quizManager.submitQuiz()` in `js/quiz.js` — matching and index-based scoring are implemented there.
- If progress doesn't persist: inspect `localStorage.digitalCitizenProgress` in DevTools.
- To test certificate flow: mark all lessons completed in `localStorage` (or complete quizzes) and ensure `totalScore >= 80`.

## What not to change without coordination
- Global variable names (`LESSONS_DATA`, `app`, `quizManager`, `passwordBallGame`) — many UI hooks depend on them.
- Quiz evaluation rules in `quiz.js` — editing may change scoring thresholds and certificate eligibility.

## If you need to extend
- Prefer adding new entries to `LESSONS_DATA` rather than changing existing lesson IDs.
- For larger features (routing, localization toggles, adding a build step) open an issue and outline backwards-compatible migration steps: ensure script load order, persist key names, and add tests for quiz evaluation.

---
If any section above is unclear or you want more examples (e.g., a ready-to-add lesson template or a unit-test sketch for quiz evaluation), tell me which area and I will expand it.
