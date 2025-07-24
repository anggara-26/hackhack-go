import { Request, Response } from "express";
import { RealtimeSessionOpenAPIResponseViewModel } from "@/types/session";
import errorHOC from "@/utils/errorHandler";

const createEphemeralToken = errorHOC(async (req: Request, res: Response) => {
  const r: globalThis.Response = await fetch(
    "https://api.openai.com/v1/realtime/sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "verse",
      }),
    }
  );
  const data = (await r.json()) as RealtimeSessionOpenAPIResponseViewModel;

  res.json(data);
});

export default { createEphemeralToken };
