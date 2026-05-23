import { getNotionStatus } from "../_lib/notion";

export default {
  async fetch(request: Request) {
    return Response.json(getNotionStatus(request));
  },
};
