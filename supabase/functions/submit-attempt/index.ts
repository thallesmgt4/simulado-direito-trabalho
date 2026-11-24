// Edge Function: valida respostas no servidor e registra uma tentativa.
// O gabarito fica somente nesta função, nunca no navegador.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ANSWER_KEY: Record<number, number> = {
  "1": 1,
  "2": 1,
  "3": 2,
  "4": 1,
  "5": 1,
  "6": 0,
  "7": 1,
  "8": 1,
  "9": 1,
  "10": 2,
  "11": 1,
  "12": 1,
  "13": 2,
  "14": 2,
  "15": 1,
  "16": 1,
  "17": 2,
  "18": 0,
  "19": 3,
  "20": 1,
  "21": 1,
  "22": 1,
  "23": 1,
  "24": 2,
  "25": 1,
  "26": 1,
  "27": 0,
  "28": 0,
  "29": 1,
  "30": 2,
  "31": 1,
  "32": 1,
  "33": 1,
  "34": 1,
  "35": 1,
  "36": 1,
  "37": 1,
  "38": 1,
  "39": 0,
  "40": 2
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405, headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return Response.json({ error: "Faça login para enviar o resultado." }, { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user) {
      return Response.json({ error: "Sessão inválida. Entre novamente." }, { status: 401, headers: corsHeaders });
    }
    if (!user.email_confirmed_at) {
      return Response.json({ error: "Confirme seu e-mail antes de enviar resultados." }, { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const answers = body?.answers;
    const elapsedSeconds = Number(body?.elapsedSeconds);

    if (!Array.isArray(answers) || answers.length !== 40 ||
        !Number.isInteger(elapsedSeconds) || elapsedSeconds < 1 || elapsedSeconds > 86400) {
      return Response.json({ error: "Dados da tentativa inválidos." }, { status: 400, headers: corsHeaders });
    }

    const seen = new Set<number>();
    const results: Array<{ question: number; selectedOption: number; correctOption: number; isCorrect: boolean }> = [];
    let score = 0;
    for (const item of answers) {
      const question = Number(item?.question);
      const selectedOption = Number(item?.selectedOption);
      if (!Number.isInteger(question) || !(question in ANSWER_KEY) ||
          !Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption > 3 ||
          seen.has(question)) {
        return Response.json({ error: "Respostas incompletas ou inválidas." }, { status: 400, headers: corsHeaders });
      }
      seen.add(question);
      const correctOption = ANSWER_KEY[question];
      const isCorrect = correctOption === selectedOption;
      if (isCorrect) score++;
      results.push({ question, selectedOption, correctOption, isCorrect });
    }
    if (seen.size !== 40) {
      return Response.json({ error: "É necessário responder às 40 questões." }, { status: 400, headers: corsHeaders });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: insertError } = await admin.from("quiz_attempts").insert({
      user_id: user.id,
      score,
      total_questions: 40,
      elapsed_seconds: elapsedSeconds,
    });
    if (insertError) throw insertError;

    const { data: leaderboard, error: rankingError } = await admin.rpc("get_quiz_leaderboard");
    if (rankingError) throw rankingError;

    return Response.json({ score, total: 40, percentage: Math.round(score / 40 * 100), results, leaderboard }, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("submit-attempt:", error);
    return Response.json({ error: "Não foi possível salvar o resultado. Tente novamente." }, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
