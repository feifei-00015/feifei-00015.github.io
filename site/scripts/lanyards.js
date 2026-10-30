import { clamp } from "./math.js";

export function initLanyards(reducedMotion) {
  const lanyardPage = document.querySelector("#lanyardPage");
  const computerFrame = document.querySelector(".retro-computer__frame");
  const lanyardUnits = [
    ...document.querySelectorAll("[data-lanyard]"),
  ];
  const createLanyardController = (unit) => {
    const card = unit.querySelector(".lanyard-card");
    const ropeBody = unit.querySelector(".lanyard-rope__body");
    const ropeDetail = unit.querySelector(".lanyard-rope__detail");
    const anchorRatio = Number(unit.dataset.anchor);
    const dropDelay = Number(unit.dataset.delay);
    const drift = Number(unit.dataset.drift) || 1;
    const state = {
      anchorX: 0,
      anchorY: -48,
      ropeLength: 300,
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      spinX: 0,
      spinY: 0,
      visible: false,
      entered: false,
      dropActive: false,
      dragging: false,
      pointerX: 0,
      pointerY: 0,
      offsetX: 0,
      offsetY: 0,
      lastPointerTime: 0,
      lastTime: 0,
    };

    const resize = () => {
      const previousAnchorX = state.anchorX;
      const pageRect = lanyardPage.getBoundingClientRect();
      const frameRect = computerFrame.getBoundingClientRect();
      state.anchorX =
        frameRect.left - pageRect.left + frameRect.width * anchorRatio;
      state.ropeLength = Math.min(
        330,
        lanyardPage.clientHeight * 0.45,
      );

      if (!state.x) {
        const initialOffset = drift * Math.min(48, state.ropeLength * 0.16);
        state.x = state.anchorX - initialOffset;
        state.y =
          state.anchorY +
          Math.sqrt(state.ropeLength ** 2 - initialOffset ** 2);
      } else {
        state.x += state.anchorX - previousAnchorX;
      }
    };

    const constrain = (delta, elastic = true) => {
      if (state.dropActive && state.y < state.anchorY) return false;

      const deltaX = state.x - state.anchorX;
      const deltaY = state.y - state.anchorY;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      if (distance <= state.ropeLength) return false;

      const normalX = deltaX / distance;
      const normalY = deltaY / distance;
      const radialVelocity =
        state.velocityX * normalX + state.velocityY * normalY;

      if (elastic) {
        const stretch = distance - state.ropeLength;
        const springAcceleration = stretch * 72 + radialVelocity * 7;
        state.velocityX -= normalX * springAcceleration * delta;
        state.velocityY -= normalY * springAcceleration * delta;

        const maximumLength = state.ropeLength + 56;
        if (distance > maximumLength) {
          state.x = state.anchorX + normalX * maximumLength;
          state.y = state.anchorY + normalY * maximumLength;
          if (radialVelocity > 0) {
            state.velocityX -= radialVelocity * normalX * 1.28;
            state.velocityY -= radialVelocity * normalY * 1.28;
          }
        }
      } else {
        const dragLength = state.ropeLength + 34;
        if (distance > dragLength) {
          state.x = state.anchorX + normalX * dragLength;
          state.y = state.anchorY + normalY * dragLength;
        }
      }

      return true;
    };

    const render = () => {
      const deltaX = state.x - state.anchorX;
      const deltaY = state.y - state.anchorY;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const slack = Math.max(0, state.ropeLength - distance);
      const middleX = (state.anchorX + state.x) / 2;
      const middleY =
        (state.anchorY + state.y) / 2 +
        slack * 0.62 +
        Math.min(32, Math.abs(state.velocityX) * 0.012);
      const curve = `M ${state.anchorX} ${state.anchorY} Q ${middleX} ${middleY} ${state.x} ${state.y}`;

      ropeBody.setAttribute("d", curve);
      ropeDetail.setAttribute("d", curve);
      card.style.transform = `translate3d(${state.x - card.offsetWidth / 2}px, ${state.y}px, 0) rotateZ(${state.rotationZ}deg) rotateY(${state.rotationY}deg) rotateX(${state.rotationX}deg)`;
    };

    const beginDrop = () => {
      if (state.entered) return;
      state.entered = true;
      unit.classList.add("is-revealed");

      if (reducedMotion.matches) {
        state.x = state.anchorX;
        state.y = state.anchorY + state.ropeLength;
        render();
        return;
      }

      state.dropActive = true;
      state.x = state.anchorX - 68 * drift;
      state.y = -card.offsetHeight - 64;
      state.velocityX = 96 * drift;
      state.velocityY = 0;
      state.rotationX = -4 * drift;
      state.rotationY = -12 * drift;
      state.rotationZ = -9 * drift;
      state.spinX = 7 * drift;
      state.spinY = 34 * drift;
      render();
    };

    const startDrop = () => {
      if (state.entered) return;
      if (reducedMotion.matches || dropDelay <= 0) {
        beginDrop();
      } else {
        window.setTimeout(beginDrop, dropDelay);
      }
    };

    const pointerPosition = (event) => {
      const rect = lanyardPage.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const release = (event) => {
      if (!state.dragging) return;
      if (
        event?.pointerId != null &&
        card.hasPointerCapture?.(event.pointerId)
      ) {
        card.releasePointerCapture(event.pointerId);
      }
      state.dragging = false;
      state.velocityX = clamp(state.velocityX, -360, 360) * 0.72;
      state.velocityY = clamp(state.velocityY, -320, 320) * 0.68;
      card.classList.remove("is-dragging");
    };

    card.addEventListener("pointerdown", (event) => {
      if (reducedMotion.matches) return;
      event.preventDefault();
      const pointer = pointerPosition(event);
      card.setPointerCapture?.(event.pointerId);
      state.dropActive = false;
      state.dragging = true;
      state.pointerX = pointer.x;
      state.pointerY = pointer.y;
      state.offsetX = pointer.x - state.x;
      state.offsetY = pointer.y - state.y;
      state.lastPointerTime = event.timeStamp;
      card.classList.add("is-dragging");
    });

    card.addEventListener("pointermove", (event) => {
      if (!state.dragging) return;
      const pointer = pointerPosition(event);
      const elapsed = Math.max(8, event.timeStamp - state.lastPointerTime);
      const moveX = pointer.x - state.pointerX;
      const moveY = pointer.y - state.pointerY;
      state.pointerX = pointer.x;
      state.pointerY = pointer.y;
      state.lastPointerTime = event.timeStamp;
      state.spinY = clamp((moveX / elapsed) * 300, -360, 360);
      state.spinX = clamp((-moveY / elapsed) * 110, -120, 120);
    });

    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", release);
    card.addEventListener("lostpointercapture", release);

    const animate = (now) => {
      const delta = state.lastTime
        ? Math.min((now - state.lastTime) / 1000, 0.033)
        : 0;
      state.lastTime = now;

      if (state.visible && !reducedMotion.matches) {
        if (state.dragging) {
          const nextX = state.pointerX - state.offsetX;
          const nextY = state.pointerY - state.offsetY;
          if (delta > 0) {
            state.velocityX = clamp(
              (nextX - state.x) / delta,
              -520,
              520,
            );
            state.velocityY = clamp(
              (nextY - state.y) / delta,
              -420,
              420,
            );
          }
          state.x = nextX;
          state.y = nextY;
          constrain(delta, false);
        } else {
          state.velocityY += 1120 * delta;
          const damping = Math.pow(0.987, delta * 60);
          state.velocityX *= damping;
          state.velocityY *= damping;
          state.x += state.velocityX * delta;
          state.y += state.velocityY * delta;
          const reachedRopeLimit = constrain(delta, true);
          if (state.dropActive && reachedRopeLimit) {
            state.dropActive = false;
          }
        }

        state.rotationY += state.spinY * delta;
        state.rotationX += state.spinX * delta;
        state.spinY *= Math.pow(
          state.dropActive ? 0.992 : 0.955,
          delta * 60,
        );
        state.spinX *= Math.pow(
          state.dropActive ? 0.988 : 0.93,
          delta * 60,
        );
        state.rotationX *= Math.pow(
          state.dropActive ? 0.988 : 0.93,
          delta * 60,
        );

        if (
          !state.dragging &&
          !state.dropActive &&
          Math.abs(state.spinY) < 80
        ) {
          const restingFace = Math.round(state.rotationY / 180) * 180;
          state.rotationY +=
            (restingFace - state.rotationY) * Math.min(1, delta * 3.2);
        }

        const swingAngle =
          state.dropActive && state.y < state.anchorY
            ? clamp((state.x - state.anchorX) * 0.12, -10, 10)
            : -Math.atan2(
                state.x - state.anchorX,
                state.y - state.anchorY,
              ) *
              (180 / Math.PI) *
              0.2;
        state.rotationZ +=
          (swingAngle - state.rotationZ) *
          Math.min(1, delta * (state.dropActive ? 3.5 : 9));
      }

      render();
    };

    return { animate, release, resize, startDrop, state };
  };

  const lanyards = lanyardUnits.map(createLanyardController);
  let lanyardSequenceStarted = false;
  const lanyardObserver = new IntersectionObserver(
    ([entry]) => {
      lanyardPage.classList.toggle(
        "is-contact-active",
        entry.intersectionRatio >= 0.45,
      );
      lanyards.forEach((controller) => {
        controller.state.visible = entry.isIntersecting;
      });
      if (entry.intersectionRatio >= 0.85 && !lanyardSequenceStarted) {
        lanyardSequenceStarted = true;
        lanyards.forEach((controller) => controller.startDrop());
      }
    },
    { threshold: [0, 0.45, 0.85] },
  );
  lanyardObserver.observe(lanyardPage);

  const animateLanyards = (now) => {
    lanyards.forEach((controller) => controller.animate(now));
    requestAnimationFrame(animateLanyards);
  };

  const releaseLanyards = (event) => {
    lanyards.forEach((controller) => controller.release(event));
  };
  window.addEventListener("pointerup", releaseLanyards);
  window.addEventListener("pointercancel", releaseLanyards);
  window.addEventListener("blur", () => releaseLanyards());

  return { lanyards, animateLanyards };
}
