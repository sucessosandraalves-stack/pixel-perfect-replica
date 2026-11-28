import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { raspar } from "./firecrawl.server";

export const extrairRegistro = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ url: z.string().url().max(2000).regex(/^https?:\/\//) }).parse(d))
  .handler(async ({ data }) => raspar(data.url));
