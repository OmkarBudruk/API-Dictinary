const searchButton = document.getElementById("searchButton");
const sentenceInput = document.getElementById("sentenceInput");
const resultsContainer = document.getElementById("results");

searchButton.addEventListener("click", async () => {
  const sentence = sentenceInput.value.trim();
  if (!sentence) {
    alert("Please enter a sentence.");
    return;
  }

  resultsContainer.innerHTML = ""; // Clear previous results

  const keywords = extractKeywords(sentence);
  if (keywords.length === 0) {
    alert("No valid keywords found in the sentence.");
    return;
  }

  for (const keyword of keywords) {
    const keywordSection = document.createElement("div");
    keywordSection.className = "result";

    const title = document.createElement("h2");
    title.textContent = `Results for "${keyword}":`;
    keywordSection.appendChild(title);

    const unifiedResult = document.createElement("p");
    unifiedResult.textContent = "Loading unified result...";
    keywordSection.appendChild(unifiedResult);

    resultsContainer.appendChild(keywordSection);

    try {
      const dictionaryDefinition = await fetchDictionaryDefinition(keyword);
      const wikipediaDescription = await fetchWikipediaDescription(keyword);
      const stackExchangeResults = await fetchStackExchangeResults(keyword);

      if (dictionaryDefinition || wikipediaDescription || stackExchangeResults) {
        const finalResult = dictionaryDefinition || wikipediaDescription || stackExchangeResults;
        unifiedResult.textContent = `Best Result: ${finalResult}`;
      } else {
        unifiedResult.textContent = "No relevant information found.";
      }
    } catch (error) {
      console.error("Error:", error);
      unifiedResult.textContent = "Error fetching data.";
    }
  }
});

// Function to extract keywords from a sentence
function extractKeywords(sentence) {
  const stopwords = ["is", "the", "a", "an", "of", "and", "to", "with", "in", "on", "at", "for", "by"];
  return sentence
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 2 && !stopwords.includes(word));
}

// Function to fetch data from Dictionary API
async function fetchDictionaryDefinition(keyword) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${keyword}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data[0]?.meanings[0]?.definitions[0]?.definition || null;
  } catch {
    return null;
  }
}

// Function to fetch data from Wikipedia API
async function fetchWikipediaDescription(keyword) {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&titles=${keyword}&format=json&exintro=1&explaintext=1&origin=*`
    );
    if (!response.ok) return null;

    const data = await response.json();
    const pages = data.query.pages;
    const firstPageKey = Object.keys(pages)[0];
    return pages[firstPageKey]?.extract || null;
  } catch {
    return null;
  }
}

// Function to fetch data from Stack Exchange API (search for questions related to the keyword)
async function fetchStackExchangeResults(keyword) {
  try {
    const response = await fetch(
      `https://api.stackexchange.com/2.3/search?order=desc&sort=activity&intitle=${keyword}&site=stackoverflow`
    );
    if (!response.ok) return null;

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const topQuestion = data.items[0];
      const questionTitle = topQuestion.title;
      const questionLink = topQuestion.link;
      return `Stack Overflow: ${questionTitle} - <a href="${questionLink}" target="_blank">View Question</a>`;
    }
    return "No related question found on Stack Overflow.";
  } catch {
    return "Error fetching Stack Overflow data.";
  }
}
