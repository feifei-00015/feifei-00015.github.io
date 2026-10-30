export function initCarousel(carousel, reducedMotion, openProjectDetail) {
  const roundCarouselPage = document.querySelector("#roundCarouselPage");
  const roundCarouselRing = document.querySelector("#roundCarouselRing");
  const carouselDetail = document.querySelector("#carouselDetail");
  const carouselDetailMedia = document.querySelector(
    "#carouselDetailMedia",
  );
  const carouselDetailImage = document.querySelector(
    "#carouselDetailImage",
  );
  const carouselDetailBack = document.querySelector(
    "#carouselDetailBack",
  );
  const carouselDetailIndex = document.querySelector(
    "#carouselDetailIndex",
  );
  const carouselDetailTitle = document.querySelector(
    "#carouselDetailTitle",
  );
  const carouselDetailHeroMeta = document.querySelector(
    "#carouselDetailHeroMeta",
  );
  const carouselDetailSummary = document.querySelector(
    "#carouselDetailSummary",
  );
  const carouselDetailRole = document.querySelector(
    "#carouselDetailRole",
  );
  const carouselDetailType = document.querySelector(
    "#carouselDetailType",
  );
  const carouselDetailYear = document.querySelector(
    "#carouselDetailYear",
  );
  const carouselTransitionCard = document.querySelector(
    "#carouselTransitionCard",
  );
  const carouselTransitionImage = document.querySelector(
    "#carouselTransitionImage",
  );
  document.body.append(carouselDetail, carouselTransitionCard);

  const carouselImages = Array.from({ length: 8 }, (_, index) =>
    index % 2 === 0
      ? "../assets/mood/mood-logo.png"
      : "../assets/what-if/cover-placeholder.svg",
  );
  const carouselProjects = [
    {
      title: "AETHER VOYAGE",
      category: "IMMERSIVE LANDING PAGE",
      summary:
        "以开阔的自然场景和轻盈的内容层级，构建一段从地面延伸到宇宙的沉浸式品牌旅程。",
      role: "Visual / UI Design",
      type: "Web Experience",
      year: "2026",
    },
    {
      title: "CODENEST",
      category: "EDUCATION PLATFORM",
      summary:
        "用高对比度视觉和明确的行动路径，让课程价值、学习方式与转化入口快速建立联系。",
      role: "UI / Interaction",
      type: "Education Website",
      year: "2026",
    },
    {
      title: "VEX VENTURES",
      category: "VENTURE STUDIO",
      summary:
        "围绕城市、投资和未来愿景建立可信且克制的叙事，让品牌表达与业务信息保持平衡。",
      role: "Art Direction",
      type: "Corporate Website",
      year: "2026",
    },
    {
      title: "SYNC AI",
      category: "AI PRODUCT",
      summary:
        "通过极简排版与柔和自然视觉，为复杂的人工智能产品建立轻松、清晰的第一印象。",
      role: "Product / UI Design",
      type: "SaaS Landing Page",
      year: "2026",
    },
    {
      title: "ASME",
      category: "EDITORIAL EXPERIENCE",
      summary:
        "以深色编辑风格承载内容探索，通过富有想象力的主视觉强化好奇心与品牌记忆。",
      role: "Creative Direction",
      type: "Editorial Website",
      year: "2026",
    },
    {
      title: "DATA PATH",
      category: "DATA PLATFORM",
      summary:
        "把数据分析流程转化为直观的操作路径，并用自然环境隐喻降低工具型产品的理解成本。",
      role: "UX / UI Design",
      type: "Product Website",
      year: "2026",
    },
    {
      title: "STELLAR WORKSPACE",
      category: "AI WORKSPACE",
      summary:
        "将产品操作、功能结构和幻想场景结合，让自动化工作流以更具吸引力的方式被理解。",
      role: "Product Design",
      type: "AI Platform",
      year: "2026",
    },
    {
      title: "BRANDLY",
      category: "BRAND STUDIO",
      summary:
        "使用强烈的黑白排版与单一强调色，塑造直接、年轻且具有识别度的品牌工作室形象。",
      role: "Brand / Web Design",
      type: "Portfolio Website",
      year: "2026",
    },
  ];
  const carouselAngle = 360 / carouselImages.length;
  const carouselRadius =
    (300 * (1 + 3 * 0.15)) /
    (2 * Math.tan(Math.PI / carouselImages.length));
  carouselImages.forEach((source, index) => {
    const item = document.createElement("div");
    item.className = "round-carousel-item";
    item.dataset.source = source;
    item.dataset.index = String(index);
    item.dataset.project = index % 2 === 0 ? "mood" : "what-if";
    const projectName = index % 2 === 0 ? "MOOD" : "WHAT_IF";
    item.style.setProperty(
      "--retreat-delay",
      `${Math.min(index, carouselImages.length - index) * 22}ms`,
    );
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `查看 ${projectName} 项目 ${index + 1}`);
    item.style.transform = `rotateY(${index * carouselAngle}deg) translateZ(${carouselRadius}px)`;

    ["front", "back"].forEach((side) => {
      const face = document.createElement("div");
      face.className = `round-carousel-face round-carousel-face--${side}`;
      const image = document.createElement("img");
      image.src = source;
      image.alt = side === "front" ? `${projectName} 项目预览 ${index + 1}` : "";
      image.loading = "lazy";
      image.decoding = "async";
      image.draggable = false;
      face.append(image);
      item.append(face);
    });

    roundCarouselRing.append(item);
  });

  const applyCarouselRotation = () => {
    roundCarouselRing.style.transform = `translateZ(${-carouselRadius}px) rotateY(${carousel.rotation}deg)`;
  };

  const getCarouselDetailTarget = () => ({
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const carouselTransitionFrame = (rect, borderRadius, opacity = 1) => ({
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius,
    opacity,
  });

  const runCarouselTransition = async (
    from,
    to,
    fromRadius,
    opening,
  ) => {
    if (reducedMotion.matches) return;

    const duration = opening ? 820 : 720;
    const keyframes = opening
      ? [
          {
            ...carouselTransitionFrame(from, fromRadius),
            transform: "scale(1)",
          },
          {
            ...carouselTransitionFrame(
              {
                left: from.left + (to.left - from.left) * 0.55,
                top: from.top + (to.top - from.top) * 0.55,
                width: from.width + (to.width - from.width) * 0.55,
                height: from.height + (to.height - from.height) * 0.55,
              },
              "24px",
            ),
            transform: "scale(1.018)",
            offset: 0.48,
          },
          {
            ...carouselTransitionFrame(to, "0px"),
            transform: "scale(1)",
          },
        ]
      : [
          {
            ...carouselTransitionFrame(from, "0px"),
            transform: "scale(1)",
          },
          {
            ...carouselTransitionFrame(
              {
                left: from.left + (to.left - from.left) * 0.62,
                top: from.top + (to.top - from.top) * 0.62,
                width: from.width + (to.width - from.width) * 0.62,
                height: from.height + (to.height - from.height) * 0.62,
              },
              "22px",
            ),
            transform: "scale(1.015)",
            offset: 0.54,
          },
          {
            ...carouselTransitionFrame(to, fromRadius),
            transform: "scale(1)",
          },
        ];
    carouselTransitionCard.style.transformOrigin = "50% 50%";
    const animation = carouselTransitionCard.animate(keyframes, {
      duration,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    });

    await animation.finished.catch(() => undefined);
    animation.cancel();
  };

  const setCarouselProject = (index) => {
    const project = carouselProjects[index] || carouselProjects[0];
    const number = String(index + 1).padStart(2, "0");
    carouselDetailIndex.textContent = `PROJECT ${number}`;
    carouselDetailTitle.textContent = project.title;
    carouselDetailHeroMeta.textContent = `${project.category}\n${project.year}`;
    carouselDetailSummary.textContent = project.summary;
    carouselDetailRole.textContent = project.role;
    carouselDetailType.textContent = project.type;
    carouselDetailYear.textContent = project.year;
  };

  const scrollCarouselDetailToTop = () =>
    new Promise((resolve) => {
      if (carouselDetail.scrollTop < 2 || reducedMotion.matches) {
        carouselDetail.scrollTop = 0;
        resolve();
        return;
      }

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        carouselDetail.scrollTop = 0;
        resolve();
      };
      const watch = () => {
        if (carouselDetail.scrollTop < 2) {
          finish();
          return;
        }
        if (!finished) requestAnimationFrame(watch);
      };
      carouselDetail.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(watch);
      window.setTimeout(finish, 650);
    });

  const openCarouselDetail = async (item) => {
    if (
      !item ||
      carousel.detailOpen ||
      carousel.detailAnimating
    ) {
      return;
    }

    const face = item.querySelector(".round-carousel-face--front");
    const sourceRect = face.getBoundingClientRect();
    const sourceRadius = getComputedStyle(face).borderRadius;
    const targetRect = getCarouselDetailTarget();
    const source = item.dataset.source;
    const index = Number(item.dataset.index);

    carousel.detailOpen = true;
    carousel.detailAnimating = true;
    carousel.selectedItem = item;
    carousel.velocity = 0;
    setCarouselProject(index);
    carouselDetailImage.src = source;
    carouselDetailImage.alt = `${carouselProjects[index].title} 项目预览`;
    carouselTransitionImage.src = source;
    carouselDetail.scrollTop = 0;

    document.body.classList.add("carousel-detail-open");
    item.classList.add("is-selected");
    roundCarouselPage.classList.add("has-detail", "is-opening");
    carouselDetail.classList.add("is-open");
    carouselDetail.setAttribute("aria-hidden", "false");
    carouselTransitionCard.hidden = false;
    Object.assign(
      carouselTransitionCard.style,
      carouselTransitionFrame(sourceRect, sourceRadius),
    );
    carouselTransitionCard.getBoundingClientRect();
    item.style.visibility = "hidden";

    if (reducedMotion.matches) {
      carouselDetail.classList.add("is-content-visible");
    } else {
      window.setTimeout(() => {
        if (carousel.detailOpen) {
          carouselDetail.classList.add("is-content-visible");
        }
      }, 610);
      await runCarouselTransition(
        sourceRect,
        targetRect,
        sourceRadius,
        true,
      );
    }

    carouselTransitionCard.hidden = true;
    roundCarouselPage.classList.remove("is-opening");
    carousel.detailAnimating = false;
    carouselDetailBack.focus({ preventScroll: true });
  };

  const closeCarouselDetail = async () => {
    if (!carousel.detailOpen || carousel.detailAnimating) return;

    carousel.detailAnimating = true;
    carouselDetailBack.disabled = true;
    await scrollCarouselDetailToTop();

    const item = carousel.selectedItem;
    const face = item.querySelector(".round-carousel-face--front");
    const targetRect = face.getBoundingClientRect();
    const fullRect = getCarouselDetailTarget();
    const targetRadius = getComputedStyle(face).borderRadius;

    carouselTransitionCard.hidden = false;
    carouselTransitionImage.src = item.dataset.source;
    Object.assign(
      carouselTransitionCard.style,
      carouselTransitionFrame(fullRect, "0px"),
    );
    carouselTransitionCard.getBoundingClientRect();
    carouselDetail.classList.remove("is-content-visible");
    carouselDetail.classList.add("is-closing");

    if (!reducedMotion.matches) {
      window.setTimeout(() => {
        roundCarouselPage.classList.remove("has-detail");
      }, 160);
      await runCarouselTransition(
        fullRect,
        targetRect,
        targetRadius,
        false,
      );
    } else {
      carouselDetail.classList.remove("is-open");
      carouselDetail.setAttribute("aria-hidden", "true");
    }

    item.style.visibility = "";
    carouselTransitionCard.hidden = true;
    carouselDetailBack.disabled = false;
    carouselDetail.classList.remove("is-open", "is-closing");
    carouselDetail.setAttribute("aria-hidden", "true");
    carousel.detailOpen = false;
    carousel.detailAnimating = false;
    carousel.selectedItem = null;
    roundCarouselPage.classList.remove("has-detail", "is-opening");
    item.classList.remove("is-selected");
    document.body.classList.remove("carousel-detail-open");
    item.focus({ preventScroll: true });
  };

  const carouselObserver = new IntersectionObserver(
    ([entry]) => {
      carousel.visible = entry.isIntersecting;
    },
    { threshold: 0.05 },
  );
  carouselObserver.observe(roundCarouselPage);

  const animateCarousel = (now) => {
    const delta = carousel.lastTime
      ? Math.min((now - carousel.lastTime) / 1000, 0.1)
      : 0;
    carousel.lastTime = now;

    if (
      carousel.visible &&
      !carousel.dragActive &&
      !carousel.detailOpen &&
      !reducedMotion.matches
    ) {
      if (Math.abs(carousel.velocity) > 0.01) {
        carousel.rotation += carousel.velocity * delta;
        carousel.velocity *= 0.94;
      } else {
        carousel.rotation += 12 * delta;
      }
    }

    applyCarouselRotation();
    requestAnimationFrame(animateCarousel);
  };

  const getCarouselItemAtPoint = (x, y) => {
    const candidates = [...roundCarouselRing.children]
      .map((item) => ({
        item,
        rect: item
          .querySelector(".round-carousel-face--front")
          .getBoundingClientRect(),
      }))
      .filter(
        ({ rect }) =>
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom,
      )
      .sort(
        (a, b) =>
          b.rect.width * b.rect.height - a.rect.width * a.rect.height,
      );
    return candidates[0]?.item || null;
  };

  roundCarouselPage.addEventListener("pointerdown", (event) => {
    if (carousel.detailOpen) return;
    if (reducedMotion.matches) {
      openProjectDetail(
        event.target.closest(".round-carousel-item"),
      );
      return;
    }
    roundCarouselPage.setPointerCapture?.(event.pointerId);
    carousel.dragActive = true;
    carousel.dragX = event.clientX;
    carousel.dragY = event.clientY;
    carousel.dragDistance = 0;
    carousel.pressedItem =
      event.target.closest(".round-carousel-item") ||
      getCarouselItemAtPoint(event.clientX, event.clientY);
    carousel.velocity = 0;
    roundCarouselPage.classList.add("is-dragging");
  });

  roundCarouselPage.addEventListener("pointermove", (event) => {
    if (!carousel.dragActive) return;
    const deltaX = event.clientX - carousel.dragX;
    const deltaY = event.clientY - carousel.dragY;
    carousel.dragX = event.clientX;
    carousel.dragY = event.clientY;
    carousel.dragDistance += Math.hypot(deltaX, deltaY);
    const rotationDelta = deltaX * 1.5;
    carousel.rotation += rotationDelta;
    carousel.velocity = rotationDelta * 60;
  });

  const releaseCarousel = (event) => {
    if (!carousel.dragActive) return;
    const selectedItem = carousel.pressedItem;
    const shouldOpen =
      event.type === "pointerup" &&
      selectedItem &&
      carousel.dragDistance < 8;
    roundCarouselPage.releasePointerCapture?.(event.pointerId);
    carousel.dragActive = false;
    carousel.pressedItem = null;
    roundCarouselPage.classList.remove("is-dragging");
    if (shouldOpen) openProjectDetail(selectedItem);
  };

  roundCarouselPage.addEventListener("pointerup", releaseCarousel);
  roundCarouselPage.addEventListener("pointercancel", releaseCarousel);
  roundCarouselRing.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const item = event.target.closest(".round-carousel-item");
    if (!item) return;
    event.preventDefault();
    openProjectDetail(item);
  });
  carouselDetailBack.addEventListener("click", closeCarouselDetail);
  window.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      carousel.detailOpen &&
      carouselDetail.classList.contains("is-open")
    ) {
      closeCarouselDetail();
    }
  });

  return { animateCarousel };
}
