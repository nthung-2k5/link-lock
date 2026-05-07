<script lang="ts">
  import { onMount } from "svelte";
  import { decoder } from "../api";

  let hiddenUrlText = $state("");
  let bookmarkTitle = $state("");
  let bookmarkUrlText = $state("");
  let decryptBookmarkDisguise = $state("https://gmail.com");

  let statusText = $state("");
  let statusOpacity = $state(0);

  let outputHref = $state("");
  let outputTitle = $state("No Disguised Bookmark Created Yet");
  let outputDisabled = $state(true);

  // The huge bookmarklet logic copied directly
  let decryptBookmarklet = $derived(`javascript:(() => {
var b64 = (() => {
  function generateIndexDict(a) {
    let result = {};
    for (let i = 0; i < a.length; i++) {
      result[a[i]] = i;
    }
    return result;
  }

  const _a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const _aRev = generateIndexDict(_a);
  _aRev["-"] = _aRev["+"];
  _aRev["_"] = _aRev["/"];

  const _enc = new TextEncoder("utf-8");
  const _dec = new TextDecoder("utf-8");

  return {

    decode: function(s) {
      return this.binaryToAscii(this.base64ToBinary(s));
    },

    encode: function(s) {
      return this.binaryToBase64(this.asciiToBinary(s));
    },

    asciiToBinary: function(text) {
      return _enc.encode(text);
    },


    binaryToAscii: function(binary) {
      return _dec.decode(binary);
    },


    binaryToBase64: function(originalBytes) {
      let length = originalBytes.length;
      let added = (length % 3 == 0) ? 0 : (3 - length % 3);
      let bytes = new Uint8Array(length + added);
      bytes.set(originalBytes);

      let output = "";
      for (let i = 0; i < bytes.length; i += 3) {
        output += _a[ bytes[i] >>> 2 ];
        output += _a[ ((bytes[i] & 0x3) << 4) | (bytes[i + 1] >>> 4) ];
        output += _a[ ((bytes[i + 1] & 0xF) << 2) | (bytes[i + 2] >>> 6) ];
        output += _a[ bytes[i + 2] & 0x3F ];
      }

      if (added > 0) {
        output = output.slice(0, -added) + ("=".repeat(added));
      }

      return output;
    },

    base64ToBinary: function(s) {
      let bytes = [];

      if (s.length % 4 == 1) {
        throw "Invalid base64 input";
      } else if (s.length % 4 != 0) {
        s += "=".repeat(4 - (s.length % 4));
      }

      for (let i = 0; i <= (s.length - 4); i += 4) {
        for (let j = 0; j < 4; j++) {
          if (s[i + j] != "=" && !(s[i + j] in _aRev)) {
            throw "Invalid base64 input";
          } else if (s[i + j] == "=" && Math.abs(s.length - (i + j)) > 2) {
            throw "Invalid base64 input";
          }
        }

        bytes.push((_aRev[s[i]] << 2) | (_aRev[s[i + 1]] >>> 4));
        if (s[i + 2] != "=") {
          bytes.push(((_aRev[s[i + 1]] & 0xF) << 4) | (_aRev[s[i + 2]] >>> 2));
        }
        if (s[i + 3] != "=") {
          bytes.push(((_aRev[s[i + 2]] & 0x3) << 6) | _aRev[s[i + 3]]);
        }
      }

      return new Uint8Array(bytes);
    }

  }
})();

const hash = window.location.hash.slice(1);
try {
  const decoded = b64.decode(hash);
  const params = JSON.parse(decoded);
  if (params.unencrypted) {
    window.location.href = params.url;
  } else {
    window.location.href = "https://jstrieb.github.io/link-lock/" + window.location.hash;
  }
} catch {
  window.location.replace("${decryptBookmarkDisguise}");
}

})();`);

  onMount(() => {
    if (window.location.hash && window.location.hash !== "#/hidden") {
      hiddenUrlText = `https://jstrieb.github.io/link-lock/${window.location.hash}`;
    }
  });

  function error(msg: string) {
    statusText = msg;
    statusOpacity = 1;
  }

  async function onHide() {
    let hiddenUrl;
    try {
      hiddenUrl = new URL(hiddenUrlText);
    } catch {
      error('Hidden URL is not valid. Make sure it includes "https://" too!');
      return;
    }

    let bookmarkUrl;
    try {
      bookmarkUrl = new URL(bookmarkUrlText);
    } catch {
      error('Bookmark URL is not valid. Make sure it includes "https://" too!');
      return;
    }

    let hash = hiddenUrl.hash.slice(1);
    try {
      let _ = JSON.parse(decoder.decode(Uint8Array.fromBase64(hash, { alphabet: "base64url" })));
    } catch {
      error(
        'The hidden URL appears corrupted. It must be a password-protected Link Lock URL. <a href="https://jstrieb.github.io/link-lock">Click here to add a password.</a>'
      );
      return;
    }

    bookmarkUrl.hash = hiddenUrl.hash;
    outputHref = bookmarkUrl.toString();
    outputDisabled = false;
    outputTitle = bookmarkTitle || bookmarkUrl.hostname;

    error("Bookmark created below.");

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }

  async function randomLink() {
    try {
      let page = await fetch(
        "https://en.wikipedia.org/w/api.php?" +
          "format=json" +
          "&action=query" +
          "&generator=random" +
          "&grnnamespace=0" +
          "&prop=info" +
          "&inprop=url" +
          "&origin=*"
      )
        .then((r) => r.json())
        .then((d) => {
          let pages = d.query.pages;
          return pages[Object.keys(pages)[0]];
        });

      bookmarkUrlText = page.canonicalurl;
      bookmarkTitle = page.title;
    } catch (e) {
      error("Failed to fetch random link from Wikipedia.");
    }
  }
