# Security

XSS is handled by never using `innerHTML`. All user content (original/optimized
XML, filenames, errors) goes to the DOM through `textContent` or `setAttribute`.

Downloads are safe too. `safeFilename()` strips path separators and control
characters from filenames in single downloads and `.zip` entries. ZIP names
are made unique without case-sensitive collisions. The writer rejects classic
ZIP count, filename, entry size, and archive size overflows.

Input is limited to 100 files, 5 MB per file, and 25 MB for the current batch.
The XML parser accepts only VectorDrawable and AnimatedVectorDrawable roots. It
rejects DOCTYPE declarations, text and CDATA nodes, excessive nesting, excessive
element counts, and invalid path commands or arc flags. These checks bound local
resource use and prevent malformed paths from being silently removed.

No external requests. The app never sends user data over the network. The only
fetches are same-origin static assets for the service worker.

No secrets, no backend.
