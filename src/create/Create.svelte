<script lang="ts">
  import { LATEST_API_VERSION, apiVersions, encoder } from "../api";
  import { p } from "../router";
  import logo from "../assets/logo.png";

  let url = $state("");
  let hint = $state("Nhập aow.vn");
  let password = $state("aow.vn");
  let confirmPassword = $state("aow.vn");
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
      urlInput.setCustomValidity(
        "URL không hợp lệ. Đảm bảo bao gồm 'http://' hoặc 'https://' ở đầu.",
      );
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
        "Liên kết sử dụng giao thức phi siêu văn bản không được phép. URL bắt đầu với " +
          urlObj.protocol +
          " và có thể độc hại.",
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
    return encoder
      .encode(JSON.stringify(output))
      .toBase64({ alphabet: "base64url" });
  }

  async function onEncrypt() {
    errorText = "";

    if (!validateInputs()) {
      return;
    }

    if (password != confirmPassword) {
      confirmPasswordInput.setCustomValidity("Mật khẩu không khớp");
      confirmPasswordInput.reportValidity();
      return;
    }

    const encrypted = await generateFragment();
    outputUrl = window.location.origin + p("/:id", { params: { id: encrypted } });

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
      copyAlertText = `Đã sao chép ${outputUrl.length} ký tự`;
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
        'Vui lòng chỉ vô hiệu hóa việc tạo ngẫu nhiên vector khởi tạo (IV) nếu bạn biết mình đang làm gì. Vô hiệu hóa tính năng này sẽ làm giảm tính bảo mật của liên kết mã hóa, và nó chỉ tiết kiệm được 20-25 ký tự trong độ dài URL.\n\nNhấn "Hủy" trừ khi bạn rất chắc chắn về việc mình đang làm.',
      );
      if (!confirmed) {
        target.checked = true;
        useRandomIv = true;
      }
    }
  }
</script>

<svelte:head>
  <title>AowVN Kaizo</title>
</svelte:head>

<img src={logo} alt="Logo" class="mx-auto w-32 h-auto mb-6" />

{#if errorText}
  <div class="bg-white border border-red-200 rounded-2xl p-6 shadow-sm mb-6">
    <p id="errortext" class="text-red-500 text-center font-medium mb-4">Lỗi: {errorText}</p>
    <button class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all" onclick={retry}>Thử lại</button>
  </div>
{/if}

<h1 class="text-3xl font-bold text-slate-900 text-center mb-6">AowVN Kaizo</h1>

<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
  <div class="mb-5">
    <label for="url" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">liên kết bí mật</label>
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
            "Vui lòng nhập một URL hợp lệ. Đảm bảo bao gồm 'http://' hoặc 'https://' ở đầu.",
          );
      }}
      oninput={(e) => {
        const target = e.target as HTMLInputElement;
        target.setCustomValidity("");
      }}
      required
      class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
    />
  </div>
  <div class="mb-5">
    <label for="hint" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">gợi ý (tùy chọn)</label>
    <textarea id="hint" rows="1" bind:value={hint} class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-y min-h-[50px]"></textarea>
  </div>
  <div class="flex flex-col sm:flex-row gap-5 mb-6">
    <div class="flex-1">
      <label for="password" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">mật khẩu</label>
      <input type="password" id="password" bind:value={password} class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all" />
    </div>
    <div class="flex-1">
      <label for="confirm-password" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">xác nhận mật khẩu</label>
      <input
        type="password"
        id="confirm-password"
        bind:this={confirmPasswordInput}
        bind:value={confirmPassword}
        oninput={(e) => {
          const target = e.target as HTMLInputElement;
          target.setCustomValidity("");
        }}
        class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
      />
    </div>
  </div>

  <details class="mb-6 group">
    <summary id="advanced-label" class="cursor-pointer text-sky-500 font-semibold uppercase tracking-wide text-sm mb-4 select-none list-none hover:text-sky-600 transition-colors flex items-center gap-2">
      <svg class="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
      nâng cao
    </summary>
    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4" id="advanced">
      <div class="flex items-center justify-between">
        <label for="iv" class="text-sm font-medium text-slate-700 cursor-pointer select-none">vector khởi tạo ngẫu nhiên</label>
        <input
          type="checkbox"
          id="iv"
          bind:checked={useRandomIv}
          onclick={onIvCheck}
          class="w-5 h-5 text-sky-500 bg-white border-slate-300 rounded focus:ring-sky-500 focus:ring-2 cursor-pointer"
        />
      </div>
      <div class="flex items-center justify-between">
        <label for="salt" class="text-sm font-medium text-slate-700 cursor-pointer select-none">salt ngẫu nhiên</label>
        <input type="checkbox" id="salt" bind:checked={useRandomSalt} class="w-5 h-5 text-sky-500 bg-white border-slate-300 rounded focus:ring-sky-500 focus:ring-2 cursor-pointer" />
      </div>
    </div>
  </details>
  <button id="encrypt" onclick={onEncrypt} class="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md shadow-sky-500/20 hover:shadow-lg hover:-translate-y-0.5">Mã hóa</button>
</div>

<hr class="border-t border-slate-200 my-8" />

<!-- Output area -->
<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
  <label for="output" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">đầu ra</label>
  <input type="text" id="output" readonly bind:value={outputUrl} class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-500 mb-5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono text-sm break-all" />
  
  <div class="flex flex-col sm:flex-row gap-3 mb-4">
    <button id="copy" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all" onclick={onCopy}>Sao chép</button>
    <a href={outputUrl || "#"} id="open" target="_blank" class="flex-1 block w-full"
      ><button class="w-full h-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all">Mở trong tab mới</button></a
    >
  </div>
  
  <p class="text-center text-emerald-500 font-medium transition-opacity duration-300 min-h-[24px]" style="opacity: {copyAlert ? '1' : '0'};">{copyAlertText}</p>
</div>
