(async function () {
  const searchBox = document.getElementById("search-box");
  const resultsEl = document.getElementById("results");

  function showMessage(msg) {
    resultsEl.innerHTML = `<li>${msg}</li>`;
  }

  let pages = [];
  let idx = null;

  try {
    const res = await fetch("/search.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading /search.json`);
    pages = await res.json();

    idx = lunr(function () {
      this.ref("url");
      this.field("title", { boost: 12 });
      this.field("content");

      pages.forEach((p) => this.add(p));
    });

    // Optional: clear any prior message
    resultsEl.innerHTML = "";
  } catch (e) {
    console.error(e);
    showMessage("Could not load search index.");
    return;
  }

  function renderResults(matches) {
    if (!matches.length) {
      showMessage("No results.");
      return;
    }

    const top = matches.slice(0, 25).map((m) => {
      const page = pages.find((p) => p.url === m.ref);
      if (!page) return "";
      return `<li><a href="${page.url}">${page.title}</a></li>`;
    });

    resultsEl.innerHTML = top.join("");
  }

  searchBox.addEventListener("input", () => {
    const q = searchBox.value.trim();
    if (!q) {
      resultsEl.innerHTML = "";
      return;
    }
    const matches = idx.search(q);
    renderResults(matches);
  });
})();
