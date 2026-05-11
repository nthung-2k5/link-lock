<script lang="ts">
  import { onMount } from "svelte";

  const HIDE_MINUTES = 1;
  const STORE_KEY = "shp_inline_dismissed_at_v1";

  let show = $state(false);
  let dismissed = $state(true);
  let targetImg = $state("");
  let targetHref = $state("");
  let closing = $state(false);

  const images = [
    "https://i45.servimg.com/u/f45/19/58/16/37/aowvnd12.png",
    "https://i45.servimg.com/u/f45/19/58/16/37/aowvnd11.png",
    "https://i45.servimg.com/u/f45/19/58/16/37/aowvnd10.png",
    "https://i45.servimg.com/u/f45/19/58/16/37/aowvnd13.png",
    "https://i45.servimg.com/u/f45/19/58/16/37/aowvnd14.png",
  ];
  const links = [
    "https://s.shopee.vn/4frtYdd9Bl", "https://s.shopee.vn/5AoA9YbFAs", "https://s.shopee.vn/50UjxFbsVr",
    "https://s.shopee.vn/2qQFNGk7uS", "https://s.shopee.vn/2g6pAxklFR", "https://s.shopee.vn/3B35lsirEY",
    "https://s.shopee.vn/30jfZZjUZX", "https://s.shopee.vn/3VfwAUhaYe", "https://s.shopee.vn/3LMVyBiDtd",
    "https://s.shopee.vn/3qImZ6gJsk", "https://s.shopee.vn/3fzMMngxDj", "https://s.shopee.vn/6fcxwJVX8K",
    "https://s.shopee.vn/6pwO8cUtnN", "https://s.shopee.vn/70FoKvUGSQ", "https://s.shopee.vn/7AZEXETd7T",
    "https://s.shopee.vn/7KsejXSzmW", "https://s.shopee.vn/7VC4vqSMRZ", "https://s.shopee.vn/7fVV89Rj6c",
    "https://s.shopee.vn/7povKSR5lf", "https://s.shopee.vn/5L7aLrabqC", "https://s.shopee.vn/5VR0YAZyVF",
    "https://s.shopee.vn/5fkQkTZLAI", "https://s.shopee.vn/5q3qwmYhpL", "https://s.shopee.vn/60NH95Y4UO",
    "https://s.shopee.vn/6AghLOXR9R", "https://s.shopee.vn/6L07XhWnoU", "https://s.shopee.vn/6VJXk0WATX",
    "https://s.shopee.vn/9Kdj7DLNj6", "https://s.shopee.vn/9Ux9JWKkO9", "https://s.shopee.vn/9fGZVpK73C",
    "https://s.shopee.vn/9pZzi8JTiF", "https://s.shopee.vn/9ztPuRIqNI", "https://s.shopee.vn/AACq6kID2L",
    "https://s.shopee.vn/AKWGJ3HZhO", "https://s.shopee.vn/AUpgVMGwMR", "https://s.shopee.vn/808LWlQSQy",
    "https://s.shopee.vn/8ARlj4Pp61", "https://s.shopee.vn/8KlBvNPBl4", "https://s.shopee.vn/8V4c7gOYQ7",
    "https://s.shopee.vn/8fO2JzNv5A", "https://s.shopee.vn/8phSWINHkD", "https://s.shopee.vn/900sibMePG",
    "https://s.shopee.vn/9AKIuuM14J", "https://s.shopee.vn/1LbRaVppxo", "https://s.shopee.vn/1VurmopCcr",
    "https://s.shopee.vn/1gEHz7oZHu", "https://s.shopee.vn/1qXiBQnvwx", "https://s.shopee.vn/20r8NjnIc0",
    "https://s.shopee.vn/2BAYa2mfH3", "https://s.shopee.vn/2LTymLm1w6", "https://s.shopee.vn/2VnOyelOb9",
    "https://s.shopee.vn/16403uufg",  "https://s.shopee.vn/BPUCMuHKj",  "https://s.shopee.vn/LiuOftdzm",
    "https://s.shopee.vn/W2Kayt0ep",  "https://s.shopee.vn/gLknHsNJs",  "https://s.shopee.vn/qfAzarjyv",
    "https://s.shopee.vn/10ybBtr6dy", "https://s.shopee.vn/1BI1OCqTJ1", "https://s.shopee.vn/40cClPfgYa",
    "https://s.shopee.vn/4Avcxif3Dd", "https://s.shopee.vn/4LF3A1ePsg", "https://s.shopee.vn/4VYTMKdmXj",
    "https://s.shopee.vn/4frtYdd9Cm", "https://s.shopee.vn/4qBJkwcVrp", "https://s.shopee.vn/50UjxFbsWs",
    "https://s.shopee.vn/5AoA9YbFBv", "https://s.shopee.vn/2g6pAxklGS", "https://s.shopee.vn/2qQFNGk7vV",
    "https://s.shopee.vn/30jfZZjUaY", "https://s.shopee.vn/3B35lsirFb", "https://s.shopee.vn/3LMVyBiDue",
    "https://s.shopee.vn/3VfwAUhaZh", "https://s.shopee.vn/3fzMMngxEk", "https://s.shopee.vn/3qImZ6gJtn",
    "https://s.shopee.vn/7AZEXETd8S", "https://s.shopee.vn/70FoKvUGTR", "https://s.shopee.vn/6pwO8cUtoQ",
    "https://s.shopee.vn/6fcxwJVX9P", "https://s.shopee.vn/7povKSR5me", "https://s.shopee.vn/7fVV89Rj7d",
    "https://s.shopee.vn/7VC4vqSMSc", "https://s.shopee.vn/7KsejXSznb", "https://s.shopee.vn/5q3qwmYhqK",
    "https://s.shopee.vn/5fkQkTZLBJ", "https://s.shopee.vn/5VR0YAZyWI", "https://s.shopee.vn/5L7aLrabrH",
    "https://s.shopee.vn/6VJXk0WAUW", "https://s.shopee.vn/6L07XhWnpV", "https://s.shopee.vn/6AghLOXRAU",
    "https://s.shopee.vn/60NH95Y4VT", "https://s.shopee.vn/9pZzi8JTjE", "https://s.shopee.vn/9fGZVpK74D",
    "https://s.shopee.vn/9Ux9JWKkPC", "https://s.shopee.vn/9Kdj7DLNkB", "https://s.shopee.vn/AUpgVMGwNQ",
    "https://s.shopee.vn/AKWGJ3HZiP", "https://s.shopee.vn/AACq6kID3O", "https://s.shopee.vn/9ztPuRIqON",
    "https://s.shopee.vn/8V4c7gOYR6"
  ];

  onMount(() => {
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

    dismissed = false;

    const pick = (a: string[]) => a[(Math.random() * a.length) | 0];
    targetImg = pick(images);
    targetHref = pick(links);

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
      HIDE_MINUTES * 10 +
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
