"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";

type AuthMode = "signin" | "signup";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const message =
      mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);

    setSubmitting(false);

    if (message) {
      setError(message);
      return;
    }

    if (mode === "signup") {
      setInfo(
        "登録しました。メール確認が有効な場合は、確認メールのリンクを開いてからログインしてください。"
      );
      setMode("signin");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          企画提案プランナー
        </h1>
        <p className="text-sm text-gray-500 text-center mt-2 mb-8">
          メールとパスワードでログイン
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting
              ? "処理中..."
              : mode === "signin"
              ? "ログイン"
              : "新規登録"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === "signin" ? (
            <>
              アカウントをお持ちでない方は{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setInfo(null);
                }}
                className="text-indigo-600 hover:underline font-medium"
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              すでにアカウントがある方は{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
                className="text-indigo-600 hover:underline font-medium"
              >
                ログイン
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function SupabaseSetupScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-amber-200 shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900">Supabase の設定が必要です</h1>
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
          プロジェクト直下に <code className="text-xs bg-gray-100 px-1 rounded">.env.local</code>{" "}
          を作成し、Supabase の URL と anon key を設定してください。
        </p>
        <pre className="mt-4 p-4 bg-gray-900 text-gray-100 text-xs rounded-lg overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="text-sm text-gray-600 mt-4">
          続けて Supabase SQL Editor で{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">supabase/schema.sql</code>{" "}
          を実行し、Authentication で Email プロバイダを有効にしてください。
        </p>
      </div>
    </div>
  );
}
