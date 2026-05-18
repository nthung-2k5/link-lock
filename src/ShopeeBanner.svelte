<script lang="ts">
  import { onMount } from "svelte";

  const HIDE_MINUTES = 1;
  const STORE_KEY = "shp_inline_dismissed_at_v1";

  let show = $state(false);
  let dismissed = $state(true);
  let targetImg = $state("");
  let targetHref = $state("");
  let closing = $state(false);

  onMount(async () => {
    const now = Date.now();
    let ts: string | null = null;
    try {
      ts = localStorage.getItem(STORE_KEY);
    } catch (_) {}
    if (!ts) {
      const m = document.cookie.match(/(?:^|;\s*)shp_inline_ts=([^;]+)/);
      ts = m ? decodeURIComponent(m[1]) : null;
    }
    if (ts && now - +ts < HIDE_MINUTES * 60 * 1000) {
      return; 
    }

    const res = await fetch("https://gist.githubusercontent.com/nthung-2k5/08ba18f886884d0b3ad7a979d9ac9aef/raw/ad.json");
    if (!res.ok) {
      throw new Error(`Failed to fetch ad data: ${res.statusText}`);
    }
    const data = await res.json();
    
    if (!data.images || !data.links || data.images.length === 0 || data.links.length === 0) {
      throw new Error("Invalid ad data: images or links are missing or empty");
    }

    dismissed = false;

    const pick = (a: string[]) => a[(Math.random() * a.length) | 0];
    targetImg = pick(data.images);
    targetHref = pick(data.links);

    // Show modal directly after mounting
    setTimeout(() => {
      show = true;
    }, 50);
  });

  function saveTs(t: number) {
    try {
      localStorage.setItem(STORE_KEY, String(t));
    } catch (_) {}
    document.cookie =
      "shp_inline_ts=" +
      encodeURIComponent(String(t)) +
      "; max-age=" +
      HIDE_MINUTES * 60 +
      "; path=/; SameSite=Lax";
  }

  function closeBanner(e?: Event) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closing = true;
    show = false;
    saveTs(Date.now());
    setTimeout(() => {
      dismissed = true;
    }, 260);
  }
</script>

{#if !dismissed}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="shp-overlay"
    class:show={show && !closing}
    class:closing
    onclick={closeBanner}
  >
    <div class="shp-modal-content" onclick={(e) => e.stopPropagation()}>
      <button
        class="shp-close"
        aria-label="Đóng banner"
        type="button"
        onpointerup={closeBanner}
      >
        <span class="x">✕</span>
      </button>
      <a href={targetHref} target="_blank" rel="nofollow noopener">
        <img
          src={targetImg}
          alt="Shopee Banner"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
        />
      </a>
    </div>
  </div>
{/if}

<style>
  .shp-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.25s ease;
    will-change: opacity;
  }
  .shp-overlay.show {
    opacity: 1;
  }
  .shp-overlay.closing {
    opacity: 0;
  }
  
  .shp-modal-content {
    position: relative;
    max-width: 90%;
    width: 500px;
    transform: translateY(20px) scale(0.95);
    transition: transform 0.25s ease;
    will-change: transform;
  }
  
  .shp-overlay.show .shp-modal-content {
    transform: translateY(0) scale(1);
  }
  .shp-overlay.closing .shp-modal-content {
    transform: translateY(20px) scale(0.95);
  }

  .shp-modal-content a {
    display: block;
    text-decoration: none;
    outline: 0;
  }
  .shp-modal-content img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 16px;
    object-fit: cover;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  }
  .shp-close {
    position: absolute;
    top: -16px;
    right: -16px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 999px;
    cursor: pointer;
    z-index: 10;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    transition: background 0.2s ease;
  }
  .shp-close:hover {
    background: rgba(0, 0, 0, 1);
  }
  .shp-close .x {
    font-size: 18px;
    font-weight: 800;
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    .shp-modal-content {
      width: 90%;
    }
    .shp-modal-content img {
      border-radius: 14px;
    }
    .shp-close {
      top: -12px;
      right: -12px;
      width: 40px;
      height: 40px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .shp-overlay, .shp-modal-content {
      transition: none;
    }
  }
</style>
