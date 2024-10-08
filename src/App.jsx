import React, { useState, useEffect } from "react";
import axios from "axios";
import CalendarHeatmap from "react-calendar-heatmap";
import "../public/styles.css";
import { dateData } from "../public/dateData";
import lineArt from "./assets/Freemi-ai.png";

function App() {
  const [blockCounts, setBlockCounts] = useState({});
  const [quote, setQuote] = useState(""); // The full quote from OpenAI
  const [displayedQuote, setDisplayedQuote] = useState(""); // The quote that is displayed letter by letter
  const [isLoading, setIsLoading] = useState(false); // For showing a loading state
  const [error, setError] = useState(null); // To handle errors
  const [query, setQuery] = useState("");
  const [totalBlocks, setTotalBlocks] = useState(0);

  // Fetch blocked URLs from chrome storage
  useEffect(() => {
    chrome.storage.sync.get("blockCounts", ({ blockCounts }) => {
      setBlockCounts(blockCounts || {});
      setTotalBlocks(sumValues(blockCounts));
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
              content: `you will act as a close therapist providing support on staying focused and avoid distractions like the following websites ${blockedUrls} you dont have to list every website. sound relatable and supportive, but also assertive that continually being distracted will have negative outcomes on life. about 40 words long. sound formal. start the message with an extra random letter at the front`,
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

      // Ensure the response has valid data before using it
      const fullQuote = response.data?.choices?.[0]?.message?.content ?? "";
      if (fullQuote) {
        setQuote(fullQuote.trim()); // Set the quote without adding extra quotes
      } else {
        throw new Error("No quote received");
      }
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
        if (index < quote.length) {
          setDisplayedQuote((prev) => prev + quote.charAt(index));
          index++;
        } else {
          clearInterval(typingInterval); // Stop the interval when the full quote is displayed
        }
      }, 50); // Adjust the speed of typing by changing the interval duration (in milliseconds)

      return () => clearInterval(typingInterval); // Clean up interval on component unmount
    }
  }, [quote]);

  const blockCountEntries = Object.entries(blockCounts);

  const handleSearch = () => {
    if (query) {
      // Redirect to Google search with the query
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(
        query
      )}`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const sumValues = (obj) => {
    return Object.values(obj).reduce((accumulator, currentValue) => {
      return accumulator + currentValue;
    }, 0);
  };

  const formatUrl = (url) => {
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)(?:\/.*)?$/);
    return match ? match[1].split(".")[0] : null;
  };

  return (
    <div className="App">
      <div className="logo-search">
        <h1 className="title">Freemi</h1>
        <div className="search-container">
          <input
            type="text"
            z
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search, without the noise..."
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
        </div>
        <div className="heatmap">
          <CalendarHeatmap
            startDate={new Date("2024-06-01")}
            endDate={new Date("2024-12-31")}
            classForValue={(value) => {
              if (!value) {
                return "color-empty"; // No data
              }
              return `color-scale-${Math.min(Math.ceil(value.count / 5), 4)}`; // Scale based on activity
            }}
            values={dateData}
          />
        </div>
      </div>
      <div>Your insights</div>

      <div className="container">
        <div className="panel">
          {" "}
          <p className="panel-header">Attempted to visit...</p>
          {blockCountEntries.length > 0 ? (
            <ul>
              {blockCountEntries.map(([url, count]) => (
                <li key={url}>
                  <strong>{formatUrl(url)}</strong>
                  &nbsp;{count} {count === 1 ? "time" : "times"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No URLs have been blocked yet.</p>
          )}
          <hr className="separator"></hr>
        </div>

        <div className="panel">
          <div>
            <p className="panel-header">Words from Freemi AI</p>

            {/* Show the loading state */}
            {isLoading && <p>Loading quote...</p>}

            {/* Show error if there is one */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Display the quote letter by letter */}
            <div>
              <p>"{displayedQuote.replace(/^"|"$/g, "")}"</p>{" "}
              {/* Wrap the displayedQuote in quotes here */}
            </div>
          </div>
          <img src={lineArt} alt="line art of Freemi AI" class="bottom-image" />
        </div>
        <div className="panel">
          <p className="panel-header">Freemi has kept you on track... </p>
          <h1 className="big-num">{totalBlocks}</h1>
          <p className="times">{totalBlocks === 1 ? "time" : "times"}</p>
          <hr className="separator"></hr>
          <p className="panel-header">Blocked the most sites on...</p>
          <ul>
            <li>
              <strong>1.</strong> 29/9/2024
            </li>
            <li>
              <strong>2.</strong> 27/9/2024
            </li>
            <li>
              <strong>3.</strong> 28/9/2024
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
