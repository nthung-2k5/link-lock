<script lang="ts">
  import { onMount } from "svelte";
  import { decoder } from "../api";
  import logo from "../assets/logo.png";

  let hiddenUrlText = $state("");
  let bookmarkTitle = $state("");
  let bookmarkUrlText = $state("");
  let decryptBookmarkDisguise = $state("https://gmail.com");

  let statusText = $state("");
  let statusOpacity = $state(0);

  let outputHref = $state("");
  let outputTitle = $state("Chưa tạo dấu trang ẩn nào");
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
    if (window.location.hash && window.location.hash !== "/hidden") {
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
      error("URL ẩn không hợp lệ. Đảm bảo nó cũng bao gồm 'https://'!");
      return;
    }

    let bookmarkUrl;
    try {
      bookmarkUrl = new URL(bookmarkUrlText);
    } catch {
      error("URL dấu trang không hợp lệ. Đảm bảo nó cũng bao gồm 'https://'!");
      return;
    }

    let hash = hiddenUrl.hash.slice(1);
    try {
      let _ = JSON.parse(
        decoder.decode(Uint8Array.fromBase64(hash, { alphabet: "base64url" })),
      );
    } catch {
      error(
        'URL ẩn có vẻ bị hỏng. Nó phải là một URL Link Lock được bảo vệ bằng mật khẩu. <a href="https://jstrieb.github.io/link-lock">Nhấn vào đây để thêm mật khẩu.</a>',
      );
      return;
    }

    bookmarkUrl.hash = hiddenUrl.hash;
    outputHref = bookmarkUrl.toString();
    outputDisabled = false;
    outputTitle = bookmarkTitle || bookmarkUrl.hostname;

    error("Dấu trang được tạo bên dưới.");

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
          "&origin=*",
      )
        .then((r) => r.json())
        .then((d) => {
          let pages = d.query.pages;
          return pages[Object.keys(pages)[0]];
        });

      bookmarkUrlText = page.canonicalurl;
      bookmarkTitle = page.title;
    } catch (e) {
      error("Không thể tìm nạp liên kết ngẫu nhiên từ Wikipedia.");
    }
  }
</script>

<svelte:head>
  <title>Tạo dấu trang ẩn</title>
</svelte:head>

<!-- View on GitHub ribbon -->
<a href="https://github.com/jstrieb/link-lock" target="_blank" class="absolute top-0 right-0 opacity-80 hover:opacity-100 transition-opacity">
  <img src="/corner-ribbon-minified.svg" alt="Xem trên GitHub" class="w-24 h-24" />
</a>

<img src={logo} alt="Logo" class="mx-auto w-32 h-auto mb-6" />

<h1 class="text-3xl font-bold text-slate-900 text-center mb-6">Tạo dấu trang ẩn</h1>
<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8 text-slate-600 space-y-4">
  <p>
    Có thể bảo vệ dấu trang bằng mật khẩu bằng cách sử dụng <a
      href="https://jstrieb.github.io/link-lock"
      target="_blank" class="text-sky-500 hover:text-sky-600 hover:underline">Link Lock</a
    >, nhưng một liên kết cần mật khẩu có thể trông đáng ngờ đối với người khác khi nhìn thấy nó. Dấu trang ẩn giải quyết vấn đề này.
  </p>
  <p>
    Các dấu trang ẩn được ngụy trang giống hệt các dấu trang bình thường, với một ngoại lệ: nhấp vào chúng theo đúng thứ tự sẽ mở ra một liên kết ẩn. <b class="font-semibold text-slate-800"
      >Để mở liên kết ẩn, trước tiên hãy nhấp vào dấu trang ngụy trang, và sau đó nhấp vào dấu trang giải mã.</b
    > Cùng một dấu trang giải mã hoạt động cho tất cả các dấu trang được ngụy trang.
  </p>
  <p>
    Đọc thêm về cách hoạt động của dấu trang ẩn <a
      target="_blank"
      href="https://jstrieb.github.io/projects/hidden-bookmarks/" class="text-sky-500 hover:text-sky-600 hover:underline">tại đây</a
    >.
  </p>
</div>

