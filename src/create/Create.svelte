<script lang="ts">
  import { LATEST_API_VERSION, apiVersions, encoder } from "../api";
    import { p } from '../router';

  let url = $state("");
  let hint = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let useRandomIv = $state(true);
  let useRandomSalt = $state(true);

  let outputUrl = $state("");
  let errorText = $state("");

  // Refs
  let urlInput: HTMLInputElement;
  let confirmPasswordInput: HTMLInputElement;

  function error(msg: string) {
    errorText = msg;
  }

  function retry() {
    errorText = "";
  }

  function validateInputs(): boolean {
    if (!urlInput.reportValidity()) return false;
    
    // Check for non-HTTP protocols; blocks them to prevent XSS attacks. Also
    // allow magnet links for password-protected torrents.
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      urlInput.setCustomValidity("URL invalid. Make sure to include 'http://' or 'https://' at the beginning.");
      urlInput.reportValidity();
      return false;
    }

    if (
      !(
        urlObj.protocol == "http:" ||
        urlObj.protocol == "https:" ||
        urlObj.protocol == "magnet:"
      )
    ) {
      urlInput.setCustomValidity(
        "The link uses a non-hypertext protocol, which is " +
          "not allowed. The URL begins with " +
          urlObj.protocol +
          " and may be " +
          "malicious."
      );
      urlInput.reportValidity();
      return false;
    }

    return true;
  }

  async function generateFragment() {
    const api = apiVersions[LATEST_API_VERSION];

    const salt = useRandomSalt ? await api.randomSalt() : null;
    const iv = useRandomIv ? await api.randomIv() : null;
    const encrypted = await api.encrypt(url, password, salt, iv);
    
    const output: any = {
      v: LATEST_API_VERSION,
      e: new Uint8Array(encrypted).toBase64(),
    };

    // Add the hint if there is one
    if (hint != "") {
      output["h"] = hint;
    }

    // Add the salt and/or initialization vector if randomly generated
    if (useRandomSalt && salt) {
      output["s"] = new Uint8Array(salt).toBase64();
    }
    if (useRandomIv && iv) {
      output["i"] = new Uint8Array(iv).toBase64();
    }

    // Return the base64-encoded output
    return encoder.encode(JSON.stringify(output)).toBase64({ alphabet: "base64url" });
  }

  async function onEncrypt() {
    errorText = "";

    if (!validateInputs()) {
      return;
    }

    if (password != confirmPassword) {
      confirmPasswordInput.setCustomValidity("Passwords do not match");
      confirmPasswordInput.reportValidity();
      return;
    }

    const encrypted = await generateFragment();
    outputUrl = window.location.origin + p('/', { hash: encrypted });

    // Scroll to the bottom so the user sees where the bookmark was created
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }

  let copyAlert = $state(false);
  let copyAlertText = $state("");

  function onCopy() {
    navigator.clipboard.writeText(outputUrl).then(() => {
      copyAlertText = `Copied ${outputUrl.length} characters`;
      copyAlert = true;
      setTimeout(() => {
        copyAlert = false;
      }, 3000);
    });
  }

  function onIvCheck(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.checked) {
      const confirmed = confirm(
        "Please only disable initialization vector randomization if you know what you are doing. Disabling this is detrimental to the security of your encrypted link, and it only saves 20-25 characters in the URL length.\n\nPress \"Cancel\" unless you are very sure you know what you are doing."
      );
      if (!confirmed) {
        target.checked = true;
        useRandomIv = true;
      }
    }
  }
</script>

<svelte:head>
  <title>Link Lock - Password-protect links</title>
</svelte:head>

<!-- View on GitHub ribbon -->
<a href="https://github.com/jstrieb/link-lock" target="_blank">
  <!-- Use public folder path for image -->
  <img class="ribbon" src="/corner-ribbon-minified.svg" alt="View on GitHub" />
</a>

<noscript>
  <div class="red-border">
    <p>
      If you are seeing this, it means that you have JavaScript disabled. As a
      result, the application will not work properly for you. For example, none
      of the buttons will work.
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

