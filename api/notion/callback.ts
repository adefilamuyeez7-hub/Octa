import { handleNotionCallback } from "../_lib/notion";

export default {
  async fetch(request: Request) {
    return handleNotionCallback(request);
  },
};
