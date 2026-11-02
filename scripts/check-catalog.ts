// Validates src/lib/db/catalog.ts. Run with `npm run catalog`.
// The catalog is loaded into the local database on first run; once a database
// exists, put further catalog changes in a new migration in src/lib/db/schema.ts.

import { LISTS, PROBLEMS, TOPICS } from "../src/lib/db/catalog.ts";
import { validateCatalog } from "../src/lib/db/validate-catalog.ts";

const errors = validateCatalog();
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `OK: ${TOPICS.length} topics, ${PROBLEMS.length} problems, ` +
    LISTS.map((l) => `${l.name} ${l.problems.length}`).join(", "),
);