</script>

<svelte:head>
  <title>Create Hidden Bookmarks</title>
</svelte:head>

<!-- View on GitHub ribbon -->
<a href="https://github.com/jstrieb/link-lock" target="_blank">
  <!-- Use public folder path for image -->
  <img class="ribbon" src="/corner-ribbon-minified.svg" alt="View on GitHub" />
</a>

<noscript>
  <div class="red-border">
    <p>
      If you are seeing this, it means that you have JavaScript disabled. Please
      enable JavaScript to access the locked link.
    </p>

    <p>
      This application is entirely programmed in JavaScript. This was done
      intentionally, so that all encryption and decryption happens client-side.
      This means the code runs as a distributed application, relying only on
      GitHub Pages for infrastructure. It also means that no data about locked
      links is ever stored on a server. The code is designed to be auditable so
      users can investigate what is happening behind the scenes.
    </p>

    <p>
      If you still want to run the application, I encourage you to clone the <a
        href="https://github.com/jstrieb/link-lock">source code on GitHub</a
      >. That way you can disable JavaScript only for trusted files on your
      local machine.
    </p>
  </div>
</noscript>

<h1>Create Hidden Bookmarks</h1>
<p>
  It is possible to protect bookmarks with a password using <a
    href="https://jstrieb.github.io/link-lock"
    target="_blank">Link Lock</a
  >, but a link that needs a password may appear suspicious to someone else
  seeing it. Hidden bookmarks solve this problem.
</p>
<p>
  Hidden bookmarks are disguised to be identical to normal bookmarks, with one
  exception: clicking them in the right order will open a hidden link. <b
    >To open the hidden link, click the disguised bookmark first, and then click
    the decrypt bookmark next.</b
  > The same decrypt bookmark works for all disguised bookmarks.
</p>
<p>
  Read more about how hidden bookmarks work <a
    target="_blank"
    href="https://jstrieb.github.io/projects/hidden-bookmarks/">here</a
  >.
</p>

<p>Here is how to create hidden bookmarks:</p>
<ol>
  <li>
    <a href="https://jstrieb.github.io/link-lock"
      >Add a password to the hidden link</a
    > if you have not done so already.
  </li>
  <li>
    Drag the "decrypt" bookmark below to your bookmarks bar.

    <ul>
      <li style="margin-bottom: 0.5em;">
        Clicking the decrypt bookmark goes to <code>{decryptBookmarkDisguise}</code> unless the
        current page is a disguised link. Use the "advanced" options to have it
        go somewhere else instead.
      </li>
    </ul>

    <details>
      <summary id="advanced-label" style="margin-top: 0em;">advanced</summary>
      <div class="advanced" id="advanced">
        <label for="decrypt-bookmark-disguise"
          >decoy location for decrypt bookmark</label
        >
        <div class="inline-button-container">
          <input
            type="text"
            id="decrypt-bookmark-disguise"
            bind:value={decryptBookmarkDisguise}
          />
        </div>
      </div>
    </details>

    <p>
      <a
        class="bookmark"
        id="decrypt-bookmark"
        onclick={(e) => e.preventDefault()}
        href={decryptBookmarklet}>Decrypt</a
      >
    </p>
  </li>
  <li>
    It may be a good idea to rename the decrypt bookmark to "Gmail" by right
    clicking, and either clicking "Edit" or "Properties."
  </li>
  <li>
    Fill in the hidden URL below (if it is not already filled in). Then, fill in
    the disguised bookmark name and link.
    <ul>
      <li>
        There is a button to generate random disguise links if you do not want
        to pick your own.
      </li>
    </ul>
  </li>
  <li>
    Press the button to create the bookmark. Once created, drag the disguised
    bookmark to your bookmarks bar.
  </li>
</ol>

<hr />

<div class="form">
  <label for="encrypted-url">hidden url</label>
  <input
    type="url"
    id="encrypted-url"
    bind:value={hiddenUrlText}
    oninput={() => (statusOpacity = 0)}
  />
  <label for="bookmark-title">disguised bookmark name</label>
  <input type="text" id="bookmark-title" bind:value={bookmarkTitle} />
  <label for="bookmark-url">bookmark disguise url</label>
  <input type="url" id="bookmark-url" bind:value={bookmarkUrlText} required />
  <button onclick={onHide}>Create Disguised Bookmark</button>
  <button onclick={randomLink}>Use A Random Disguise Link</button>
  <p class="alert" style="opacity: {statusOpacity}">
    {@html statusText || "INVISIBLE"}
  </p>
</div>

<hr />

<!-- Output area -->
<div class="output">
  <label for="output" style="margin-bottom: 1em;">output</label>
  <a
    class="bookmark"
    href={outputHref || "#"}
    onclick={(e) => e.preventDefault()}
    aria-disabled={outputDisabled}
    id="output">{outputTitle}</a
  >
  <p>Drag the disguised bookmark above to the bookmarks bar.</p>
  <p>
    To access the hidden link, click the disguised bookmark, then the decrypt
    bookmark (which may have been renamed to "Gmail").
  </p>
</div>

<!-- Page footer -->
<footer>
  <hr />
  <p class="copyright">
    Created by <a href="https://jstrieb.github.io">Jacob Strieb</a>.
  </p>
</footer>
