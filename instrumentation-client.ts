import { initBotId } from "botid/client/core";

// Pages that invoke a Server Action worth protecting (createPost, react)
// via a <form action={...}> submission — those POST back to the page path.
initBotId({
  protect: [
    { path: "/", method: "POST" },
    { path: "/search", method: "POST" },
    { path: "/post/*", method: "POST" },
  ],
});
