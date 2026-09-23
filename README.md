# CLPE Part Two Validated Quiz

A GitHub Pages-ready interactive study site built from the uploaded Part Two past-question files and validated against **LOCAL PREACHERS BOOK 2**.

## Question bank

Total objective questions: **540**

- Old Testament: 106
- New Testament: 82
- Doctrine: 107
- Liturgics: 110
- Methodist Studies: 38
- Church & Society: 97

Validation summary:
- Validated: 459
- Corrected/repaired: 2
- Flagged/unscored: 79

## Publish on GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, `README.md`, and the `images` folder to the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Choose `main` and `/(root)`, then save.

The site is mobile responsive and requires no server or build step.

## Analytics and retry behavior

This version includes Google Analytics 4 using measurement ID `G-12L5TL43FK`. It tracks quiz starts, answers, completions, subject/year/order selections, restarts, and individual wrong-question retries.

When a learner answers a scored question incorrectly, a **Try this question again** button appears. It clears only that question and removes that failed attempt from the displayed score denominator before the learner retries.