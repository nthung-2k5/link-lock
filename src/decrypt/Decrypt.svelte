<script lang="ts">
  import { onMount } from "svelte";
  import { apiVersions, decoder } from "../api";

  let urlText = $state("");
  let password = $state("");
  let decryptedUrl = $state("");
  let statusText = $state("");
  let statusOpacity = $state(0);
  let copyAlertText = $state("");
  let copyAlertOpacity = $state(0);

  onMount(() => {
    if (window.location.hash && window.location.hash !== "#/decrypt") {
      urlText = `${window.location.origin}${window.location.hash}`;
    }
  });

  function error(msg: string) {
    statusText = msg;
    statusOpacity = 1;
  }

  async function onDecrypt() {
    let url;
    try {
      url = new URL(urlText);
    } catch {
      error(
        'Entered text is not a valid URL. Make sure it includes "https://" too!'
      );
      return;
    }

    let params;
    try {
      params = JSON.parse(decoder.decode(Uint8Array.fromBase64(url.hash.slice(1), { alphabet: "base64url" })));
    } catch {
      error("The link appears corrupted.");
      return;
    }

    if (!("v" in params && "e" in params)) {
      error(
        "The link appears corrupted. The encoded URL is missing necessary parameters."
      );
      return;
    }

    if (!(params["v"] in apiVersions)) {
      error("Unsupported API version. The link may be corrupted.");
      return;
    }

    const api = apiVersions[params["v"]];

    let encryptedData: Uint8Array<ArrayBuffer>;
    let saltData: Uint8Array<ArrayBuffer> | null = null;
    let ivData: Uint8Array<ArrayBuffer> | null = null;

    try {
      encryptedData = Uint8Array.fromBase64(params["e"]);
      saltData = "s" in params ? Uint8Array.fromBase64(params["s"]) : null;
      ivData = "i" in params ? Uint8Array.fromBase64(params["i"]) : null;
    } catch {
      error("The link appears corrupted.");
      return;
    }

    let decrypted;
    try {
      decrypted = await api.decrypt(encryptedData, password, saltData, ivData);
    } catch {
      error("Incorrect password!");
      return;
    }

    decryptedUrl = decrypted;
    error("Decrypted!");
  }

  function onCopy() {
    navigator.clipboard.writeText(decryptedUrl).then(() => {
      copyAlertText = `Copied ${decryptedUrl.length} characters`;
      copyAlertOpacity = 1;
      setTimeout(() => {
        copyAlertOpacity = 0;
      }, 3000);
    });
  }
</script>

<svelte:head>
  <title>Decrypt Link Lock URLs</title>
</svelte:head>

<a href="https://github.com/jstrieb/link-lock" target="_blank">
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

<h1>Decrypt Link Lock URLs</h1>
<p>
  This application is for decrypting <a
    href="https://github.com/jstrieb/link-lock"
    target="_blank">Link Lock</a
  >
  URLs without automatically redirecting. This is useful if you do not trust the
  source of an encrypted URL. It is also useful if the URL uses a blocked
  protocol like <code>javascript:</code>, for example.
</p>

<p>
  This page is also useful if you think you have received a locked link, but it
  uses another domain, instead of <code>jstrieb.github.io</code>. This may be
  done as a means to <a
    target="_blank"
    href="https://github.com/jstrieb/link-lock/#evading-censorship"
    >evade censorship</a
  >.
</p>

<hr />

<div class="form">
  <label for="encrypted-url">encrypted url</label>
  <input
    type="url"
    id="encrypted-url"
    bind:value={urlText}
    oninput={() => (statusOpacity = 0)}
  />
  <label for="password">password</label>
  <!-- svelte-ignore a11y_autofocus -->
  <input type="password" id="password" bind:value={password} autofocus />
  <button onclick={onDecrypt}>Decrypt</button>
  <p class="alert" style="opacity: {statusOpacity}">
    {statusText || "INVISIBLE"}
  </p>
</div>

<hr />

<!-- Output area -->
<div class="output">
  <label for="output">output</label>
  <input type="text" id="output" readonly bind:value={decryptedUrl} />
  <button id="copy" onclick={onCopy}>Copy</button>
  <a href={decryptedUrl || "#"} id="open" target="_blank"
    ><button>Open in New Tab</button></a
  >
  <p class="alert" id="copy-alert" style="opacity: {copyAlertOpacity}">
    {copyAlertText}
  </p>
</div>

<!-- Page footer -->
<footer>
  <hr />
  <p class="copyright">
    Created by <a href="https://jstrieb.github.io">Jacob Strieb</a>.
  </p>
</footer>
