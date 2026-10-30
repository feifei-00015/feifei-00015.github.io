export function initTaste(getPlaybackState) {
  const tastePage = document.querySelector("#tastePage");
  let marqueeImagesLoaded = false;
  let tasteEffectLoading = null;
  const tastePrevious = document.querySelector("#tastePrevious");
  const tasteNext = document.querySelector("#tasteNext");
  const tasteWord = document.querySelector("#tasteWord");
  const tasteKeywords = document.querySelector("#tasteKeywords");
  const tasteKeywordGroups = document.querySelector("#tasteKeywordGroups");
  const keywordSets = {
    Movie: [
      { label: "Directors", values: ["Christopher Nolan", "Denis Villeneuve", "Ang Lee"] },
      { label: "Genres", values: ["Science Fiction", "Mystery", "Epic", "Historical"] },
    ],
    "TV Show": [
      { label: "Networks & Streamers", values: ["HBO", "Netflix", "Apple TV+"] },
      { label: "Genres", values: ["Crime", "Science Fiction", "Mystery", "Comedy", "Medieval Epic"] },
    ],
    Book: [
      { label: "Subjects", values: ["Economics", "History", "Politics", "Philosophy", "Biography", "Practical Guides"] },
    ],
    Life: [
      { label: "", values: ["Cool Tones", "Black", "Silence", "ENTJ", "Calm", "Restraint"] },
    ],
  };
  let activeKeywordSet = "";
  const renderTasteKeywords = (word) => {
    const groups = keywordSets[word];
    if (!groups || word === activeKeywordSet) return;
    activeKeywordSet = word;
    tasteKeywordGroups.classList.toggle("is-single", groups.length === 1);
    tasteKeywordGroups.innerHTML = groups.map(({ label, values }) => `
      <section class="taste-keyword-group">
        ${label ? `<h3>${label}</h3>` : ""}
        <ul>${values.map((value) => `<li>${value}</li>`).join("")}</ul>
      </section>
    `).join("");
  };
  renderTasteKeywords(tasteWord.textContent.trim());
  new MutationObserver(() => {
    const swapping = tasteWord.classList.contains("swapping");
    tasteKeywords.classList.toggle("is-changing", swapping);
    if (!swapping) renderTasteKeywords(tasteWord.textContent.trim());
  }).observe(tasteWord, { attributes: true, attributeFilter: ["class"], childList: true });
  const marqueePage = document.querySelector("#marqueePage");
  const marqueeTracks = [
    ...document.querySelectorAll(".marquee-track"),
  ];
  let tasteEffect = null;
  tastePrevious.addEventListener("click", () => tasteEffect?.changeCategory(-1));
  tasteNext.addEventListener("click", () => tasteEffect?.changeCategory(1));
  const marqueeImages = [
    "../assets/marquee/preview-01.webp",
    "../assets/marquee/preview-02.webp",
    "../assets/marquee/preview-03.webp",
    "../assets/marquee/preview-04.webp",
    "../assets/marquee/preview-05.webp",
    "../assets/marquee/preview-06.webp",
    "../assets/marquee/preview-07.webp",
    "../assets/marquee/preview-08.webp",
    "../assets/marquee/preview-09.webp",
    "../assets/marquee/preview-10.webp",
  ];

  const createMarqueeSet = (images, rowIndex) => {
    const set = document.createElement("div");
    set.className = "marquee-set";
    images.forEach((source, imageIndex) => {
      const tile = document.createElement("div");
      tile.className = "marquee-tile";
      const image = document.createElement("img");
      image.alt = `作品预览 ${rowIndex + 1}-${imageIndex + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.draggable = false;
      image.dataset.src = source;
      tile.append(image);
      set.append(tile);
    });
    return set;
  };

  const marqueeRows = [marqueeImages.slice(0, 5), marqueeImages.slice(5)];
  marqueeTracks.forEach((track, rowIndex) => {
    for (let copy = 0; copy < 3; copy += 1) {
      track.append(createMarqueeSet(marqueeRows[rowIndex], rowIndex));
    }
  });

  const loadMarqueeImages = () => {
    if (marqueeImagesLoaded) return;
    marqueeImagesLoaded = true;
    marqueePage.querySelectorAll("img[data-src]").forEach((image) => {
      image.src = image.dataset.src;
      image.removeAttribute("data-src");
    });
  };

  const showTasteEffect = () => {
    if (tasteEffect) {
      tasteEffect.setVisible(true);
      return;
    }
    if (tasteEffectLoading) return;
    tasteEffectLoading = import("./taste-effect.js").then(({ mount }) => {
      tasteEffect = mount(
        document.querySelector("#tasteCanvas"),
        tasteWord,
      );
      const rect = tastePage.getBoundingClientRect();
      tasteEffect.setVisible(
        getPlaybackState() === "ended" &&
          rect.bottom > 0 && rect.top < innerHeight,
      );
    });
  };

  return {
    marqueeTracks,
    loadMarqueeImages,
    showTasteEffect,
    setVisible(visible) { tasteEffect?.setVisible(visible); },
  };
}
