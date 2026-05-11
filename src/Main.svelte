<script lang="ts">
  import { onMount } from "svelte";
  import { apiVersions, decoder, type ApiVersion } from "./api";
  import { navigate, p, route } from "./router";
  import logo from "./assets/logo.png";
  import ShopeeBanner from "./ShopeeBanner.svelte";

  let errorText = $state("");
  let hint = $state("");
  let password = $state("");
  let link = $state("");

  onMount(() => {
    const params = route.getParams("/:id");
    if (params.id) {
      link = params.id;
      tryLoadLink();
    } else {
      error("Không tìm thấy liên kết.");
    }
  });

  let encryptedData: Uint8Array<ArrayBuffer>;
  let saltData: Uint8Array<ArrayBuffer> | null = null;
  let ivData: Uint8Array<ArrayBuffer> | null = null;
  let params: any;
  let api: ApiVersion;

  function tryLoadLink() {
    try {
      params = JSON.parse(
        decoder.decode(Uint8Array.fromBase64(link, { alphabet: "base64url" })),
      );
    } catch {
      error("Liên kết có vẻ bị hỏng.");
      return;
    }

    if (!("v" in params && "e" in params)) {
      error("Liên kết bị hỏng. URL mã hóa thiếu các thông số cần thiết.");
      return;
    }

    if (!(params["v"] in apiVersions)) {
      error("Phiên bản API không được hỗ trợ. Liên kết có thể bị hỏng.");
      return;
    }

    api = apiVersions[params["v"]];

    try {
      encryptedData = Uint8Array.fromBase64(params["e"]);
      saltData = "s" in params ? Uint8Array.fromBase64(params["s"]) : null;
      ivData = "i" in params ? Uint8Array.fromBase64(params["i"]) : null;
    } catch {
      error("Liên kết có vẻ bị hỏng.");
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
    if (link) {
      tryLoadLink();
    } else {
      error("Không tìm thấy liên kết.");
    }
  }

  async function unlock() {
    if (!password) return;

    let url;
    try {
      url = await api.decrypt(encryptedData, password, saltData, ivData);
    } catch {
      error("Mật khẩu không chính xác.");
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
          `Liên kết sử dụng một giao thức phi siêu văn bản không được phép. ` +
            `URL bắt đầu với "${urlObj.protocol}" và có thể độc hại.`,
        );
        return;
      }

      window.location.replace(url);
    } catch {
      error("Một URL bị hỏng đã được mã hóa. Không thể chuyển hướng.");
      console.log(url);
      return;
    }
  }
</script>

<img src={logo} alt="Logo" class="mx-auto w-32 h-auto mb-6" />
{#if !errorText}
  <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
    <p class="text-slate-600 mb-4 text-center">
      Vui lòng nhập mật khẩu để mở khóa liên kết.
    </p>
    {#if hint}
      <p
        id="hint"
        class="text-center italic text-sky-600 bg-sky-50 py-2 px-4 rounded-lg mb-6"
      >
        Gợi ý: {hint}
      </p>
    {/if}

    <hr class="border-t border-slate-200 my-6" />

    <label
      for="password"
      class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide"
      >mật khẩu</label
    >
    <input
      type="password"
      id="password"
      bind:value={password}
      onkeypress={(e) => e.key === "Enter" && unlock()}
      class="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 mb-5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
      autofocus
    />
    <button
      onclick={unlock}
      class="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
      >Mở khóa liên kết</button
    >
  </div>
{:else}
  <div class="bg-white border border-red-200 rounded-2xl p-8 shadow-sm">
    <p class="text-red-500 text-center font-medium mb-6">Lỗi: {errorText}</p>
    <div class="flex flex-col gap-3">
      {#if route.hash}
        <button
          onclick={retry}
          class="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
          >Thử lại</button
        >
      {/if}
    </div>
  </div>
{/if}

<ShopeeBanner />
