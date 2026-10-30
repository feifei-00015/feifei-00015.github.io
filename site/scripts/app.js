import { clamp, mix, range, smoothstep } from "./math.js";
import { initTaste } from "./taste.js";
import { initMood } from "./mood.js";
import { initCarousel } from "./carousel.js";
import { initSkills } from "./skills.js";
import { initLanyards } from "./lanyards.js";

(() => {
  const VIDEO_START = 0.5;
  const GALLERY_START = 0.72;
  const TASTE_SETTLE_MS = 2000;

  const track = document.querySelector("#story");
  const stage = document.querySelector("#stage");
  const person = document.querySelector(".portrait--person");
  const cowboy = document.querySelector(".portrait--cowboy");
  const videoLayer = document.querySelector("#videoLayer");
  const motionVideo = document.querySelector("#motionVideo");
  const reverseVideo = document.querySelector("#reverseVideo");
  const introElements = [document.querySelector(".hero-copy")];
  const profileTitle = document.querySelector(".profile-title");
  const profileBlocks = [...document.querySelectorAll(".profile-block")];
  const profileConnectors = [
    ...document.querySelectorAll(".profile-connector"),
  ].map((element) => {
    const path = element.querySelector("path");
    return { element, path, length: path.getTotalLength() };
  });
  const download = document.querySelector(".download-cv");
  const tastePage = document.querySelector("#tastePage");
  const marqueePage = document.querySelector("#marqueePage");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  const pointer = {
    active: false,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  let targetProgress = 0;
  let renderedProgress = 0;
  let playbackState = "idle";
  let lockedScrollY = 0;
  let tasteEnteredAt = 0;
  let reverseIntent = 0;
  let lastReverseInput = 0;
  let touchY = 0;
  const carousel = {
    rotation: 0,
    velocity: 0,
    lastTime: 0,
    visible: false,
    dragActive: false,
    dragX: 0,
    dragY: 0,
    dragDistance: 0,
    pressedItem: null,
    detailOpen: false,
    detailAnimating: false,
    selectedItem: null,
  };

  const taste = initTaste(() => playbackState);
  const { marqueeTracks } = taste;
  const mood = initMood(carousel, reducedMotion);
  const projectCarousel = initCarousel(carousel, reducedMotion, mood.openProjectDetail);
  initSkills();
  const { lanyards, animateLanyards } = initLanyards(reducedMotion);

  const updateConnectorGeometry = () => {
    const outerX = (profileBlocks[0].offsetLeft / stage.clientWidth) * 100;
    const bendX =
      ((profileBlocks[0].offsetLeft + profileBlocks[0].offsetWidth) /
        stage.clientWidth) *
      100;
    const topInnerX = bendX + 5;
    const bottomInnerX = bendX + 6;
    const paths = [
      `M ${topInnerX} 53 L ${bendX} 46 H ${outerX}`,
      `M ${100 - topInnerX} 53 L ${100 - bendX} 46 H ${100 - outerX}`,
      `M ${bottomInnerX} 70 L ${bendX} 84 H ${outerX}`,
      `M ${100 - bottomInnerX} 70 L ${100 - bendX} 84 H ${100 - outerX}`,
    ];

    profileConnectors.forEach((connector, index) => {
      connector.path.setAttribute("d", paths[index]);
      connector.element
        .querySelector("ellipse")
        .setAttribute(
          "cx",
          String(
            index === 0
              ? topInnerX
              : index === 1
                ? 100 - topInnerX
                : index === 2
                  ? bottomInnerX
                  : 100 - bottomInnerX,
          ),
        );
      connector.length = connector.path.getTotalLength();
    });
  };

  const progressToScroll = (progress) => {
    const scrollable = track.offsetHeight - window.innerHeight;
    return track.offsetTop + scrollable * progress;
  };

  const positionTastePage = () => {
    tastePage.style.top = `${progressToScroll(VIDEO_START) - track.offsetTop}px`;
  };

  const showVideo = (video) => {
    motionVideo.classList.toggle("is-active", video === motionVideo);
    reverseVideo.classList.toggle("is-active", video === reverseVideo);
  };

  const mirroredVideoTime = (source, target) => {
    if (
      !Number.isFinite(source.duration) ||
      !Number.isFinite(target.duration) ||
      source.duration <= 0 ||
      target.duration <= 0
    ) {
      return 0;
    }

    const sourceProgress = clamp(source.currentTime / source.duration);
    return (1 - sourceProgress) * target.duration;
  };

  const lockAtVideo = () => {
    lockedScrollY = progressToScroll(VIDEO_START);
    targetProgress = VIDEO_START;
    renderedProgress = VIDEO_START;
    window.scrollTo(0, lockedScrollY);
    render(VIDEO_START);
  };

  const startForward = async () => {
    if (playbackState !== "idle" && playbackState !== "reverse") return;
    const continuingFromReverse = playbackState === "reverse";
    playbackState = "forward";
    lockAtVideo();
    reverseVideo.pause();
    motionVideo.currentTime = continuingFromReverse
      ? mirroredVideoTime(reverseVideo, motionVideo)
      : 0;
    showVideo(motionVideo);

    try {
      await motionVideo.play();
    } catch {
      playbackState = "idle";
    }
  };

  const startReverse = async () => {
    if (playbackState !== "ended" && playbackState !== "forward") return;
    const continuingFromForward = playbackState === "forward";
    playbackState = "reverse";
    reverseIntent = 0;
    lockAtVideo();
    motionVideo.pause();
    reverseVideo.currentTime = continuingFromForward
      ? mirroredVideoTime(motionVideo, reverseVideo)
      : 0;
    showVideo(reverseVideo);

    try {
      await reverseVideo.play();
    } catch {
      playbackState = "ended";
      showVideo(motionVideo);
    }
  };

  const setIntroStyle = (element, amount) => {
    const eased = smoothstep(amount);
    element.style.opacity = String(1 - eased);
    element.style.transform = `translateY(${mix(0, -16, eased)}px) scale(${mix(1, 0.98, eased)})`;
    element.style.filter = `blur(${mix(0, 8, eased)}px)`;
  };

  const profileVisibility = (progress, order) => {
    const start = 0.18 + order * 0.022;
    const appear = smoothstep(range(progress, start, start + 0.065));
    const disappear = smoothstep(range(progress, 0.4, VIDEO_START));
    return { appear, disappear, visibility: appear * (1 - disappear) };
  };

  const renderProfileBlock = (block, progress, order) => {
    const { appear, disappear, visibility } = profileVisibility(
      progress,
      order,
    );
    const overshoot =
      appear < 0.72
        ? mix(0.9, 1.03, appear / 0.72)
        : mix(1.03, 1, (appear - 0.72) / 0.28);
    block.style.opacity = String(visibility);
    block.style.transform = `translateY(${mix(
      mix(12, 0, appear),
      -8,
      disappear,
    )}px) scale(${mix(overshoot, 0.98, disappear)})`;
    block.style.filter = `blur(${mix(
      mix(8, 0, appear),
      6,
      disappear,
    )}px)`;
  };

  const render = (progress) => {
    const introFade = range(progress, 0, 0.12);
    const introEase = smoothstep(introFade);
    const viewportRadius = Math.hypot(window.innerWidth, window.innerHeight);
    const startingRadius = pointer.active
      ? Math.min(270, Math.max(180, window.innerWidth * 0.2))
      : 0;

    stage.style.setProperty(
      "--x",
      `${mix(pointer.x, window.innerWidth / 2, introEase)}px`,
    );
    stage.style.setProperty(
      "--y",
      `${mix(pointer.y, window.innerHeight / 2, introEase)}px`,
    );
    stage.style.setProperty(
      "--mask-radius",
      `${mix(startingRadius, viewportRadius * 1.15, introEase)}px`,
    );

    person.style.opacity = String(1 - introEase);
    person.style.transform = `translateY(${mix(5, 0, introEase)}vh)`;
    cowboy.style.transform = `translateY(${mix(5, 0, introEase)}vh)`;
    cowboy.style.opacity = String(
      1 - smoothstep(range(progress, 0.14, 0.2)),
    );
    videoLayer.style.opacity = String(
      smoothstep(range(progress, 0.14, 0.2)) *
        (playbackState === "ended" ? 0 : 1),
    );

    introElements.forEach((element) => setIntroStyle(element, introFade));
    renderProfileBlock(profileTitle, progress, -1);
    profileConnectors.forEach((connector, index) => {
      const lineStart = 0.16 + index * 0.022;
      const lineDraw = smoothstep(
        range(progress, lineStart, lineStart + 0.075),
      );
      const lineFade = smoothstep(range(progress, 0.4, VIDEO_START));
      connector.element.style.setProperty("--draw", String(lineDraw));
      connector.element.style.opacity = String(
        lineDraw * (1 - lineFade),
      );
      connector.path.style.strokeDasharray = String(connector.length);
      connector.path.style.strokeDashoffset = String(
        connector.length * (1 - lineDraw),
      );
    });
    profileBlocks.forEach((block, index) =>
      renderProfileBlock(block, progress, index),
    );

    const downloadState = profileVisibility(progress, 4);
    download.style.opacity = String(downloadState.visibility);
    download.style.transform = `translateY(${mix(
      mix(12, 0, downloadState.appear),
      -8,
      downloadState.disappear,
    )}px) scale(${mix(
      mix(0.94, 1, downloadState.appear),
      0.98,
      downloadState.disappear,
    )})`;
    download.style.filter = `blur(${mix(
      mix(8, 0, downloadState.appear),
      6,
      downloadState.disappear,
    )}px)`;
    download.style.pointerEvents =
      downloadState.visibility > 0.7 ? "auto" : "none";

    const galleryVisibility =
      playbackState === "ended" &&
      performance.now() - tasteEnteredAt >= TASTE_SETTLE_MS ? 1 : 0;
    const tasteVisibility = playbackState === "ended" ? 1 : 0;
    const galleryProgress = smoothstep(
      range(progress, GALLERY_START, 1),
    );
    const travel = stage.clientWidth * 0.52;
    marqueeTracks.forEach((track, index) => {
      const setWidth = track.querySelector(".marquee-set")?.offsetWidth || 0;
      const direction = index === 0 ? 1 : -1;
      const offset =
        -setWidth + direction * mix(-travel / 2, travel / 2, galleryProgress);
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    });
    tastePage.style.opacity = String(tasteVisibility);
    marqueePage.style.opacity = String(galleryVisibility);
    const stageRect = tastePage.getBoundingClientRect();
    taste.setVisible(
      Number(getComputedStyle(tastePage).opacity) > 0.01 &&
        stageRect.bottom > 0 && stageRect.top < innerHeight,
    );
    stage.classList.toggle("is-at-top", progress < 0.003);
  };

  const updateTargetProgress = () => {
    if (reducedMotion.matches) return;

    if (playbackState === "forward" || playbackState === "reverse") {
      if (Math.abs(window.scrollY - lockedScrollY) > 1) {
        window.scrollTo(0, lockedScrollY);
      }
      targetProgress = VIDEO_START;
      return;
    }

    const rect = track.getBoundingClientRect();
    const scrollable = track.offsetHeight - window.innerHeight;
    targetProgress = clamp(-rect.top / Math.max(1, scrollable));

    if (playbackState === "idle" && targetProgress >= VIDEO_START) {
      startForward();
    } else if (
      playbackState === "ended" &&
      (targetProgress < VIDEO_START ||
        performance.now() - tasteEnteredAt < TASTE_SETTLE_MS)
    ) {
      window.scrollTo(0, progressToScroll(VIDEO_START));
      targetProgress = VIDEO_START;
    }

  };

  const animationLoop = () => {
    pointer.x += (pointer.targetX - pointer.x) * 0.12;
    pointer.y += (pointer.targetY - pointer.y) * 0.12;

    if (
      !reducedMotion.matches &&
      playbackState !== "forward" &&
      playbackState !== "reverse"
    ) {
      const difference = targetProgress - renderedProgress;
      renderedProgress += difference * 0.24;
      if (Math.abs(difference) < 0.00005) {
        renderedProgress = targetProgress;
      }
      render(renderedProgress);
    }

    requestAnimationFrame(animationLoop);
  };

  const requestTasteReverse = (distance, threshold) => {
    const now = performance.now();
    if (now - tasteEnteredAt < TASTE_SETTLE_MS) {
      reverseIntent = 0;
      return;
    }
    if (now - lastReverseInput > 550) reverseIntent = 0;
    lastReverseInput = now;
    reverseIntent += Math.min(distance, 120);
    if (reverseIntent >= threshold) startReverse();
  };

  const handleTouchMove = (event) => {
    if (playbackState === "forward" || playbackState === "reverse") {
      event.preventDefault();
      return;
    }
    const nextY = event.touches[0]?.clientY ?? touchY;
    const delta = nextY - touchY;
    touchY = nextY;
    if (
      playbackState === "ended" &&
      performance.now() - tasteEnteredAt < TASTE_SETTLE_MS
    ) {
      event.preventDefault();
      return;
    }
    if (
      playbackState === "ended" &&
      targetProgress <= VIDEO_START + 0.003 &&
      delta > 0
    ) {
      event.preventDefault();
      requestTasteReverse(delta, 300);
    }
  };

  const handleWheel = (event) => {
    if (playbackState === "forward" || playbackState === "reverse") {
      event.preventDefault();

      if (playbackState === "forward" && event.deltaY < 0) {
        startReverse();
      } else if (playbackState === "reverse" && event.deltaY > 0) {
        startForward();
      }
      return;
    }

    if (
      playbackState === "ended" &&
      performance.now() - tasteEnteredAt < TASTE_SETTLE_MS
    ) {
      event.preventDefault();
      reverseIntent = 0;
      return;
    }

    if (playbackState === "ended" && event.deltaY > 0) {
      reverseIntent = 0;
    } else if (
      playbackState === "ended" &&
      event.deltaY < 0 &&
      targetProgress <= VIDEO_START + 0.003
    ) {
      event.preventDefault();
      const distance = -event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      requestTasteReverse(distance, 360);
    }
  };

  motionVideo.addEventListener("ended", () => {
    stage.classList.add("is-taste-transitioning");
    getComputedStyle(tastePage).opacity;
    playbackState = "ended";
    tasteEnteredAt = performance.now();
    reverseIntent = 0;
    targetProgress = VIDEO_START;
    renderedProgress = VIDEO_START;
    render(VIDEO_START);
    taste.showTasteEffect();
    taste.loadMarqueeImages();
    setTimeout(() => stage.classList.remove("is-taste-transitioning"), 1700);
  });

  reverseVideo.addEventListener("ended", () => {
    playbackState = "idle";
    motionVideo.currentTime = 0;
    showVideo(motionVideo);
    targetProgress = VIDEO_START - 0.001;
    renderedProgress = targetProgress;
  });

  stage.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch" || targetProgress > 0.003) return;
    pointer.active = true;
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    stage.classList.add("is-pointer-active");
  });

  stage.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch" || targetProgress > 0.003) return;
      pointer.active = true;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      stage.classList.add("is-pointer-active");
    },
    { passive: true },
  );

  stage.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    pointer.active = false;
    stage.classList.remove("is-pointer-active");
  });

  window.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("keydown", (event) => {
    if (
      playbackState === "ended" &&
      (event.key === "ArrowDown" || event.key === "PageDown" ||
        event.key === " " || event.key === "End") &&
      performance.now() - tasteEnteredAt < TASTE_SETTLE_MS
    ) event.preventDefault();
  });
  window.addEventListener("touchstart", (event) => {
    touchY = event.touches[0]?.clientY ?? 0;
    reverseIntent = 0;
  }, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  window.addEventListener("scroll", updateTargetProgress, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      positionTastePage();
      updateConnectorGeometry();
      mood.renderMoodArcGallery();
      lanyards.forEach((controller) => controller.resize());
      updateTargetProgress();
    },
    { passive: true },
  );

  updateConnectorGeometry();
  positionTastePage();
  lanyards.forEach((controller) => controller.resize());
  updateTargetProgress();
  animationLoop();
  requestAnimationFrame(projectCarousel.animateCarousel);
  requestAnimationFrame(mood.animateMoodArc);
  requestAnimationFrame(animateLanyards);
})();
