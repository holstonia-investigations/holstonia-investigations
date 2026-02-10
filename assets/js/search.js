fetch('/search.json')
  .then(response => response.json())
  .then(data => {

    const idx = lunr(function () {
      this.ref('url');
      this.field('title');
      this.field('content');

      data.forEach(doc => this.add(doc));
    });

    const searchBox = document.getElementById('search-box');
    const resultsList = document.getElementById('results');

    searchBox.addEventListener('input', function () {

      const results = idx.search(this.value);

      resultsList.innerHTML = '';

      results.forEach(result => {
        const item = data.find(page => page.url === result.ref);

        const li = document.createElement('li');
        const a = document.createElement('a');

        a.href = item.url;
        a.textContent = item.title;

        li.appendChild(a);
        resultsList.appendChild(li);
      });

    });

  });
