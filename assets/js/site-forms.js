(function () {
  const SUBMITTING_LABEL = "Odesílám…";
  const SUCCESS_MESSAGE = "Děkujeme, odpověď byla odeslána.";
  const ERROR_MESSAGE = "Odeslání se nepovedlo. Zkuste to prosím znovu.";

  const setupGoogleForms = forms => {
    for (const form of forms) {
      const status = form.querySelector("[data-form-status]");
      const submitButton = form.querySelector('button[type="submit"]');
      const defaultLabel = submitButton?.getAttribute("data-submit-label") || submitButton?.textContent || "";

      form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!form.reportValidity()) {
          return;
        }

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = SUBMITTING_LABEL;
        }

        if (status) {
          status.textContent = "";
        }

        try {
          await fetch(form.action, {
            method: "POST",
            mode: "no-cors",
            body: new FormData(form)
          });

          const successUrl = form.getAttribute("data-success-url");

          if (successUrl) {
            window.location.assign(successUrl);
            return;
          }

          form.reset();

          if (status) {
            status.textContent = SUCCESS_MESSAGE;
          }
        } catch (error) {
          if (status) {
            status.textContent = ERROR_MESSAGE;
          }
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = defaultLabel;
          }
        }
      });
    }
  };

  window.setupGoogleForms = setupGoogleForms;
})();
