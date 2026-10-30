import { clamp } from "./math.js";

export function initMood(carousel, reducedMotion) {
  const roundCarouselPage = document.querySelector("#roundCarouselPage");
  let activeMoodTrigger = null;
  let moodDetailAnimating = false;
  let activeMoodImageCard = null;
  const moodDetail = document.querySelector("#moodDetail");
  const projectDetails = {
    mood: moodDetail,
    "what-if": document.querySelector("#whatIfDetail"),
  };
  let activeProjectDetail = moodDetail;
  const moodTransitionCard = document.querySelector(
    "#moodTransitionCard",
  );
  const moodTransitionImage = moodTransitionCard.querySelector("img");
  const moodArcGallery = document.querySelector("#moodArcGallery");
  const moodArcViewport = document.querySelector("#moodArcViewport");
  const moodArcTrack = document.querySelector("#moodArcTrack");
  const moodImageViewer = document.querySelector("#moodImageViewer");
  const moodImageViewerImage = document.querySelector(
    "#moodImageViewerImage",
  );
  const moodImageViewerCaption = document.querySelector(
    "#moodImageViewerCaption",
  );
  const moodImageViewerClose = document.querySelector(
    "#moodImageViewerClose",
  );
  const setTransitionRect = (rect, radius) => {
    Object.assign(moodTransitionCard.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      borderRadius: radius,
    });
  };

  const moodArcImages = [
    {
      source: "../assets/mood/mood-cover.png",
      alt: "MOOD 产品概念桌面",
      caption: "MOOD product concept",
    },
    {
      source: "../assets/mood/mood-planning.png",
      alt: "MOOD 今日计划、长期计划与进度界面",
      caption: "Daily and long-term planning",
    },
    {
      source: "../assets/mood/mood-calendar.png",
      alt: "MOOD 情绪日历与趋势分析界面",
      caption: "Mood calendar and trend analysis",
    },
    {
      source: "../assets/mood/mood-memory-index.webp",
      alt: "MOOD 事件回忆录与故事索引界面",
      caption: "Memory archive and story index",
    },
    {
      source: "../assets/mood/mood-chat.webp",
      alt: "MOOD 陪我聊聊对话界面",
      caption: "Context-aware companion chat",
    },
    {
      source: "../assets/mood/mood-event-detail.webp",
      alt: "MOOD 事件详情与回忆整理界面",
      caption: "Event details and memory review",
    },
    {
      source: "../assets/mood/mood-calendar-expanded.webp",
      alt: "MOOD 情绪日历完整界面",
      caption: "Expanded mood calendar",
    },
    {
      source: "../assets/mood/mood-postcards.webp",
      alt: "MOOD 个人邮票收藏界面",
      caption: "Personal postcard collection",
    },
    {
      source: "../assets/mood/mood-focus-timer.webp",
      alt: "MOOD 沉浸式番茄钟界面",
      caption: "Immersive focus timer",
    },
    {
      source: "../assets/mood/mood-context-flow.png",
      alt: "MOOD 从记录到长期上下文的产品流程",
      caption: "From records to personal context",
    },
  ];
  const moodArcItems = [
    ...moodArcImages,
    ...moodArcImages,
    ...moodArcImages,
  ];
  const moodArcCards = [];
  const moodArc = {
    offset: 0,
    velocity: 0,
    lastTime: 0,
    visible: false,
    dragging: false,
    pointerX: 0,
    pointerTime: 0,
    dragDistance: 0,
  };

  moodArcItems.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "mood-arc-card";
    card.dataset.caption = item.caption;
    card.setAttribute("aria-label", `${item.caption}，点击放大`);
    const frame = document.createElement("span");
    frame.className = "mood-arc-card__frame";
    const image = document.createElement("img");
    image.src = item.source;
    image.alt = item.alt;
    image.loading = "lazy";
    image.decoding = "async";
    image.draggable = false;
    frame.append(image);
    card.append(frame);
    card.dataset.index = String(index);
    moodArcTrack.append(card);
    moodArcCards.push(card);
  });

  const renderMoodArcGallery = () => {
    const viewportWidth = moodArcViewport.clientWidth;
    const cardWidth = moodArcCards[0]?.offsetWidth || 340;
    const spacing = cardWidth + 18;
    const cycle = spacing * moodArcCards.length;

    moodArcCards.forEach((card, index) => {
      let x = index * spacing + moodArc.offset;
      x = ((x + cycle / 2) % cycle + cycle) % cycle - cycle / 2;

      const normalized = clamp(
        x / Math.max(1, viewportWidth * 0.58),
        -1.35,
        1.35,
      );
      const distance = Math.abs(normalized);
      const rotateY = -clamp(normalized, -1, 1) * 34;
      const translateZ = -Math.min(distance, 1.25) * 150;
      const translateY = Math.min(distance, 1.2) ** 2 * 38;
      const scale = 1 - Math.min(distance, 1) * 0.08;
      const fadeStart = viewportWidth * 0.52;
      const opacity = clamp(
        1 - (Math.abs(x) - fadeStart) / (viewportWidth * 0.16),
      );

      card.style.opacity = String(opacity);
      card.style.zIndex = String(
        Math.max(1, 100 - Math.round(distance * 50)),
      );
      card.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${translateY}px), ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.pointerEvents = opacity > 0.35 ? "auto" : "none";
    });
  };

  const openMoodImageViewer = (card) => {
    const image = card.querySelector("img");
    activeMoodImageCard = card;
    moodImageViewerImage.src = image.currentSrc || image.src;
    moodImageViewerImage.alt = image.alt;
    moodImageViewerCaption.textContent = card.dataset.caption;
    moodImageViewer.classList.add("is-open");
    moodImageViewer.setAttribute("aria-hidden", "false");
    moodDetail.classList.add("has-image-viewer");
    moodImageViewerClose.focus({ preventScroll: true });
  };

  const closeMoodImageViewer = (restoreFocus = true) => {
    if (!moodImageViewer.classList.contains("is-open")) return;
    moodImageViewer.classList.remove("is-open");
    moodImageViewer.setAttribute("aria-hidden", "true");
    moodDetail.classList.remove("has-image-viewer");
    if (restoreFocus) activeMoodImageCard?.focus({ preventScroll: true });
  };

  moodArcCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (moodArc.dragDistance > 7) {
        event.preventDefault();
        return;
      }
      openMoodImageViewer(card);
    });
  });
  moodArcViewport.addEventListener("pointerdown", (event) => {
    moodArc.dragging = true;
    moodArc.pointerX = event.clientX;
    moodArc.pointerTime = performance.now();
    moodArc.dragDistance = 0;
    moodArc.velocity = 0;
    moodArcViewport.classList.add("is-dragging");
    moodArcViewport.setPointerCapture?.(event.pointerId);
  });
  moodArcViewport.addEventListener("pointermove", (event) => {
    if (!moodArc.dragging) return;
    const now = performance.now();
    const deltaX = event.clientX - moodArc.pointerX;
    const elapsed = Math.max(16, now - moodArc.pointerTime);
    moodArc.offset += deltaX;
    moodArc.velocity = (deltaX / elapsed) * 1000;
    moodArc.dragDistance += Math.abs(deltaX);
    moodArc.pointerX = event.clientX;
    moodArc.pointerTime = now;
    renderMoodArcGallery();
  });
  const releaseMoodArc = (event) => {
    if (!moodArc.dragging) return;
    moodArc.dragging = false;
    moodArcViewport.classList.remove("is-dragging");
    moodArcViewport.releasePointerCapture?.(event.pointerId);
  };
  moodArcViewport.addEventListener("pointerup", releaseMoodArc);
  moodArcViewport.addEventListener("pointercancel", releaseMoodArc);
  moodImageViewerClose.addEventListener("click", () =>
    closeMoodImageViewer(),
  );
  moodImageViewer.addEventListener("click", (event) => {
    if (event.target === moodImageViewer) closeMoodImageViewer();
  });

  const moodArcObserver = new IntersectionObserver(
    ([entry]) => {
      moodArc.visible = entry.isIntersecting;
    },
    { root: moodDetail, threshold: 0.2 },
  );
  moodArcObserver.observe(moodArcGallery);

  const animateMoodArc = (now) => {
    const delta = moodArc.lastTime
      ? Math.min((now - moodArc.lastTime) / 1000, 0.1)
      : 0;
    moodArc.lastTime = now;
    if (
      !reducedMotion.matches &&
      moodDetail.classList.contains("is-open") &&
      moodArc.visible &&
      !moodArc.dragging &&
      !moodImageViewer.classList.contains("is-open")
    ) {
      if (Math.abs(moodArc.velocity) > 2) {
        moodArc.offset += moodArc.velocity * delta;
        moodArc.velocity *= Math.pow(0.9, delta * 60);
      } else {
        moodArc.offset += 42 * delta;
      }
    }
    renderMoodArcGallery();
    requestAnimationFrame(animateMoodArc);
  };

  renderMoodArcGallery();

  const openProjectDetail = async (trigger) => {
    const moodDetail = projectDetails[trigger?.dataset.project] || projectDetails.mood;
    if (
      !trigger ||
      moodDetailAnimating ||
      activeProjectDetail.classList.contains("is-open")
    ) {
      return;
    }

    moodDetailAnimating = true;
    activeMoodTrigger = trigger;
    activeProjectDetail = moodDetail;
    const fromRoundCarousel = trigger.classList.contains(
      "round-carousel-item",
    );
    const sourceVisual = fromRoundCarousel
      ? trigger.querySelector(".round-carousel-face--front")
      : trigger;
    const sourceRect = sourceVisual.getBoundingClientRect();
    const sourceRadius = getComputedStyle(sourceVisual).borderRadius;
    const sourceImage = sourceVisual.querySelector("img");
    if (sourceImage) {
      moodTransitionImage.src = sourceImage.currentSrc || sourceImage.src;
    }

    if (fromRoundCarousel) {
      carousel.detailOpen = true;
      carousel.detailAnimating = true;
      carousel.selectedItem = trigger;
      carousel.velocity = 0;
      trigger.classList.add("is-selected");
      roundCarouselPage.classList.add("has-detail", "is-opening");
    }

    moodDetail.scrollTop = 0;
    moodDetail.classList.add("is-open");
    moodDetail.setAttribute("aria-hidden", "false");
    document.body.classList.add("mood-detail-open");

    if (!reducedMotion.matches) {
      moodTransitionCard.hidden = false;
      setTransitionRect(sourceRect, sourceRadius);
      const animation = moodTransitionCard.animate(
        [
          {
            top: `${sourceRect.top}px`,
            left: `${sourceRect.left}px`,
            width: `${sourceRect.width}px`,
            height: `${sourceRect.height}px`,
            borderRadius: sourceRadius,
          },
          {
            top: "0px",
            left: "0px",
            width: `${window.innerWidth}px`,
            height: `${window.innerHeight}px`,
            borderRadius: "0px",
          },
        ],
        {
          duration: 760,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
      await animation.finished.catch(() => {});
      moodDetail.classList.add("is-revealed");
      moodTransitionCard.hidden = true;
      animation.cancel();
    } else {
      moodDetail.classList.add("is-revealed");
    }

    moodDetail.classList.add("is-content-visible");
    moodDetail.querySelector("video")?.play().catch(() => {});
    moodDetail.querySelector(".mood-detail__back").focus({ preventScroll: true });
    if (fromRoundCarousel) {
      roundCarouselPage.classList.remove("is-opening");
      carousel.detailAnimating = false;
    }
    moodDetailAnimating = false;
  };

  const closeProjectDetail = async () => {
    const moodDetail = activeProjectDetail;
    if (moodDetailAnimating || !moodDetail.classList.contains("is-open")) {
      return;
    }

    moodDetailAnimating = true;
    moodDetail.classList.remove("is-content-visible");
    const targetVisual = activeMoodTrigger?.classList.contains(
      "round-carousel-item",
    )
      ? activeMoodTrigger.querySelector(".round-carousel-face--front")
      : activeMoodTrigger;
    const targetRect = targetVisual?.getBoundingClientRect();

    if (!reducedMotion.matches && targetRect) {
      moodTransitionCard.hidden = false;
      setTransitionRect(
        {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        },
        "0px",
      );
      moodDetail.classList.remove("is-revealed");
      const targetRadius = getComputedStyle(targetVisual).borderRadius;
      const animation = moodTransitionCard.animate(
        [
          {
            top: "0px",
            left: "0px",
            width: `${window.innerWidth}px`,
            height: `${window.innerHeight}px`,
            borderRadius: "0px",
          },
          {
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            borderRadius: targetRadius,
          },
        ],
        {
          duration: 680,
          easing: "cubic-bezier(0.64, 0, 0.78, 0)",
          fill: "forwards",
        },
      );
      await animation.finished.catch(() => {});
      moodTransitionCard.hidden = true;
      animation.cancel();
    }

    moodDetail.classList.remove("is-revealed");
    moodDetail.classList.remove("is-open");
    moodDetail.setAttribute("aria-hidden", "true");
    document.body.classList.remove("mood-detail-open");
    moodDetail.querySelector("video")?.pause();
    closeMoodImageViewer(false);
    if (activeMoodTrigger?.classList.contains("round-carousel-item")) {
      activeMoodTrigger.classList.remove("is-selected");
      roundCarouselPage.classList.remove("has-detail", "is-opening");
      carousel.detailOpen = false;
      carousel.detailAnimating = false;
      carousel.selectedItem = null;
    }
    activeMoodTrigger?.focus({ preventScroll: true });
    moodDetailAnimating = false;
  };

  Object.values(projectDetails).forEach((detail) => {
    detail.querySelector(".mood-detail__back").addEventListener("click", closeProjectDetail);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeProjectDetail.classList.contains("is-open")) {
      if (moodImageViewer.classList.contains("is-open")) {
        closeMoodImageViewer();
      } else {
        closeProjectDetail();
      }
    }
  });

  return { renderMoodArcGallery, animateMoodArc, openProjectDetail };
}
