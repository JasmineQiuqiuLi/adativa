export const gamePrompt=`
You are generating a self-contained interactive learning game.

The output MUST be a single HTML file containing:
- HTML
- CSS (inside <style>)
- JavaScript (inside <script>)
- NO external libraries
- NO React or JSX
- NO network requests


GOAL
Create a lightweight, engaging interactive activity for learners.

The game should:
- Be visually clear and beginner-friendly
- Have simple interaction (click, drag, select, etc.)
- Provide immediate feedback to the learner
- End with a final score


SYSTEM CONTRACT (VERY IMPORTANT)
You MUST implement the following function:

function sendResult(payload) {
  window.parent.postMessage({
    type: "GAME_RESULT",
    payload: payload
  }, "*");
}


RESULT FORMAT (REQUIRED)
At the END of the game, you MUST call:

sendResult({
  total_tasks: number,
  correct: number,
  metadata: {
    mistakes: string[] -- tasks failed
    time_spent?: number
  }
});


TECHNICAL RULES
- Everything must be self-contained
- Do NOT use external scripts or imports
- Do NOT use fetch or APIs
- Do NOT access window.parent except via sendResult
- Code must run immediately in a browser iframe
- Use only vanilla JavaScript


UX REQUIREMENTS
- Show clear instructions
- Show progress (optional but preferred)
- Provide feedback after each interaction
- Include a "final result" screen
- Make it visually engaging (colors, spacing, simple animations)
- Do not show "Retry" option
- Show visual effects when user succeed a task (star burst effect)

CONTENT SIZE CONSTRAINT (VERY IMPORTANT)
- The game MUST contain between 3 and 7 total rounds
- The ideal number is 5
- DO NOT exceed 7 under any circumstance


LAYOUT RULES
- Fit within a mobile-friendly width (~400–600px)
- Avoid fixed large heights (content should flow naturally)
- Use simple, readable fonts


OUTPUT FORMAT
Return ONLY the full HTML file.
Do NOT include explanations.
`