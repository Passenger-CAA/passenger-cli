import { ProseMirrorContent, ProseMirrorDocument } from "../../types/prose";

export function extractTextFromProseMirrorJSON(
  pmJSON: ProseMirrorDocument
): string {
  if (!pmJSON.content) return "";

  let extractedText = "";

  function processContent(content: ProseMirrorContent): void {
    switch (content.type) {
      case "text":
        if (content.text) {
          if (
            content.marks &&
            content.marks.some((mark) => mark.type === "strong")
          ) {
            extractedText += `**${content.text}**`;
          } else {
            extractedText += content.text;
          }
        }
        break;
      case "paragraph":
        if (content.content) {
          content.content.forEach(processContent);
          extractedText += "\n\n"; // Add two new lines after a paragraph for clarity.
        }
        break;
      case "orderedList":
      case "bulletList":
      case "listItem":
        if (content.content) {
          content.content.forEach(processContent);
          extractedText += "\n"; // Add a new line for each list item.
        }
        break;
      default:
        if (content.content) {
          content.content.forEach(processContent);
        }
        break;
    }
  }

  pmJSON.content.forEach(processContent);
  return extractedText.trim(); // The `trim` ensures we don't have unnecessary whitespace at the start or end.
}
