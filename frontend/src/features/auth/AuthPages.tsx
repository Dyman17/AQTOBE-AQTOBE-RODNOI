import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getHomePathForRole } from "@/features/navigation/workspace-config";
import { useSession } from "@/features/session/session-context";
import { Button, Card, Field, PageHeader } from "@/shared/ui/primitives";

function AuthScaffold({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { session, user } = useSession();
  const activeRole = user?.role || session?.role || null;

  if (activeRole) {
    return <Navigate to={getHomePathForRole(activeRole)} replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <PageHeader title={title} description={description} actions={<Link to="/"><Button variant="ghost">На стартовый экран</Button></Link>} />
        {children}
      </div>
    </div>
  );
}

export function SignInPage() {
  const navigate = useNavigate();
  const { signInWithCredentials } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const role = await signInWithCredentials(email, password);
      navigate(getHomePathForRole(role));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScaffold title="Вход по аккаунту" description="Email/password flows для student и parent. Backend сам определит роль и свяжет вас с нужным workspace.">
      <Card>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label="Email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@aqbobek.kz" />
          <Field
            label="Пароль"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
          />
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Входим..." : "Войти"}</Button>
            <Link to="/auth/register/student"><Button variant="secondary" type="button">Регистрация ученика</Button></Link>
            <Link to="/auth/register/parent"><Button variant="ghost" type="button">Регистрация родителя</Button></Link>
          </div>
        </form>
      </Card>
    </AuthScaffold>
  );
}

export function StudentRegistrationPage() {
  const navigate = useNavigate();
  const { registerStudent } = useSession();
  const [form, setForm] = useState({ name: "", class_id: "10A", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const role = await registerStudent(form);
      navigate(getHomePathForRole(role));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Регистрация не удалась");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScaffold title="Регистрация ученика" description="Создание student account с привязкой к классу и мгновенным входом в student workspace.">
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Имя" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Field label="Класс" value={form.class_id} onChange={(event) => setForm((current) => ({ ...current, class_id: event.target.value.toUpperCase() }))} />
          <Field
            label="Email"
            className="md:col-span-2"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <Field
            label="Пароль"
            type="password"
            className="md:col-span-2"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          {error ? <p className="text-sm text-rose-700 md:col-span-2">{error}</p> : null}
          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "Создаём аккаунт..." : "Создать аккаунт"}</Button>
            <Link to="/auth/sign-in"><Button variant="secondary" type="button">Уже есть аккаунт</Button></Link>
          </div>
        </form>
      </Card>
    </AuthScaffold>
  );
}

export function ParentRegistrationPage() {
  const navigate = useNavigate();
  const { registerParent } = useSession();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    child_student_email: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const role = await registerParent(form);
      navigate(getHomePathForRole(role));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Регистрация не удалась");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScaffold title="Регистрация родителя" description="Parent account связывается с ребёнком через student email из backend mock data или уже созданного аккаунта ученика.">
      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Имя" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <Field label="Ваш email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <Field
            label="Пароль"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <Field
            label="Email ученика"
            value={form.child_student_email}
            onChange={(event) => setForm((current) => ({ ...current, child_student_email: event.target.value }))}
          />
          {error ? <p className="text-sm text-rose-700 md:col-span-2">{error}</p> : null}
          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" disabled={loading}>{loading ? "Создаём аккаунт..." : "Создать аккаунт"}</Button>
            <Link to="/auth/sign-in"><Button variant="secondary" type="button">Уже есть аккаунт</Button></Link>
          </div>
        </form>
      </Card>
    </AuthScaffold>
  );
}

export function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">403</p>
          <h1 className="text-3xl font-semibold text-slate-950">Доступ запрещён</h1>
          <p className="text-sm leading-6 text-slate-600">У этой сессии нет прав на запрошенный workspace. Вернитесь на стартовый экран и войдите под нужной ролью.</p>
          <Link to="/"><Button>На стартовый экран</Button></Link>
        </Card>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">404</p>
          <h1 className="text-3xl font-semibold text-slate-950">Страница не найдена</h1>
          <p className="text-sm leading-6 text-slate-600">Маршрут отсутствует или был перемещён при перестройке frontend workspace.</p>
          <Link to="/"><Button>Вернуться в портал</Button></Link>
        </Card>
      </div>
    </div>
  );
}
