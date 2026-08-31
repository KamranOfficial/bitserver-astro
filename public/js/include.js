/*
  js/include.js — pure static HTML/CSS/JS component loader.
  No build step, no Python, nothing runs outside the browser.

  Usage in any page:
    <div data-include="/includes/header.html"></div>
    ...
    <div data-include="/includes/footer.html"></div>
    <script src="/js/include.js"
            data-then="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js,/js/hero-scene.js,/js/main.js">
    </script>

  What it does:
    1. Finds every [data-include] element, fetches that URL, and replaces
       the element with the fetched HTML (so header.html/footer.html live
       in ONE file each, reused on every page).
    2. Sets #current-year in the footer automatically.
    3. Once all includes are in the DOM, loads the scripts listed in this
       script tag's data-then="a.js,b.js,c.js" attribute IN ORDER — this
       guarantees main.js (which touches header/footer elements like the
       nav burger and #back-to-top) never runs before those elements exist.
    4. Dispatches a "includes:loaded" event on document if you need a hook
       elsewhere.

  Place this <script> tag where the old bottom-of-body <script> tags used
  to be — it replaces them, it doesn't sit alongside them.
*/
(function () {
  "use strict";

  function fetchInclude(el) {
    var src = el.getAttribute("data-include");
    return fetch(src)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load " + src + " (" + res.status + ")");
        return res.text();
      })
      .then(function (html) {
        var wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();
        // Replace the placeholder with the fetched fragment's children,
        // preserving multiple top-level nodes (header.html/footer.html
        // each contain more than one root element).
        var frag = document.createDocumentFragment();
        while (wrapper.firstChild) frag.appendChild(wrapper.firstChild);
        el.replaceWith(frag);
      })
      .catch(function (err) {
        console.error(err);
        el.outerHTML = "<!-- include failed: " + src + " -->";
      });
  }

  function loadScriptsSequentially(urls, i) {
    i = i || 0;
    if (i >= urls.length) {
      document.dispatchEvent(new Event("includes:loaded"));
      return;
    }
    var url = urls[i].trim();
    if (!url) return loadScriptsSequentially(urls, i + 1);
    var s = document.createElement("script");
    s.src = url;
    s.onload = function () { loadScriptsSequentially(urls, i + 1); };
    s.onerror = function () {
      console.error("Failed to load script: " + url);
      loadScriptsSequentially(urls, i + 1);
    };
    document.body.appendChild(s);
  }

  function init() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-include]"));
    Promise.all(nodes.map(fetchInclude)).then(function () {
      var yearEl = document.getElementById("current-year");
      if (yearEl) yearEl.textContent = new Date().getFullYear();

      var thisScript = document.currentScript || document.querySelector('script[src*="include.js"]');
      var then = thisScript ? thisScript.getAttribute("data-then") : null;
      if (then) {
        loadScriptsSequentially(then.split(","));
      } else {
        document.dispatchEvent(new Event("includes:loaded"));
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
