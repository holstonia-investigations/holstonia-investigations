// /assets/js/search.js
(function () {
  const SEARCH_JSON_URL = "/search.json";

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  }

  function setQueryParam(name, value) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    history.replaceState(null, "", url.toString());
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function renderResults(resultsList, hits, data) {
    resultsList.innerHTML = "";

    if (!hits || hits.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No results.";
      resultsList.appendChild(li);
      return;
    }

    hits.slice(0, 30).forEach((hit) => {
      const item = dataByUrl(data, hit.ref);
      if (!item) return;

      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.url;
      a.textContent = item.title || item.url;

      li.appendChild(a);
      resultsList.appendChild(li);
    });
  }

  function dataByUrl(data, url) {
    // data items store absolute_url in your generator; keep exact match first
    let found = data.find((p) => p.url === url);
    if (found) return found;

    // fallback: sometimes lunr ref may be relative; normalize comparison
    const stripOrigin = (u) => {
      try { return new URL(u).pathname; } catch { return u; }
    };
    const targetPath = stripOrigin(url);
    return data.find((p) => stripOrigin(p.url) === targetPath);
  }

  fetch(SEARCH_JSON_URL)
    .then((r) => {
      if (!r.ok) throw new Error("Could not load search index.");
      return r.json();
    })
    .then((data) => {
      const searchBox = document.getElementById("search-box");
      const resultsList = document.getElementById("results");

      if (!searchBox || !resultsList) return;

      // Build index
      const idx = lunr(function () {
        this.ref("url");
        this.field("title");
        this.field("content");

        data.forEach((doc) => {
          // Be defensive: ensure fields exist
          this.add({
            url: doc.url || "",
            title: doc.title || "",
            content: doc.content || ""
          });
        });
      });

      function runSearch(query) {
        const q = (query || "").trim();
        setQueryParam("q", q);

        if (!q) {
          resultsList.innerHTML = "";
          return;
        }

        // Lunr query: keep it forgiving
        let hits = [];
        try {
          hits = idx.search(q);
        } catch (e) {
          // If user types something lunr can't parse, fall back to escaped term
          hits = idx.search(escapeHtml(q));
        }

        renderResults(resultsList, hits, data);
      }

      // Support ?q= on load (enables SearchAction)
      const initialQ = getQueryParam("q").trim();
      if (initialQ) {
        searchBox.value = initialQ;
        runSearch(initialQ);
      }

      // Search as you type
      searchBox.addEventListener("input", () => runSearch(searchBox.value));

      // Search on Enter
      searchBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          runSearch(searchBox.value);
        }
      });
    })
    .catch((err) => {
      // If something goes wrong, fail gracefully
      const resultsList = document.getElementById("results");
      if (resultsList) {
        resultsList.innerHTML = `<li>${escapeHtml(err.message || "Search error.")}</li>`;
      }
      // Also log for debugging
      console.error(err);
    });
})();
