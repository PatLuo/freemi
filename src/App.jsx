import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [blockCounts, setBlockCounts] = useState({});
  const [quote, setQuote] = useState(""); // The full quote from OpenAI
  const [displayedQuote, setDisplayedQuote] = useState(""); // The quote that is displayed letter by letter
  const [isLoading, setIsLoading] = useState(false); // For showing a loading state
  const [error, setError] = useState(null); // To handle errors

  // Fetch blocked URLs from chrome storage
  useEffect(() => {
    chrome.storage.sync.get("blockCounts", ({ blockCounts }) => {
      setBlockCounts(blockCounts || {});
    });
  }, []);

  // Automatically generate the quote when blockCounts are updated
  useEffect(() => {
    if (Object.keys(blockCounts).length > 0) {
      generateQuote(); // Generate the quote after getting the blocked URLs
    }
  }, [blockCounts]);

  // Function to handle generating a motivational quote based on blocked websites
  const generateQuote = async () => {
    setIsLoading(true); // Start loading before API request
    setError(null); // Reset any previous errors
    setQuote(""); // Clear previous quote
    setDisplayedQuote(""); // Clear the displayed quote for typing effect

    const blockedUrls = Object.keys(blockCounts).join(", "); // Get blocked URLs as a string

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4", // Use the correct model
          messages: [
            {
              role: "user",
              content: `Generate a motivational quote based on avoiding these websites: ${blockedUrls}. Make it positive and encouraging.`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_APP_API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Organization": import.meta.env.VITE_APP_ORG_ID,
          },
        }
      );

      // Get and set the full quote from OpenAI
      const fullQuote = response.data.choices[0].message.content;
      setQuote(fullQuote);

    } catch (error) {
      console.error("Error fetching response from OpenAI:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false); // End loading after API request
    }
  };

  // Typing effect to display the quote one letter at a time
  useEffect(() => {
    if (quote) {
      let index = 0;
      const typingInterval = setInterval(() => {
        setDisplayedQuote((prev) => prev + quote[index]);
        index++;
        if (index === quote.length) {
          clearInterval(typingInterval); // Stop the interval when the full quote is displayed
        }
      }, 50); // Adjust the speed of typing by changing the interval duration (in milliseconds)
    }
  }, [quote]);

  const blockCountEntries = Object.entries(blockCounts);

  return (
    <div className="App">
      <h1>Despite blocking these sites, you've attempted to visit...</h1>
      {blockCountEntries.length > 0 ? (
        <ul>
          {blockCountEntries.map(([url, count]) => (
            <li key={url}>
              {url}: {count} time(s) blocked
            </li>
          ))}
        </ul>
      ) : (
        <p>No URLs have been blocked yet.</p>
      )}

      <div>
        <h2>Motivational Quote</h2>

        {/* Show the loading state */}
        {isLoading && <p>Loading quote...</p>}

        {/* Show error if there is one */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Display the quote letter by letter */}
        <div>
          <p>{displayedQuote}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
