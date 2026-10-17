/* Homepage hero CTA test. Disable with enabled:false; use a new id for a new test. */
(function () {
  'use strict';
  var config = {
    enabled: true,
    id: 'hero_cta_copy_v1',
    labels: { A: 'Bestel de zomerfles', B: 'Ontdek jouw favoriet' },
    storageDays: 90
  };
  var button = document.getElementById('atc');
  var label = button && button.querySelector('.atc-label');
  if (!config.enabled || !label) return;

  var preview = !window.pinacelloProduction &&
    new URLSearchParams(window.location.search).get('cta_variant');
  var variant, key = 'pinacello-experiment-' + config.id;
  if (preview === 'A' || preview === 'B') {
    variant = preview;
  } else {
    try {
      var saved = JSON.parse(window.localStorage.getItem(key));
      if (saved && (saved.variant === 'A' || saved.variant === 'B') && saved.expires > Date.now()) {
        variant = saved.variant;
      } else {
        variant = Math.random() < 0.5 ? 'A' : 'B';
        window.localStorage.setItem(key, JSON.stringify({
          variant: variant, expires: Date.now() + config.storageDays * 86400000
        }));
      }
    } catch (error) {
      // Without durable assignment, retain the original button outside the experiment.
      return;
    }
  }
  label.textContent = config.labels[variant];
  button.dataset.experimentId = config.id;
  button.dataset.variantId = variant;

  var exposed = false, inView = false, observer;
  function attributes(params) {
    params.experiment_id = config.id;
    params.variant_id = variant;
    return params;
  }
  function expose() {
    if (exposed || document.visibilityState === 'hidden') return;
    exposed = true;
    if (observer) observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    if (typeof gtag === 'function') gtag('event', 'experiment_impression', attributes({
      send_to: 'G-T758CLG2LQ', cta_placement: 'hero'
    }));
  }
  function onVisibility() { if (inView) expose(); }
  window.pinacelloExperiment = {
    decorate: function (params, link) {
      // Keyboard activation and fast clicks also count as exposure.
      if (link === button) expose();
      if (exposed) attributes(params);
      if (link === button) params.cta_placement = 'hero';
      return params;
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  if ('IntersectionObserver' in window) {
    observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target !== button) return;
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (inView) expose();
      });
    }, { threshold: 0.5 });
    observer.observe(button);
  }
  // Older browsers without IntersectionObserver count exposure on activation only.
})();
