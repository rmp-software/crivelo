// Prefilled "Pedir acesso" mailto, built with encodeURIComponent (spec <ui_copy>).
// The single "!" allowed on the whole page lives ONLY in this mailto body — it is
// never rendered as visible text, so the visible landing stays at zero "!".
const SUBJECT = "Acesso à Crema Arena";
const BODY = "Olá! Gostaria de pedir acesso à Crema Arena.\n\nNome:\nCasa de café:\nCidade:\n";

export const requestAccessMailto =
  "mailto:lucas.rmagalhaes@gmail.com" +
  "?subject=" +
  encodeURIComponent(SUBJECT) +
  "&body=" +
  encodeURIComponent(BODY);
