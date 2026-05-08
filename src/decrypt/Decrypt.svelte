<script lang="ts">
  import { onMount } from "svelte";
  import { apiVersions, decoder } from "../api";
  import { p, route } from "../router";
  import logo from "../assets/logo.png";

  let urlText = $state("");
  let password = $state("");
  let decryptedUrl = $state("");
  let statusText = $state("");
  let statusOpacity = $state(0);
  let copyAlertText = $state("");
  let copyAlertOpacity = $state(0);

  onMount(() => {
    if (route.hash.length > 0) {
      urlText = window.location.origin + p("/", { hash: route.hash });
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
        "Văn bản đã nhập không phải là một URL hợp lệ. Đảm bảo nó cũng bao gồm 'https://'!",
      );
      return;
    }

    let params;
    try {
      params = JSON.parse(
        decoder.decode(
          Uint8Array.fromBase64(url.hash.slice(1), { alphabet: "base64url" }),
        ),
      );
    } catch {
      error("Liên kết có vẻ bị hỏng.");
      return;
    }

    if (!("v" in params && "e" in params)) {
      error(
        "Liên kết bị hỏng. URL mã hóa thiếu các thông số cần thiết.",
      );
      return;
    }

    if (!(params["v"] in apiVersions)) {
      error("Phiên bản API không được hỗ trợ. Liên kết có thể bị hỏng.");
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
      error("Liên kết có vẻ bị hỏng.");
      return;
    }

    let decrypted;
    try {
      decrypted = await api.decrypt(encryptedData, password, saltData, ivData);
    } catch {
      error("Mật khẩu không chính xác!");
      return;
    }

    decryptedUrl = decrypted;
    error("Đã giải mã!");
  }

  function onCopy() {
    navigator.clipboard.writeText(decryptedUrl).then(() => {
      copyAlertText = `Đã sao chép ${decryptedUrl.length} ký tự`;
      copyAlertOpacity = 1;
      setTimeout(() => {
        copyAlertOpacity = 0;
      }, 3000);
    });
  }
</script>

<svelte:head>
  <title>Giải mã URL Link Lock</title>
</svelte:head>

<img src={logo} alt="Logo" class="mx-auto w-32 h-auto mb-6" />

<h1 class="text-3xl font-bold text-slate-900 text-center mb-6">Giải mã URL Link Lock</h1>
<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8 text-slate-600 space-y-4">
  <p>
    Ứng dụng này dùng để giải mã các URL <a
      href="https://github.com/jstrieb/link-lock"
      target="_blank" class="text-sky-500 hover:text-sky-600 hover:underline">Link Lock</a
    >
    mà không tự động chuyển hướng. Điều này hữu ích nếu bạn không tin tưởng nguồn gốc của một URL được mã hóa. Nó cũng hữu ích nếu URL sử dụng một giao thức bị chặn như <code class="bg-slate-100 text-sky-600 px-1.5 py-0.5 rounded text-sm font-mono">javascript:</code>, chẳng hạn.
  </p>

  <p>
    Trang này cũng hữu ích nếu bạn cho rằng mình đã nhận được một liên kết bị khóa, nhưng nó sử dụng một tên miền khác, thay vì <code class="bg-slate-100 text-sky-600 px-1.5 py-0.5 rounded text-sm font-mono">jstrieb.github.io</code>. Điều này có thể được thực hiện như một phương tiện để
    <a
      target="_blank"
      href="https://github.com/jstrieb/link-lock/#evading-censorship"
      class="text-sky-500 hover:text-sky-600 hover:underline">tránh kiểm duyệt</a
    >.
  </p>
</div>

<hr class="border-t border-slate-200 my-8" />

<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
  <label for="encrypted-url" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">url mã hóa</label>
  <input
    type="url"
    id="encrypted-url"
    bind:value={urlText}
    oninput={() => (statusOpacity = 0)}
    class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 mb-5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
  />
  <label for="password" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">mật khẩu</label>
  <!-- svelte-ignore a11y_autofocus -->
  <input type="password" id="password" bind:value={password} autofocus class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 mb-5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all" />
  <button onclick={onDecrypt} class="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md shadow-sky-500/20 hover:shadow-lg hover:-translate-y-0.5">Giải mã</button>
  <p class="text-center text-red-500 font-medium transition-opacity duration-300 mt-4 min-h-[24px]" style="opacity: {statusOpacity}">
    {statusText || "INVISIBLE"}
  </p>
</div>

<hr class="border-t border-slate-200 my-8" />

<!-- Output area -->
<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
  <label for="output" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">đầu ra</label>
  <input type="text" id="output" readonly bind:value={decryptedUrl} class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-500 mb-5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono text-sm break-all" />
  
  <div class="flex flex-col sm:flex-row gap-3 mb-4">
    <button id="copy" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all" onclick={onCopy}>Sao chép</button>
    <a href={decryptedUrl || "#"} id="open" target="_blank" class="flex-1 block w-full"
      ><button class="w-full h-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all">Mở trong tab mới</button></a
    >
  </div>
  
  <p class="text-center text-emerald-500 font-medium transition-opacity duration-300 min-h-[24px]" id="copy-alert" style="opacity: {copyAlertOpacity}">
    {copyAlertText}
  </p>
</div>
