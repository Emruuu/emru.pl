// Parser BBCode -> bezpieczny HTML
export function parseContent(text) {
    if (!text) return "";

    // Zabezpieczenie przed XSS: zamiana tagów HTML na encje
    let formatted = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Pogrubienie [b]
    formatted = formatted.replace(/\[b\](.*?)\[\/b\]/gi, "<strong>$1</strong>");

    // Kursywa [i]
    formatted = formatted.replace(/\[i\](.*?)\[\/i\]/gi, "<em>$1</em>");

    // Podkreślenie [u]
    formatted = formatted.replace(/\[u\](.*?)\[\/u\]/gi, "<u>$1</u>");

    // Przekreślenie [s]
    formatted = formatted.replace(/\[s\](.*?)\[\/s\]/gi, "<s>$1</s>");

    // Cytaty [quote]
    formatted = formatted.replace(/\[quote\](.*?)\[\/quote\]/gis, "<blockquote>$1</blockquote>");

    // Linki [link]
    formatted = formatted.replace(
        /\[link\](https?:\/\/[^\s]+)\[\/link\]/gi,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Listy [ul][li]
    formatted = formatted.replace(/\[ul\](.*?)\[\/ul\]/gis, "<ul>$1</ul>");
    formatted = formatted.replace(/\[li\](.*?)\[\/li\]/gi, "<li>$1</li>");

    return formatted;
}