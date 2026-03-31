import { FormEvent, useEffect, useState } from "react";
import { aqbobekApi } from "@/shared/api/aqbobek-service";
import { formatDateTime } from "@/shared/lib/format";
import type { LeaderboardRow, PortfolioListPayload, SocialFeedPayload } from "@/shared/types/domain";
import { Button, Card, DataState, Field, PageHeader, TextAreaField } from "@/shared/ui/primitives";
import { useSession } from "@/features/session/session-context";

export function SocialWallPage() {
  const [feed, setFeed] = useState<SocialFeedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setFeed(await aqbobekApi.student.getSocialFeed());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить ленту");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onPost(event: FormEvent) {
    event.preventDefault();
    await aqbobekApi.student.createSocialPost(postText);
    setPostText("");
    await load();
  }

  async function onComment(postId: string) {
    await aqbobekApi.student.createSocialComment(postId, drafts[postId] || "");
    setDrafts((current) => ({ ...current, [postId]: "" }));
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Student-parent progress wall" description="Общая лента прогресса для ученика и родителя. Сообщения и комментарии уходят в backend social feed." />
      <Card>
        <form className="space-y-4" onSubmit={(event) => void onPost(event)}>
          <TextAreaField label="Новый пост" value={postText} onChange={(event) => setPostText(event.target.value)} placeholder="Поделитесь прогрессом, победой или запросом на поддержку..." />
          <Button type="submit" disabled={!postText.trim()}>Опубликовать</Button>
        </form>
      </Card>
      <DataState loading={loading} error={error} hasData={Boolean(feed?.posts.length)} empty="Пока нет постов.">
        <div className="space-y-4">
          {feed?.posts.map((post) => (
            <Card key={post.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-950">{post.author_name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{post.author_role}</p>
                </div>
                <p className="text-sm text-slate-500">{formatDateTime(post.created_at)}</p>
              </div>
              <p className="text-sm leading-6 text-slate-700">{post.content}</p>
              <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-950">{comment.author_name}</span>: {comment.text}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <Field
                  className="flex-1"
                  label="Комментарий"
                  value={drafts[post.id] || ""}
                  onChange={(event) => setDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                  placeholder="Добавить комментарий"
                />
                <Button className="self-end" onClick={() => void onComment(post.id)} disabled={!(drafts[post.id] || "").trim()}>
                  Комментировать
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}

export function PortfolioPage({ reviewMode = false }: { reviewMode?: boolean }) {
  const { user } = useSession();
  const [portfolio, setPortfolio] = useState<PortfolioListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState(user?.linked_student_id || "student_00001");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function load(activeStudentId?: string) {
    setLoading(true);
    setError(null);
    try {
      const payload = await aqbobekApi.student.getPortfolio(reviewMode ? activeStudentId || studentId : undefined);
      setPortfolio(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить портфолио");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [reviewMode]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    await aqbobekApi.student.createPortfolioItem({ title, description });
    setTitle("");
    setDescription("");
    await load();
  }

  async function onVerify(itemId: string) {
    await aqbobekApi.student.verifyPortfolioItem(itemId);
    await load(studentId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={reviewMode ? "Проверка портфолио" : "Цифровое портфолио"}
        description={reviewMode ? "Teacher/admin могут проверять достижения по student_id." : "Сбор сертификатов, олимпиад и достижений в единый профиль."}
      />
      {reviewMode ? (
        <Card className="flex flex-col gap-3 md:flex-row">
          <Field label="Student ID" value={studentId} onChange={(event) => setStudentId(event.target.value)} />
          <Button className="self-end" onClick={() => void load(studentId)}>Загрузить</Button>
        </Card>
      ) : (
        <Card>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => void onCreate(event)}>
            <Field label="Название" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Field label="Описание" value={description} onChange={(event) => setDescription(event.target.value)} className="md:col-span-2" />
            <div className="md:col-span-2">
              <Button type="submit" disabled={!title.trim() || !description.trim()}>Добавить достижение</Button>
            </div>
          </form>
        </Card>
      )}
      <DataState loading={loading} error={error} hasData={Boolean(portfolio?.items.length)} empty="Пока нет элементов портфолио.">
        <div className="grid gap-4 xl:grid-cols-2">
          {portfolio?.items.map((item) => (
            <Card key={item.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
              </div>
              <p className="text-sm text-slate-700">{item.description}</p>
              <p className="text-xs text-slate-500">Создано: {formatDateTime(item.created_at)}</p>
              {reviewMode && item.status !== "verified" ? (
                <Button variant="secondary" onClick={() => void onVerify(item.id)}>Подтвердить</Button>
              ) : null}
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}

export function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        setRows(await aqbobekApi.student.getLeaderboard());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить лидерборд");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Геймификация и лидерборд" description="Рейтинг роста и стабильности, собранный из improvement score и attendance patterns." />
      <DataState loading={loading} error={error} hasData={rows.length > 0} empty="Лидерборд пока пуст.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row, index) => (
            <Card key={row.student_id} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">#{index + 1}</p>
              <p className="text-xl font-semibold text-slate-950">{row.student_name}</p>
              <p className="text-sm text-slate-600">{row.class_id}</p>
              <p className="text-3xl font-semibold text-sky-800">{row.improvement_score}</p>
              <p className="text-sm text-slate-600">{row.badge}</p>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}
