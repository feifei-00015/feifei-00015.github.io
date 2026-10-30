export function initSkills() {
  const serviceRevealElements = [
    ...document.querySelectorAll("[data-service-reveal]"),
  ];
  const servicesObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        servicesObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18 },
  );
  serviceRevealElements.forEach((element) =>
    servicesObserver.observe(element),
  );

}
