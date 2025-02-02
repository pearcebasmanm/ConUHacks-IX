const { GoogleGenerativeAI } = require("@google/generative-ai");

document.addEventListener("DOMContentLoaded", async () => {
  const quizContent = document.getElementById("quiz-content");
  const loading = document.getElementById("loading");
  const checkAnswersBtn = document.getElementById("checkAnswers");
  const newQuizBtn = document.getElementById("newQuiz");

  async function generateQuiz() {
    loading.style.display = "block";
    quizContent.innerHTML = "";
    checkAnswersBtn.style.display = "none";
    newQuizBtn.style.display = "none";

    try {
      const data = await chrome.storage.local.get("focusedSites");
      const focusedSites = data.focusedSites || [];

      if (focusedSites.length === 0) {
        quizContent.innerHTML =
          "<p>No focused content available for quiz generation.</p>";
        return;
      }

      const questions = await generateQuizQuestions(focusedSites);
      displayQuestions(questions);

      checkAnswersBtn.style.display = "block";
      newQuizBtn.style.display = "block";
    } catch (error) {
      quizContent.innerHTML = `<p>Error generating quiz: ${error.message}</p>`;
    } finally {
      loading.style.display = "none";
    }
  }

  function displayQuestions(questions) {
    quizContent.innerHTML = questions
      .map(
        (q, i) => `
        <div class="question" data-correct="${q.answer}">
          <h3>Question ${i + 1}</h3>
          <p>${q.question}</p>
          <div class="options">
            ${q.options
              .map(
                (opt) => `
              <div>
                <input type="radio" name="q${i}" value="${opt}" id="q${i}${opt}">
                <label for="q${i}${opt}">${opt}</label>
              </div>
            `
              )
              .join("")}
          </div>
          <div class="feedback" style="display: none;"></div>
        </div>
      `
      )
      .join("");
  }

  async function generateQuizQuestions(focusedSites) {
    const { modelName, apiKey } = await chrome.storage.sync.get([
      "modelName",
      "apiKey",
    ]);
    if (!apiKey) throw new Error("API key not found");

    const selectedSites = focusedSites
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    const prompt = createQuizPrompt(selectedSites);

    return modelName === "ChatGPT"
      ? await generateChatGPTQuestions(prompt, apiKey)
      : await generateGeminiQuestions(prompt, apiKey);
  }

  function createQuizPrompt(selectedSites) {
    return `You are a quiz generator. Create multiple choice questions based on the following content. 
Format your response as a valid JSON array where each question object has exactly these properties:
- "question": the question text
- "options": array of 4 possible answers
- "answer": the correct answer (must be one of the options)

Example format:
[
  {
    "question": "What is the main topic discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }
]

Generate one question per topic from this content:
${selectedSites
  .map(
    (site) => `
Topic: ${site.analysis.topics.join(", ")}
Content: ${site.content.substring(0, 200)}
---`
  )
  .join("\n")}`;
  }

  async function generateChatGPTQuestions(prompt, apiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `API request failed: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  async function generateGeminiQuestions(prompt, apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error("Invalid response format");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      validateQuestions(parsed);
      return parsed;
    } catch (e) {
      throw new Error("Failed to generate questions");
    }
  }

  function validateQuestions(questions) {
    if (!Array.isArray(questions)) {
      throw new Error("Invalid response format");
    }

    questions.forEach((q, i) => {
      if (!q.question || !Array.isArray(q.options) || !q.answer) {
        throw new Error(`Invalid question format at position ${i + 1}`);
      }
      if (!q.options.includes(q.answer)) {
        throw new Error(`Invalid answer for question ${i + 1}`);
      }
    });
  }

  checkAnswersBtn.addEventListener("click", () => {
    const questions = document.querySelectorAll(".question");
    let score = 0;

    questions.forEach((q) => {
      const selected = q.querySelector("input:checked");
      if (!selected) return;

      const correct = q.dataset.correct === selected.value;
      const feedback = q.querySelector(".feedback");

      q.classList.remove("correct", "incorrect");
      q.classList.add(correct ? "correct" : "incorrect");

      feedback.classList.remove("correct", "incorrect");
      feedback.classList.add(correct ? "correct" : "incorrect");
      feedback.textContent = correct
        ? "Correct!"
        : `Incorrect. The correct answer is: ${q.dataset.correct}`;
      feedback.style.display = "block";

      if (correct) score++;
    });

    alert(`Your score: ${score}/${questions.length}`);
  });

  newQuizBtn.addEventListener("click", generateQuiz);
  generateQuiz();
});