<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
  <p class="font-semibold text-slate-800 mb-4">Dưới đây là cách tạo dấu trang ẩn:</p>
  <ol class="list-decimal list-inside text-slate-600 space-y-3">
    <li>
      <a href="https://jstrieb.github.io/link-lock" class="text-sky-500 hover:text-sky-600 hover:underline"
        >Thêm mật khẩu vào liên kết ẩn</a
      > nếu bạn chưa làm như vậy.
    </li>
    <li>
      Kéo dấu trang "giải mã" dưới đây vào thanh dấu trang của bạn.

      <ul class="list-disc list-inside ml-6 mt-2 mb-4 space-y-2">
        <li>
          Nhấp vào dấu trang giải mã sẽ đi đến <code class="bg-slate-100 text-sky-600 px-1.5 py-0.5 rounded text-sm font-mono"
            >{decryptBookmarkDisguise}</code
          > trừ khi trang hiện tại là một liên kết được ngụy trang. Sử dụng các tùy chọn "nâng cao" để nó đi đến một nơi khác.
        </li>
      </ul>

      <details class="mb-4 group">
        <summary class="cursor-pointer text-sky-500 font-semibold uppercase tracking-wide text-sm mb-4 select-none list-none hover:text-sky-600 transition-colors flex items-center gap-2">
          <svg class="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          nâng cao
        </summary>
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
          <label for="decrypt-bookmark-disguise" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide"
            >vị trí mồi nhử cho dấu trang giải mã</label
          >
          <div class="flex">
            <input
              type="text"
              id="decrypt-bookmark-disguise"
              bind:value={decryptBookmarkDisguise}
              class="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>
        </div>
      </details>

      <p class="mb-4">
        <a
          class="inline-block px-5 py-2.5 border-2 border-sky-500 text-sky-500 font-semibold rounded-lg hover:bg-sky-500 hover:text-white transition-all text-center w-full sm:w-auto"
          id="decrypt-bookmark"
          onclick={(e) => e.preventDefault()}
          href={decryptBookmarklet}>Giải mã</a
        >
      </p>
    </li>
    <li>
      Có thể là một ý tưởng hay khi đổi tên dấu trang giải mã thành "Gmail" bằng cách nhấp chuột phải và nhấp vào "Chỉnh sửa" hoặc "Thuộc tính".
    </li>
    <li>
      Điền vào URL ẩn dưới đây (nếu nó chưa được điền). Sau đó, điền vào tên và liên kết dấu trang được ngụy trang.
      <ul class="list-disc list-inside ml-6 mt-2 space-y-2">
        <li>
          Có một nút để tạo liên kết ngụy trang ngẫu nhiên nếu bạn không muốn tự chọn.
        </li>
      </ul>
    </li>
    <li>
      Nhấn nút để tạo dấu trang. Khi đã tạo, kéo dấu trang được ngụy trang vào thanh dấu trang của bạn.
    </li>
  </ol>
</div>

<hr class="border-t border-slate-200 my-8" />

<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
  <label for="encrypted-url" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">url ẩn</label>
  <input
    type="url"
    id="encrypted-url"
    bind:value={hiddenUrlText}
    oninput={() => (statusOpacity = 0)}
    class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 mb-5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
  />
  <label for="bookmark-title" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">tên dấu trang ngụy trang</label>
  <input type="text" id="bookmark-title" bind:value={bookmarkTitle} class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 mb-5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all" />
  <label for="bookmark-url" class="block text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">url ngụy trang dấu trang</label>
  <input type="url" id="bookmark-url" bind:value={bookmarkUrlText} required class="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 mb-5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all" />
  <button onclick={onHide} class="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md shadow-sky-500/20 hover:shadow-lg hover:-translate-y-0.5 mb-3">Tạo dấu trang ngụy trang</button>
  <button class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-all" onclick={randomLink}>Sử dụng một liên kết ngụy trang ngẫu nhiên</button>
  <p class="text-center text-red-500 font-medium transition-opacity duration-300 mt-4 min-h-[24px]" style="opacity: {statusOpacity}">
    {@html statusText || "INVISIBLE"}
  </p>
</div>

<hr class="border-t border-slate-200 my-8" />

<!-- Output area -->
<div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
  <label for="output" class="block text-sm font-medium text-slate-500 mb-4 uppercase tracking-wide">đầu ra</label>
  <a
    class="block w-full text-center px-5 py-3 border-2 border-sky-500 text-sky-500 font-semibold rounded-lg hover:bg-sky-500 hover:text-white transition-all mb-5 truncate aria-[disabled=true]:border-slate-300 aria-[disabled=true]:text-slate-400 aria-[disabled=true]:hover:bg-transparent aria-[disabled=true]:cursor-not-allowed"
    href={outputHref || "#"}
    onclick={(e) => e.preventDefault()}
    aria-disabled={outputDisabled}
    id="output">{outputTitle}</a
  >
  <p class="text-slate-600 mb-2">Kéo dấu trang ngụy trang phía trên vào thanh dấu trang.</p>
  <p class="text-slate-600">
    Để truy cập liên kết ẩn, hãy nhấp vào dấu trang ngụy trang, sau đó nhấp vào dấu trang giải mã (có thể đã được đổi tên thành "Gmail").
  </p>
</div>

<!-- Page footer -->
<footer class="text-center text-slate-500 text-sm mt-10 mb-6">
  <hr class="border-t border-slate-200 mb-6" />
  <p class="copyright">
    Được tạo bởi <a href="https://jstrieb.github.io" class="text-sky-500 hover:text-sky-600 hover:underline">Jacob Strieb</a>.
  </p>
</footer>