{#if errorText}
  <!-- Display errors in a big red box -->
  <div class="error red-border">
    <p id="errortext">Error: {errorText}</p>
    <button onclick={retry}>Try again</button>
  </div>
{/if}

<!-- Project description -->
<h1>Link Lock</h1>
<div>
  <p>
    Link Lock is a tool for adding a password to a link; in other words, for
    encrypting and decrypting URLs. When a user visits an encrypted URL, they
    will be prompted for a password. If the password is correct, Link Lock
    sends them to the hidden website. Otherwise, an error is displayed. Users
    can also add hints to remind them of the password.
  </p>
  <p>
    Each encrypted URL is stored entirely within the link generated by this
    application. As a result, users control all the data they create with Link
    Lock. Nothing is ever stored on a server, and there are no cookies,
    tracking, or signups. View <a
      target="_blank"
      href="https://github.com/jstrieb/link-lock">on GitHub</a
    > for more information, including translated versions.
  </p>
  <p>Link Lock has many uses, for example:</p>
  <ul>
    <li>
      <a
        target="_blank"
        href="https://jstrieb.github.io/link-lock/#eyJ2IjoiMC4wLjEiLCJlIjoiU1ZBemc0NUVoeXJMR1hXYmRUMXpLSFFIa0hiR2F3SzlMaWZzWW5SL0ZiaGp1cnZqMGg5VTE0bG9kVGs3S3B0TjdhcjZ2T3FvRjJLNkxMcDByL05PZE5nUTJ3UlhVOWM2RmFJdXNGajdrNkFkTC82OVJ6dmlFV2R0dWVacFM1dS9SN2w4L3Mzc1pMTVJNeHdhTVhVenYxTjZUVkdWTGloaXc3ZXlGY093Nkp2ZVN3aGl0OW9XWW84Yk9CMkpkTTF4ZnFRSGExbEoiLCJoIjoi8J+lkSIsImkiOiI5L3pmdHFmeHdoWFh4bDc4In0="
        >Store private bookmarks on a shared computer</a
      > - Password: avocado
    </li>
    <li>Add a password to shared Dropbox or Google Drive links</li>
    <li>
      <a
        target="_blank"
        href="https://jstrieb.github.io/link-lock/#eyJ2IjoiMC4wLjEiLCJlIjoiZEx3Yi9CNitlK0ZjM1B3ZURrbUY2NjdQWFlIV1dsS3dpclhvZmkvRXBFTXU0ZERlVkJuSmUrN1loS2JxQ3RrPSIsImgiOiIxICsgMSA9ID8iLCJpIjoiRDJYd1MyK1EzaHpuUDV1NyJ9"
        >Implement simple CAPTCHAs</a
      >
    </li>
    <li>
      <a
        target="_blank"
        href="https://jstrieb.github.io/link-lock/#eyJ2IjoiMC4wLjEiLCJlIjoiWWhjbG0xeE9uZTJWU2tvc3N1WERwKytyN1lscW1nMVNNemRoSUVER2xVZVBTUFZ3MFA3WTVwQXdnVFVKZkt4WHJ4Nlg1KytCU09RNlVTTlI3M244VEdTeWJGMmJFTG5wc0x6WVRtZnQ3aDFZSzJ5VW16TEpBTk5VOThqZFMvTVFNUG93cWdoRjVUVnYyRWF1VkVHVVlJeE5iT3BtaldCNWJyMWpXemMyakJTNUxZVGVSajNTbVI5UWNwWlRWWmVrbit4Rzd3VzNIcEttRTdVRWNtbkhZS2dydGVmaHp5eTJGNVd6N1NKSm55OTJPWnJUOEFHUE9XY3JUbmxYV0NsTDB5QjVsQmZnUTJkcHk4Y3RmMHNvdVlvb1l2LzQ1U3krZUNtdHl2WkVDd25IeUhwUForamxsaDhuNUV5U2N1ZVRWTmRtRmlmOFBhM0FtdUpQOTdTYWZXbzNwbUo4cU40UFYvMllQbHlwSGFtTmI1dnBBQkc2cU1yUWlLMVp3WHBUSnF4OG9NNFdVVGh3L3B5S0QzOWRNNml2RlNzQzVRUWpaVHl0ODlSNDNVOVdkRDVMWHprdlZ1bVpNSmM2WDExTkI4V0ZSKzdyOGVvVU8wR21rRkxTU0JlaDJickt3bzkwWjRlZkJHTkZiYWE2dU9SWnQzSm1YU0NSSGZyclVRQ053cU96R2pCKzBYZHJFeC9NbHd3QkFKNTIvY0EraW9IUDk5RkszUDN1MlN6Sk1uQzVVSFg1NGNDd1Z2dWdiMzAvUmNsMjZvZzFxUDU0NWJlMGFiak9wYnZ5aFp6RjhkdDNUUjJFLzBMY2dUQUg4dE5wSVAyYzJoM2d4NlJEQUNTZ25LRzlteW4xdFU4Y0IwbWMrd1NPdkxIRlVXVXhIYnpGSkR0aS9MSDg1RDFvdVRNWTFjM3BsSSsxRFFROG5lbjVrR2hmRUhELzdsSFhIY1ZWTHNCbi9HOTFJZU02T2pTeS9aZFcySGZ4d050VzR2WEE3em1FdjhYRDNHL3M2ZTVqdVdQWjV3ck5JWFdzcDVROHdUSlI3U2JQUi94VDNwUUZncW9LaDF2OXVEWGZBaE5xYStXaElzNTlaR1UzdFlkRVFOZEVLdGpIcnF1bzJkcVpuNnB4eTU1ZDJiOVBrcFRLNGh5TEtDOEc1TmN3TEE3dUIzYTNlNlZ2NjVVVHcrdS9oWTBoMy9Nb3ZJaERmT3k2aGZiN2FQaEIyMStxSGZSeWt2VlFPUFZrbE41ak5EK1hKZURialgvd0NUWXJJVm0yOFZkTHppZURob2ZpRGpJRjdyakFQNlF6dWJjaGJYRGFtbFZQWUhOaGVNMWdTeGROSGw5a1lRVE5kbjA1WlcvbVhXNkQwbHk0VkwrOHRwZzdxQjU2YTRyL3lIWHA0Q0tSUkdIaEVWQUptbmh2ZnBaWE11QWdneGVoSkRibVdVKy9VMUgwM2JicUZub2h5R0VGRUxQV2JjZ05kdDJwWU1Cdy81TVNqSkdWWWRPQk5nTUsxbHA2ZVRxRGhwTVdJT2E4a1dSYWx3RzV1bDhuQjhnUVBkcXBCYVdxc3I3V242SVZoZHdLc0FvTGtsdTlnL0JoelNlZEQxRjcyblprN2tSS2l3a3BJbVhOeW9TQk1SSFJSMURjSm9qdU1ZVWlrZ2JxM0dpR2ZqNmMwTTBlU2lyMlhJRnRCTzd2VkJyRmpZL1pvVnJBQ1kwTzJ2UVlGcHovaEprNElKN0daOUpmc3U4ajl5Umc5S3IrNFU3MFhoZHRLY1VYeEtrbCt1VDBtN1owb2puR0xWOGRtampzTVdna3ZhV0FYNkJpK3cycVJKYnVYRW5yUEN5dUZGODhiZ2k3UDNYUVhOMHZTY3h2Uk4wVktKQ1MvR2RVWTJsZ0lDSXVBWFlUVE9KTGNsRkJPQWxialRmZThoTG5saTkzQm4xcnZOamhnM0Y2UkJ2N3NQOTlzODlGT3pwcEZHeHVKS1RhNEg4Y2NSRmxMWDBWbE9kR0RhNWM0NGVTdzh5dCsxWWJndDlvMlExcWNSYVZsaVdadSs5VjdxM1pqcWIxcDdKb2FUN0pDQ1U2ZXR6b0dJWjBQT1JqL3pVNUlVQkRjYXdHZWszZ0djSDBLdDcxa1NSN0F2TWRYeTR3WVI4ZmdTTlpoR3gwSTZYczZ5Vy9oWFB1WERPRjNHTVBTRFFmNGNhUjBuc3pmYTl3MXdGMzVSYktodEVkZnIwU0NLQzhIRXFzNWdsQ0M4RmIxN04wbGtBVlFwSWFRRGJrN254TjVINEFhQ3RKbU5JNHFYUDhocUV6aVhySGhhZWNzNkVBUDBvdjg2cWp4dz09IiwiaCI6InVybHBhZ2U1IiwiaSI6InJNZ2xiSEpzK3pSL2dteFAifQ=="
        >Encrypt entire pages</a
      >
      (via
      <a target="_blank" href="https://github.com/jstrieb/urlpages">URL Pages</a
      >) - Password: urlpage5
    </li>
    <li>Post private links on public websites</li>
    <li>
      <a
        target="_blank"
        href="https://jstrieb.github.io/link-lock/#eyJ2IjoiMC4wLjEiLCJlIjoieVJqZnVGdlJETGFTdk4vRVYzUlg3OG9GZHRlWW81U04wcFlvSkFScFRaeXFwZTVoV1lESjFBeDVWRUswMDBNUlQ2ZVAwZ2tCTmlyaVdrYnNsVFdrZTNtNVVOVnoxSW43Z3BST1hQZDhsVmVDTkpJZi81Wm1PWFdzSDZ6dVJmdkVrald0UTRndkZBUE9VSm9id00rdnhtWGtuZW5TZ0pHeW9mMjg3L01pTERDN085NFoxTUwrMzlaNUkwdCtsaW1CaDFaNElWZ1p1QkpQUURvM2NodWZXemdTNU05Zk1FOFlxNXVUV1ZoZjVLV2VaTUR1Q0VWSmN2TjRXbDByZHl6MFpBPT0iLCJoIjoiXG5QYXNzd29yZDogdG9ycmVudGluZ19pcy1sZWdhbCEiLCJpIjoiUlIvNnJtRFhzb1lGblhiOSJ9"
        >Share password-protected torrents and magnet links</a
      > - Password: torrenting_is-legal!
    </li>
  </ul>
</div>

<hr />

<!-- Main form -->
<div class="form">
  <div class="labeled-input">
    <label for="url">secret link</label>
    <input
      type="url"
      id="url"
      bind:this={urlInput}
      bind:value={url}
      placeholder="https://"
      oninvalid={(e) => {
        const target = e.target as HTMLInputElement;
        if (!target.validity.customError)
          target.setCustomValidity(
            "Please enter a valid URL. Make sure to include 'http://' or 'https://' at the beginning."
          );
      }}
      oninput={(e) => {
        const target = e.target as HTMLInputElement;
        target.setCustomValidity("");
      }}
      required
    />
  </div>
  <div class="labeled-input hint">
    <label for="hint">hint (optional)</label>
    <textarea id="hint" rows="1" bind:value={hint}></textarea>
  </div>
  <div class="split-row">
    <div class="labeled-input password">
      <label for="password">password</label>
      <input type="password" id="password" bind:value={password} />
    </div>
    <div class="labeled-input confirm-password">
      <label for="confirm-password">confirm password</label>
      <input
        type="password"
        id="confirm-password"
        bind:this={confirmPasswordInput}
        bind:value={confirmPassword}
        oninput={(e) => {
          const target = e.target as HTMLInputElement;
          target.setCustomValidity("");
        }}
      />
    </div>
  </div>

  <!-- Advanced options (JavaScript-activated dropdown) -->
  <details>
    <summary id="advanced-label">advanced</summary>
    <div class="advanced" id="advanced">
      <div class="labeled-input">
        <label for="iv">random initialization vector</label>
        <input
          type="checkbox"
          id="iv"
          bind:checked={useRandomIv}
          onclick={onIvCheck}
        />
      </div>
      <div class="labeled-input">
        <label for="salt">random salt</label>
        <input type="checkbox" id="salt" bind:checked={useRandomSalt} />
      </div>
    </div>
  </details>
  <button id="encrypt" onclick={onEncrypt}>Encrypt</button>
</div>

<hr />

<!-- Output area -->
<div class="output">
  <label for="output">output</label>
  <input type="text" id="output" readonly bind:value={outputUrl} />
  <button id="copy" onclick={onCopy}>Copy</button>
  <a href="/hidden" id="bookmark" target="_blank"
    ><button>Create Hidden Bookmark</button></a
  >
  <a href={outputUrl || "#"} id="open" target="_blank"
    ><button>Open in New Tab</button></a
  >
  <!-- Special incantation to make TinyURL work -->
  <!-- TODO: Re-enable if TinyURL unbans this domain -->
  <!--
  <form action="https://tinyurl.com/create.php" method="get" target="_blank" style="display: inline;">
    <input type="hidden" id="source" name="source" value="indexpage" />
    <input type="hidden" id="tinyurl" name="url" value = "" />
    <button>Get Shortened Link</button>
  </form>
  -->
  <p class="alert" style="opacity: {copyAlert ? '1' : '0'};">{copyAlertText}</p>
</div>

<!-- Page footer -->
<footer>
  <hr />
  <p class="copyright">
    Created by <a href="https://jstrieb.github.io">Jacob Strieb</a>.
  </p>
</footer>
