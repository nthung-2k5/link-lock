<script lang="ts">
  import { onMount } from "svelte";
  import { apiVersions, decoder, type ApiVersion } from "./api";
  import { navigate, p, route } from "./router";

  let errorText = $state("");
  let hint = $state("");
  let password = $state("");
  let isHashPresent = $state(false);

  onMount(() => {
    if (route.hash) {
      isHashPresent = true;
      tryLoadHash();
    } else {
      navigate("/create", { replace: true });
    }
  });

  let encryptedData: Uint8Array<ArrayBuffer>;
  let saltData: Uint8Array<ArrayBuffer> | null = null;
  let ivData: Uint8Array<ArrayBuffer> | null = null;
  let params: any;
  let api: ApiVersion;
  let hashStr: string = "";

  function tryLoadHash() {
    hashStr = route.hash.slice(1);

    if (hashStr.startsWith("/")) {
      isHashPresent = false;
      return;
    }

    try {
      params = JSON.parse(
        decoder.decode(
          Uint8Array.fromBase64(hashStr, { alphabet: "base64url" }),
        ),
      );
    } catch {
      error("The link appears corrupted.");
      return;
    }

    if (!("v" in params && "e" in params)) {
      error(
        "The link appears corrupted. The encoded URL is missing necessary parameters.",
      );
      return;
    }

    if (!(params["v"] in apiVersions)) {
      error("Unsupported API version. The link may be corrupted.");
      return;
    }

    api = apiVersions[params["v"]];

    try {
      encryptedData = Uint8Array.fromBase64(params["e"]);
      saltData = "s" in params ? Uint8Array.fromBase64(params["s"]) : null;
      ivData = "i" in params ? Uint8Array.fromBase64(params["i"]) : null;
    } catch {
      error("The link appears corrupted.");
      return;
    }

    if ("h" in params) {
      hint = params["h"];
    }
  }

  function error(msg: string) {
    errorText = msg;
  }

  function retry() {
    errorText = "";
    password = "";
    tryLoadHash();
  }

  async function unlock() {
    if (!password) return;

    let url;
    try {
      url = await api.decrypt(encryptedData, password, saltData, ivData);
    } catch {
      error("Password is incorrect.");
      return;
    }

    try {
      let urlObj = new URL(url);

      if (
        !(
          urlObj.protocol == "http:" ||
          urlObj.protocol == "https:" ||
          urlObj.protocol == "magnet:"
        )
      ) {
        error(
          `The link uses a non-hypertext protocol, which is not allowed. ` +
            `The URL begins with "${urlObj.protocol}" and may be malicious.`,
        );
        return;
      }

      window.location.replace(url);
    } catch {
      error("A corrupted URL was encrypted. Cannot redirect.");
      console.log(url);
      return;
    }
  }
</script>

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

{#if isHashPresent}
  {#if !errorText}
    <div class="form">
      <p>Please enter the password to unlock the link.</p>
      {#if hint}
        <p id="hint">Hint: {hint}</p>
      {/if}

      <hr />

      <label for="password">password</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        onkeypress={(e) => e.key === "Enter" && unlock()}
        autofocus
      />
      <button onclick={unlock}>Unlock link</button>
    </div>
  {:else}
    <div class="error red-border">
      <p>Error: {errorText}</p>
      <button onclick={retry}>Try again</button>
      <a href="/create"><button>Lock a link</button></a>
      <a
        href={p("/decrypt", { hash: route.hash })}
        id="no-redirect"
        target="_blank"><button>Decrypt without redirect</button></a
      >
      <a href="/hidden" id="hidden" target="_blank"
        ><button>Create hidden bookmark</button></a
      >
    </div>
  {/if}
{/if}
