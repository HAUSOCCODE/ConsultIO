export function formatPersonName(name = "") {
  if (typeof name !== "string") return "";

  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (!word) return "";
      if (word.toLowerCase() === "socconsult") return "SOCConsult";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

const PERSON_ACTION_PATTERN =
  /^(.+?) (submitted|cancelled|requested|selected|completed)\b/i;

export function formatPersonNameInNotification(message = "") {
  if (typeof message !== "string") return "";
  return message.replace(PERSON_ACTION_PATTERN, (match, name, action) =>
    match.replace(`${name} ${action}`, `${formatPersonName(name)} ${action}`),
  );
}
