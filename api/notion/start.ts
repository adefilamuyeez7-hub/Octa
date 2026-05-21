import { handleNotionStart } from "../_lib/notion";

export default {
  async fetch(request: Request) {
    return handleNotionStart(request);
  },
};
